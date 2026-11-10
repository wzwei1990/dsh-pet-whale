// 从一张立绘生成 Live2D 模型：驱动 PSD2Live 的 MCP 完成
//   建工程 → 导入分层 → 标 role → rig_generate → 补眨眼关键形 → 导出 moc3 / web
//
// 前置：psd2live 桌面应用在跑（默认 http://127.0.0.1:23871/mcp，Bearer token 从应用界面拿）。
// 前置：分层 PNG 已由 cut_sam.py + post_masks.py 生成到 spec.sam.outDir/anchored/。
//
// 用法：
//   PSD2LIVE_TOKEN=xxx node tools/live2d/build_model.mjs tools/live2d/part-spec.json
//   （或 --token=xxx；--dry 只打印计划不写）
//
// 说明：这里只用 HTTP 直连 MCP，不依赖 DSH 的 MCP 连接器，因此可以脱离 agent 环境独立跑。

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const dry = argv.includes('--dry')
const tokenArg = argv.find((a) => a.startsWith('--token='))?.slice('--token='.length)
const token = tokenArg || process.env.PSD2LIVE_TOKEN
const specPath = resolve(argv.find((a) => !a.startsWith('--')) ?? join(here, 'part-spec.json'))
const ENDPOINT = process.env.PSD2LIVE_ENDPOINT || 'http://127.0.0.1:23871/mcp'

if (!token && !dry) {
  console.error('缺少 token：设 PSD2LIVE_TOKEN 或传 --token=（PSD2Live 界面里的 Bearer token）')
  process.exit(1)
}

const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const outDir = resolve(here, spec.sam.outDir)
const anchored = join(outDir, 'anchored')

// ── 极简 MCP client（streamable HTTP + JSON-RPC） ───────────────────────────
let sessionId = null
let rpcId = 0

async function rpc(method, params) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  })
  sessionId = res.headers.get('mcp-session-id') ?? sessionId
  const text = await res.text()
  const line = text.split('\n').find((l) => l.trim().startsWith('{'))
  if (!line) throw new Error(`${method} 无 JSON 响应：${text.slice(0, 200)}`)
  const json = JSON.parse(line)
  if (json.error) throw new Error(`${method} 失败：${JSON.stringify(json.error).slice(0, 400)}`)
  return json.result
}

async function init() {
  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'pet-whale-live2d', version: '0.0.0' },
  })
  await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }).catch(() => {})
}

/** 调一个 PSD2Live 操作；带 state 的写操作会自动串上上一次返回的 state */
async function callOp(operation, request) {
  const args = { operation, request }
  const result = await rpc('tools/call', { name: 'workspace_call', arguments: args })
  const payload = parseToolResult(result)
  if (payload && payload.ok === false) throw new Error(`${operation}: ${JSON.stringify(payload.error).slice(0, 400)}`)
  return payload
}

function parseToolResult(result) {
  const content = result?.content ?? []
  const text = content.find((c) => c.type === 'text')?.text
  if (!text) return result
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

// ── 主流程 ────────────────────────────────────────────────────────────────
const IGNORE = new Set(['//'])

/** 按 order 拼出导入顺序：部件 + 派生层（residual / eye_close） */
function buildLayerPlan() {
  const items = []
  for (const p of spec.parts) {
    items.push({ order: p.order, file: join(anchored, `part-${p.name}.png`), role: p.role, name: p.name })
  }
  const d = spec.derived ?? {}
  if (d.residual?.enabled) {
    items.push({ order: d.residual.order, file: join(anchored, 'part-residual.png'), role: d.residual.role, name: 'residual' })
  }
  if (d.eyeClose?.enabled) {
    items.push({ order: d.eyeClose.order, file: join(anchored, 'part-eye_close.png'), role: d.eyeClose.role, name: 'eye_close' })
  }
  return items.sort((a, b) => a.order - b.order)
}

async function main() {
  const { width, height } = spec.canvas
  const layers = buildLayerPlan()
  console.log(`[plan] ${layers.length} 层，画布 ${width}x${height}`)
  for (const l of layers) console.log(`  ${String(l.order).padStart(2)} ${l.name.padEnd(12)} role=${l.role}`)
  if (dry) return

  await init()
  console.log('[mcp] initialized')

  // 现状：拿 state
  const insp = await callOp('workspace_inspect', { scope: 'project' })
  let state = insp?.data?.state
  if (!state) throw new Error('拿不到 state，确认 PSD2Live 在运行')

  // 建工程（会丢弃未保存改动——这是 agent 工作区，不是用户工程）
  const created = await callOp('project_create', { state, width, height, discard_unsaved: true })
  const projectId = created?.data?.result?.project_id ?? created?.data?.project_id
  state = created?.data?.result?.state ?? created?.data?.state
  console.log('[project]', projectId, state)

  // 导入分层（一次调用，顺序 = 层序）
  const imported = await callOp('layer_import_images', { state, paths: layers.map((l) => l.file) })
  const ids = imported?.data?.result?.affectedLayerIds ?? imported?.data?.affectedLayerIds ?? []
  state = imported?.data?.result?.state ?? imported?.data?.state
  if (ids.length !== layers.length) throw new Error(`导入层数不符：${ids.length} != ${layers.length}`)

  // 批量标 role
  const edits = ids.map((layerId, i) => ({ operation: 'layer_classify', request: { layer_id: layerId, role: layers[i].role } }))
  const classified = await callOp('workspace_apply_edits', { state, edits, summary: '按 spec 标 role' })
  state = classified?.data?.result?.state ?? classified?.data?.state
  console.log('[classify] ok')

  // 自动绑骨
  const rigged = await callOp('rig_generate', { state })
  state = rigged?.data?.result?.state ?? rigged?.data?.state
  console.log('[rig] ok')

  // 补眨眼关键形（PSD2Live 不会自动做）
  const blink = spec.rig?.blink
  if (blink?.enabled) {
    // 需要 mesh/warp 的真实 id：用 inspect 查
    const objs = await rpc('tools/call', {
      name: 'workspace_inspect',
      arguments: { request: { scope: 'objects', query: 'eye', limit: 20 } },
    })
    const list = parseToolResult(objs)?.data?.items ?? []
    const findTarget = (s) => {
      if (s.targetKind === 'warp') return list.find((o) => o.target === `warp:${s.targetName}`)?.target
      const part = layers.find((l) => l.name === s.targetPart)
      const idx = layers.indexOf(part)
      return list.find((o) => o.name === `part-${s.targetPart}`)?.target
    }
    const shapes = blink.shapes
      .map((s) => {
        const target = findTarget(s)
        if (!target) {
          console.warn(`[blink] 找不到目标 ${JSON.stringify(s)}，跳过`)
          return null
        }
        return { target, value: s.value, operations: [{ type: 'scale', factors: [1, s.scaleY], pivot: [0.5, 0.5] }] }
      })
      .filter(Boolean)
    if (shapes.length) {
      const authored = await callOp('author_axis', {
        state,
        parameter: { id: blink.parameter, default: 1, min: 0, max: 1 },
        shapes,
        summary: '眨眼：眼睛闭合形',
      })
      state = authored?.data?.result?.state ?? authored?.data?.state
      console.log('[blink] keyforms ok')
    }
  }

  // 导出
  const exp = spec.export ?? {}
  for (const target of exp.targets ?? ['moc3']) {
    const dir = resolve(here, target === 'web' ? exp.webDir : exp.moc3Dir)
    mkdirSync(dir, { recursive: true })
    const res = await callOp('project_export_target', { state, target, output_directory: dir })
    const files = res?.data?.result?.files ?? res?.data?.files ?? []
    const losses = res?.data?.result?.losses ?? res?.data?.losses ?? []
    state = res?.data?.result?.state ?? res?.data?.state ?? state
    console.log(`[export:${target}] ${files.length} files -> ${dir}`)
    if (losses.length) console.log('  losses:', JSON.stringify(losses))
  }
  console.log('[done] 记得把 web 导出的 4 个文件放进插件 assets，供 p2l.ts 加载')
}

main().catch((e) => {
  console.error('[fail]', e.message)
  process.exit(1)
})
