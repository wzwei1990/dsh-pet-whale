// pet-whale 的 Node half：纯 UI 插件 + **自制 Live2D 模型资产** 的静态路由。
//
// 为什么需要 Node 半：p2l 运行时（p2l.js / p2l_runtime.wasm / *.p2lrt）必须通过 HTTP 取，
// 不能内联进 client bundle（wasm 与 10MB 级的模型文件不适合打包）。所以在这里挂
//   /pet-whale/live2d/<model>/{p2l.js, p2l_runtime.wasm, <model>.p2lrt}
//
// 安全约束：
// - 只服务允许的根目录内的文件（normalize + 前缀校验，拒绝 ../ 穿越）
// - 只允许白名单扩展名
// - 一天缓存 + ETag（mtime/size），模型换文件后自动失效
import { createReadStream, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * 资产查找顺序（先包内、后用户目录）：
 * 1. <包>/assets/live2d            —— 走本地 tgz/内置模型时用（仓库默认不含，见 .gitignore 说明）
 * 2. $DSH_HOME/dsh-pet/live2d      —— 从 GitHub 安装时的推荐位置：用户自己把
 *    {p2l.js, p2l_runtime.wasm, <name>.p2lrt} 丢进来即可，模型不必进仓库
 */
const DSH_DIR = process.env.DSH_HOME || join(homedir(), '.dsh')
const ASSET_ROOTS = [
  resolve(here, '../assets/live2d'),
  resolve(DSH_DIR, 'dsh-pet', 'live2d'),
]
/** 精灵帧素材根：包内 assets/sprite（默认 8 个动作）+ 用户目录 dsh-pet/sprite（可放全量 1040 个） */
const SPRITE_ROOTS = [
  resolve(here, '../assets/sprite'),
  resolve(DSH_DIR, 'dsh-pet', 'sprite'),
]
/** moc3 素材根：包内 assets/moc3（只放运行时，模型体量大不入库）+ 用户目录 dsh-pet/moc3（放模型） */
const MOC3_ROOTS = [
  resolve(here, '../assets/moc3'),
  resolve(DSH_DIR, 'dsh-pet', 'moc3'),
]

/**
 * 打日志。
 * 2026-11 实测：这个宿主的 `ctx.logger` 存在，但 info 级别不落 stdout（写去了别处），
 * 所以"有 logger 就用 logger"等于静默——dsh-tts 那些能看到的 `[dsh-tts][info] …`
 * 恰好是它的 console.log 兜底。这里改成**永远打 console.log**，
 * 再把同一条转给宿主 logger（它要过滤就过滤，不影响可见性）。
 */
function log(ctx, level, message) {
  const line = '[pet-whale][' + level + '] ' + message
  console.log(line)
  try {
    if (typeof ctx?.logger === 'function') ctx.logger(level, '[pet-whale] ' + message)
  } catch {
    /* 宿主 logger 不可用无所谓，console 已经打过了 */
  }
}
const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.p2lrt': 'application/octet-stream',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export const name = 'pet-whale'

/** webServer 用于给自制模型资产挂静态路由；没它时客户端仍可用（只是拿不到模型） */
export const inject = ['webServer']

/**
 * 具名导出 apply + 保留 default：cordis 若把入口当**裸函数**（default）解析，
 * 模块级的 `inject` 不会被采纳 → 访问 ctx.webServer 抛
 * `cannot get property "webServer" without inject`，或（加了兜底后）静默跳过、路由不注册。
 * 所以把 inject/name 同时挂到函数对象上，两种解析方式都能读到（2026-11 实测）。
 */
export function apply(ctx) {
  // 双保险：即使宿主/版本对 inject 的处理不同，也不让插件激活失败（大不了路由不挂）
  let webServer
  try {
    webServer = ctx?.webServer
  } catch {
    webServer = undefined
  }
  if (!webServer) {
    try {
      webServer = ctx?.get?.('webServer')
    } catch {
      webServer = undefined
    }
  }

  if (!webServer?.register) {
    log(ctx, 'warn', '宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）')
    return
  }

  /**
   * 造一个静态文件 handler：只服务 roots 内的文件、只放行白名单扩展名、拒绝 ../ 穿越。
   * 形状对齐 dsh-tts 上验证过的 register({ path, handler })——之前多带 kind:'prefix' 会静默不生效。
   */
  const staticHandler = (prefix, roots) => (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let rel
    try {
      rel = decodeURIComponent(url.pathname.replace(new RegExp('^' + prefix), ''))
    } catch {
      res.writeHead(400)
      res.end('bad path')
      return
    }

    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase()
    const type = MIME[ext]
    if (!type) {
      res.writeHead(403)
      res.end('forbidden type')
      return
    }

    let target = null
    let stat = null
    for (const root of roots) {
      const candidate = normalize(join(root, rel))
      if (!candidate.startsWith(root + sep) && candidate !== root) continue
      try {
        const s = statSync(candidate)
        if (!s.isFile()) continue
        target = candidate
        stat = s
        break
      } catch {
        /* 这个根里没有，试下一个 */
      }
    }
    if (!target || !stat) {
      res.writeHead(404)
      res.end('not found')
      return
    }

    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag })
      res.end()
      return
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      ETag: etag,
      // 换素材后要能立刻生效：no-cache + ETag（未变 304，变了重下）
      'Cache-Control': 'no-cache',
      'Cross-Origin-Resource-Policy': 'same-origin',
    })
    createReadStream(target).pipe(res)
  }

  webServer.register({ path: '/pet-whale/live2d', handler: staticHandler('/pet-whale/live2d', ASSET_ROOTS) })
  webServer.register({ path: '/pet-whale/sprite', handler: staticHandler('/pet-whale/sprite', SPRITE_ROOTS) })
  webServer.register({ path: '/pet-whale/moc3', handler: staticHandler('/pet-whale/moc3', MOC3_ROOTS) })

  log(ctx, 'info', '已挂载 /pet-whale/live2d/*、/pet-whale/sprite/*、/pet-whale/moc3/*（模型/精灵帧/Cubism 运行时）')
}

// cordis 若把入口当裸函数解析，就从函数属性上读 inject/name
apply.inject = inject

export default apply
