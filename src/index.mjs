// pet-whale 的 Node half：纯 UI 插件 + **自制 Live2D 模型资产** 的静态路由。
//
// 为什么需要 Node 半：p2l 运行时（p2l.js / p2l_runtime.wasm / *.p2lrt）必须通过 HTTP 取，
// 不能内联进 client bundle（wasm 与 10MB 级的模型文件不适合打包）。所以在这里挂
//   /pet-whale/live2d/<model>/{p2l.js, p2l_runtime.wasm, <model>.p2lrt}
//
// 安全约束：
// - 只服务 assets/live2d 目录内的文件（normalize + 前缀校验，拒绝 ../ 穿越）
// - 只允许白名单扩展名
// - 长缓存（模型文件按 hash 命名时可用 immutable；这里给 1 天 + ETag 用 mtime/size）
import { createReadStream, statSync } from 'node:fs'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ASSET_ROOT = resolve(here, '../assets/live2d')

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

export default function apply(ctx) {
  const webServer = ctx?.webServer
  if (!webServer?.register) {
    ctx?.logger?.('debug', '[pet-whale] 宿主未提供 webServer，跳过 /pet-whale/live2d 路由（自制模型将 404）')
    return
  }

  webServer.register({
    kind: 'prefix',
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
      const target = normalize(join(ASSET_ROOT, rel))
      if (!target.startsWith(ASSET_ROOT + sep) && target !== ASSET_ROOT) {
        res.writeHead(403)
        res.end('forbidden')
        return
      }
      const ext = target.slice(target.lastIndexOf('.')).toLowerCase()
      const type = MIME[ext]
      if (!type) {
        res.writeHead(403)
        res.end('forbidden type')
        return
      }
      let stat
      try {
        stat = statSync(target)
        if (!stat.isFile()) throw new Error('not a file')
      } catch {
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
  ctx?.logger?.('info', '[pet-whale] 已挂载 /pet-whale/live2d/*（自制 Live2D 模型资产）')
}
