// pet-whale 桌面端 preload：只暴露最小 IPC 面，渲染层拿不到 Node。
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petDesktop', {
  /** 主进程 -> 渲染层的动作指令（后续接会话状态时用） */
  onCommand: (handler) => {
    ipcRenderer.on('pet:command', (_event, command) => handler(command))
  },
  ready: (info) => ipcRenderer.send('pet:ready', info),
  openMenu: () => ipcRenderer.send('pet:menu'),
  /** 渲染层按像素命中后切换整窗是否接收鼠标 */
  setInteractive: (inside) => ipcRenderer.send('pet:interactive', inside),
  quit: () => ipcRenderer.send('pet:quit'),
})
