// 重启后的线上验证：检查 boot 清单含 pet-whale、client bundle 可下载、注册格式正确。
//
// 用法：node scripts/verify-live.mjs [base] [token]
//   base  默认 http://127.0.0.1:3080
//   token 启动输出里 ?token= 后面那串。dsh 的浏览器信任栅栏是这样工作的：
//         GET /?token=<token> 会 303 并下发一个 dsh-auth-* Cookie，之后带 Cookie 才 200；
//         直接打 / 是 401。所以这里先做一次换取，再把 Cookie 带上。
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const BASE = process.argv[2] ?? 'http://127.0.0.1:3080'
const TOKEN = process.argv[3] ?? ''

let cookie = ''
/** 带认证的取一次；401 时先用 token 换 Cookie 再重试。 */
async function get(url) {
  const absolute = url.startsWith('http') ? url : BASE + url
  const send = () => fetch(absolute, { headers: cookie === '' ? {} : { cookie }, redirect: 'manual' })
  let res = await send()
  if (res.status === 401 && TOKEN !== '') {
    const exchange = await fetch(`${BASE}/?token=${encodeURIComponent(TOKEN)}`, { redirect: 'manual' })
    const jars = exchange.headers.getSetCookie ? exchange.headers.getSetCookie() : []
    cookie = jars.map((c) => c.split(';')[0]).join('; ')
    res = await send()
  }
  return res
}

let failures = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`)
  if (!ok) failures++
}

const res = await get('/')
const html = await res.text()
check('主页 HTTP 200', res.status === 200, `status=${res.status}`)

const entryMatch = html.match(/\{"id":"pet-whale"[^}]*\}/)
check('boot 清单含 pet-whale 条目', entryMatch !== null)
if (entryMatch !== null) {
  const entry = JSON.parse(entryMatch[0])
  check('条目 url 存在', typeof entry.url === 'string' && entry.url.length > 0, entry.url)
  check('条目 rev 存在', typeof entry.rev === 'string' && entry.rev.length > 0)
  const inject = entry.inject ?? []
  // 0.1.2 起 @deepseek-ai/dsh-client-runtime 已被拆散删除，inject 只能列真实提供服务的包
  check('inject 不含已删除的 dsh-client-runtime', !inject.includes('@deepseek-ai/dsh-client-runtime'), JSON.stringify(inject))
  check(
    'inject 含 manifest 声明的全部提供方',
    manifest.dsh.client.inject.every((n) => inject.includes(n)),
    JSON.stringify(inject),
  )

  const url = new URL(entry.url, BASE)
  const jsRes = await get(url.href)
  const js = await jsRes.text()
  check('client bundle 可下载', jsRes.status === 200, `${url.pathname} (${js.length} 字节)`)
  check('bundle 是 __ModuleLoader__ 注册格式', js.includes('window.__ModuleLoader__.load'), '')
  check('bundle 注册 id 为 pet-whale', js.includes('"pet-whale"'))
  check('bundle 导出 inject', js.includes('exports.inject'))
  check('bundle 导出 apply', js.includes('exports.apply'))
}

console.log(failures === 0 ? '\n线上验证全部通过' : `\n${failures} 项失败`)
process.exitCode = failures === 0 ? 0 : 1
