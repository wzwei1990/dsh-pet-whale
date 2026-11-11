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
const ASSET_ROOTS = [
  resolve(here, '../assets/live2d'),
  resolve(process.env.DSH_HOME || join(homedir(), '.dsh'), 'dsh-pet', 'live2d'),
]

/**
 * 打日志。照抄 dsh-tts 的写法：宿主 logger 是 `(level, message)` 两参函数，
 * 拿不到就退回 console.log —— 否则平台差异一出现，插件就彻底静默（2026-11 踩过）。
 */
function log(ctx, level, message) {
  const host = ctx
  try {
    if (typeof host?.logger === 'function') {
      host.logger(level, '[pet-whale] ' + message)
      return
    }
  } catch {
    /* 落下去走 console */
  }
  console.log('[pet-whale][' + level + '] ' + message)
}
const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.p2lrt': 'application/octet-stream',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
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

  webServer.register({
    // 形状对齐 dsh-tts（这个宿主上确认可用）：只给 path + handler。
    // 之前多带了 kind:'prefix'，register 不生效 → 路由静默不存在，
    // 于是选「自制模型」时 p2l.js / wasm / p2lrt 全 404、宠物直接不显示。
    path: '/pet-whale/live2d',
    handler: (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      let rel
      try {
        rel = decodeURIComponent(url.pathname.replace(/^\/pet-whale\/live2d/, ''))
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

      // 依次在包内 / 用户目录里找；都找不到才 404
      let target = null
      let stat = null
      for (const root of ASSET_ROOTS) {
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
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'same-origin',
      })
      createReadStream(target).pipe(res)
    },
  })

  log(ctx, 'info', '已挂载 /pet-whale/live2d/*（自制 Live2D 模型资产）')
}

// cordis 若把入口当裸函数解析，就从函数属性上读 inject/name
apply.inject = inject

export default apply
