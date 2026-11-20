/**
 * pet-whale 桌面端主进程。
 *
 * 形态参考 PC2005-cloud/dsh-pet 的 runtime/electron-helper：
 * 透明无边框窗口 + alwaysOnTop('screen-saver') + 置顶看门狗 + 托盘 + 点击穿透。
 *
 * 页面由本进程起一个只监听 127.0.0.1 的静态服务提供（sprite 素材 + 渲染 bundle），
 * 避免 file:// 下 fetch 被拦。
 *
 * 与网页端的关系：
 * - 网页端把聚合状态 POST 到 DSH 的 /pet-whale/api/presence；这里轮询它跟随动画
 * - 两者同时开时，网页端会自动收起自己的桌宠（见 client/index.ts）
 * - 单实例锁：重复启动直接退出，避免两只桌面桌宠
 */
import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen } from 'electron'
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { clampToWorkArea, computeWindowRect } from './window-fit.mjs'

const here = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]+$/, '')
const root = resolve(process.env.PET_WHALE_ROOT ?? join(here, '..', '..'))
const appDir = here
const dshUrl = (process.env.PET_WHALE_DSH_URL ?? 'http://127.0.0.1:3080').replace(/\/$/, '')

const TRAY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAxklEQVR4nO2XYQ7CIAyF2xfvpCdwV9ITzCu5E7hTzfDHbAswCqU10feLrPR9pTCyEf26uCbpenstqdj0uIg8WQPaUgx6wUvzuAdY0g1YwHN+sIDnfEHOgtXqU/6whMc4IGedpAnP8fwZD/dZHN+LS9u/Nt4rgI7iqbsB5Cx4F8DSN0DzDIQtEBegqf8ZCELtl4xG+zcFeAlfVcBktA1rDnLB3vBoAdZC7GGvLsR8IZmsDQ8qgrRc00cLgYZJSx7XGGv+G7rrDdBnXSu8uMOzAAAAAElFTkSuQmCC'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
}

const serveDir = (base) => (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  let rel = decodeURIComponent(url.pathname)
  if (rel === '/' || rel === '') rel = '/index.html'
  const target = normalize(join(base, rel))
  if (!target.startsWith(base + sep) && target !== base) {
    res.writeHead(403).end('forbidden')
    return
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  })
  createReadStream(target).pipe(res)
}

const startServer = () =>
  new Promise((resolvePromise, reject) => {
    const handlers = {
      '/sprite/': serveDir(join(root, 'assets', 'sprite')),
      '/renderer/': serveDir(join(root, 'lib')),
      '/app/': serveDir(appDir),
    }
    const server = createServer((req, res) => {
      const path = req.url ?? '/'
      for (const [prefix, handler] of Object.entries(handlers)) {
        if (path.startsWith(prefix)) {
          req.url = path.slice(prefix.length - 1)
          handler(req, res)
          return
        }
      }
      res.writeHead(404).end('not found')
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        reject(new Error('static server has no port'))
        return
      }
      resolvePromise({ server, port: address.port })
    })
  })

let win = null
let tray = null
let watchdog = 0
let server = null
let presenceTimer = 0
let lastState = ''
let lastPresenceAt = 0

const sendState = (state) => {
  if (win === null || win.isDestroyed()) return
  win.webContents.send('pet:command', { type: 'state', payload: { state } })
}

const pollPresence = async () => {
  try {
    const response = await fetch(`${dshUrl}/pet-whale/api/presence`, { signal: AbortSignal.timeout(900) })
    if (!response.ok) throw new Error(String(response.status))
    const data = await response.json()
    lastPresenceAt = Date.now()
    if (data.state !== lastState) {
      lastState = data.state
      sendState(data.state)
    }
  } catch {
    // DSH 没开/路由不可用：超过 8 秒没更新就回 idle，避免一直保持 thinking
    if (lastState !== '' && Date.now() - lastPresenceAt > 8000) {
      lastState = 'idle'
      sendState('idle')
    }
  }
}

const showContextMenu = () => {
  if (win === null || win.isDestroyed()) return
  const menu = Menu.buildFromTemplate([
    {
      label: '置顶',
      type: 'checkbox',
      checked: win.isAlwaysOnTop(),
      click: () => win?.setAlwaysOnTop(!win.isAlwaysOnTop(), 'screen-saver'),
    },
    { label: '重新载入', click: () => win?.webContents.reload() },
    { type: 'separator' },
    { label: '退出桌宠', click: () => app.quit() },
  ])
  menu.popup({ window: win })
}

const createTray = () => {
  const image = nativeImage.createFromDataURL(TRAY_ICON)
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
  tray.setToolTip('pet-whale 桌宠')
  const menu = Menu.buildFromTemplate([
    { label: '显示/隐藏', click: () => { if (win === null || win.isDestroyed()) return; win.isVisible() ? win.hide() : win.show() } },
    { label: '重新载入', click: () => win?.webContents.reload() },
    { type: 'separator' },
    { label: '退出桌宠', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => { if (win !== null && !win.isDestroyed()) win.isVisible() ? win.hide() : win.show() })
}

const createWindow = async (port) => {
  const display = screen.getPrimaryDisplay()
  const rect = clampToWorkArea(computeWindowRect({ w: 640, h: 360 }, display.workArea, 0.5), display.workArea)
  win = new BrowserWindow({
    ...rect,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    fullscreenable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(appDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  await win.loadURL(`http://127.0.0.1:${String(port)}/app/index.html`)
  // 点击穿透：默认整窗穿透，渲染层按像素命中后手动切成可交互
  win.setIgnoreMouseEvents(true, { forward: true })
  watchdog = setInterval(() => {
    if (win === null || win.isDestroyed()) return
    if (!win.isAlwaysOnTop()) win.setAlwaysOnTop(true, 'screen-saver')
  }, 3000)
  presenceTimer = setInterval(() => { void pollPresence() }, 1200)
  void pollPresence()
}

const smoke = process.argv.includes('--smoke')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win !== null && !win.isDestroyed()) win.show()
  })
  app.whenReady().then(async () => {
    const started = await startServer()
    server = started.server
    await createWindow(started.port)
    createTray()
    if (smoke) {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage()
          const target = process.env.PET_WHALE_SMOKE_OUT ?? join(root, 'pet-whale-smoke.png')
          const { writeFileSync } = await import('node:fs')
          writeFileSync(target, image.toPNG())
          console.log('[pet-whale desktop] smoke screenshot:', target)
        } catch (error) {
          console.error('[pet-whale desktop] smoke failed:', error)
        } finally {
          app.quit()
        }
      }, 2500)
    }
  })
}

ipcMain.on('pet:menu', () => showContextMenu())
ipcMain.on('pet:quit', () => app.quit())
ipcMain.on('pet:interactive', (_event, inside) => {
  if (win === null || win.isDestroyed()) return
  win.setIgnoreMouseEvents(inside !== true, { forward: true })
})
ipcMain.on('pet:ready', (_event, payload) => {
  console.log('[pet-whale desktop] renderer ready', payload ?? '')
})

app.on('window-all-closed', () => {
  if (watchdog !== 0) clearInterval(watchdog)
  if (presenceTimer !== 0) clearInterval(presenceTimer)
  server?.close()
  app.quit()
})
