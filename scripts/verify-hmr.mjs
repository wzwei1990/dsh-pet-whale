// 核对 profile 来源、启用状态，以及真实 DSH graph 所指 bundle。
// rev 是宿主不透明标识；0.1.7 用文件元数据计算，不能等同内容 hash。
// 用法：npm run verify:hmr -- --profile web（也支持 --profile=web）
// DSH_HOME / DSH_WEB_URL / DSH_WEB_TOKEN 可指向隔离验证环境。token 不输出。
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const profileIndex = argv.indexOf('--profile')
const profile = argv.find(a => a.startsWith('--profile='))?.slice(10) ?? (profileIndex < 0 ? 'web' : argv[profileIndex + 1])
if (!profile || !/^[\w-]+$/.test(profile)) throw new Error('无效 --profile 参数')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const name = pkg.name
const clientExport = pkg.exports?.['./client']
const clientRel = typeof clientExport === 'string' ? clientExport : clientExport?.default
const clientPath = typeof clientRel === 'string' ? resolve(root, clientRel) : ''
let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
const samePath = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
const hasClient = clientPath !== '' && existsSync(clientPath)
check('client bundle 存在', hasClient, clientRel ?? '缺少 ./client export')

const profileDir = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'profiles', profile)
let linked = false, enabled = false
try {
  const profilePkg = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'))
  const dep = profilePkg.dependencies?.[name] ?? profilePkg.devDependencies?.[name]
  if (typeof dep === 'string' && dep.startsWith('link:')) {
    linked = samePath(realpathSync(resolve(profileDir, dep.slice(5))), realpathSync(root))
  }
  enabled = profilePkg.dsh?.profile?.bundles?.includes(name) === true
} catch { /* 以下检查给出失败原因 */ }
check('profile link 指向当前仓库', linked, profileDir)
check('profile bundles 已启用插件', enabled)
let realOk = false
try { realOk = samePath(realpathSync(join(profileDir, 'node_modules', name)), realpathSync(root)) } catch {}
check('node_modules realpath 指向当前仓库', realOk)

const base = new URL(process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3080/')
if (!base.pathname.endsWith('/')) base.pathname += '/'
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 5000)
let reader
let cookie = ''
let graphOk = false, contentOk = false, detail = ''
const get = (url) => fetch(url, {
  signal: controller.signal, redirect: 'manual', headers: cookie ? { cookie } : {},
})
try {
  if (process.env.DSH_WEB_TOKEN) {
    const url = new URL(base)
    url.searchParams.set('token', process.env.DSH_WEB_TOKEN)
    const exchange = await get(url)
    cookie = exchange.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  }
  const res = await get(new URL('plugins/events', base))
  if (!res.ok) throw new Error(`/plugins/events HTTP ${res.status}`)
  reader = res.body.getReader()
  const decoder = new TextDecoder()
  let pending = '', graph
  while (!graph) {
    const { done, value } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    let end
    while ((end = /\r?\n\r?\n/.exec(pending)) !== null) {
      const frame = pending.slice(0, end.index)
      pending = pending.slice(end.index + end[0].length)
      const data = frame.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n')
      if (!data) continue
      const event = JSON.parse(data)
      if (event.type === 'graph') { graph = event.graph; break }
    }
  }
  await reader.cancel()
  reader = undefined
  const entry = graph?.entries?.find(e => e.id === name)
  if (!entry || typeof entry.rev !== 'string') throw new Error('DSH graph 没有 pet-whale 条目')
  graphOk = true
  // 旧宿主有单条 url；新宿主由包名与 rev 寻址单包资源。
  const url = new URL(entry.url ?? `plugins/${name}/client.js?rev=${encodeURIComponent(entry.rev)}`, base)
  if (url.origin !== base.origin) throw new Error('bundle URL 不属于当前宿主')
  const bundle = await get(url)
  if (!bundle.ok) throw new Error(`client bundle HTTP ${bundle.status}`)
  // 宿主可能补 sourceURL/sourceMappingURL；只剥离这两种尾部调试注释。
  const executable = text => text.replace(/^\/\/[#@] source(?:Mapping)?URL=.*$/gm, '').replaceAll('\r\n', '\n').trim()
  const served = executable(await bundle.text())
  const local = hasClient ? executable(readFileSync(clientPath, 'utf8')) : ''
  // 0.1.7 的单包 combo 也会在源码后追加独立分号；只接受这一种包装。
  contentOk = hasClient && (served === local || served === local + '\n;')
  detail = contentOk ? '宿主返回内容与本地一致' : '宿主返回内容与本地不一致'
} catch (error) {
  detail = error.name === 'AbortError' ? 'DSH 请求超过 5 秒' : error.message
} finally {
  if (reader) await reader.cancel().catch(() => {})
  controller.abort()
  clearTimeout(timer)
}
check('DSH graph 已注册插件', graphOk, detail)
check('DSH 实际 bundle 与本地内容一致', contentOk)
if (hasClient) console.log(`本地 SHA-256: ${createHash('sha256').update(readFileSync(clientPath)).digest('hex')}`)
console.log(failures === 0 ? 'HMR 来源与产物核对通过；实际热替换另做浏览器验证。' : `${failures} 项不通过。`)
process.exitCode = failures === 0 ? 0 : 1
