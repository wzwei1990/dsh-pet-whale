// PSD2Live 运行时（p2l）封装。
//
// 为什么用它而不是 pixi-live2d-display：
// - pixi 0.5.0-beta 内置的 Cubism Web Framework 太旧，渲染 PSD2Live 3.7 编出的 moc3 会报
//   `TypeError: Cannot set properties of undefined (setting '_currentFrameNo')`（2026-11 实测）。
// - PSD2Live 的 `project_export_target(target=web)` 会一起导出**自带 WASM 运行时**
//   （index.html / p2l.js / p2l_runtime.wasm / *.p2lrt），API 正好覆盖桌宠要的三件事：
//   lipSync(口型) / lookAt(视线) / hitTest(点击部位)。
//
// 资产约定：把导出目录整体放进插件资产根下的一个文件夹，例如
//   assets/live2d/<name>/{p2l.js, p2l_runtime.wasm, <name>.p2lrt}
// 然后 createP2LPlayer(canvas, { base: '/pet-whale/live2d/<name>/', model: '<name>.p2lrt' })
//
// 注意：p2l.js / p2l_runtime.wasm 是 PSD2Live 的伴随产物，随模型一起分发；
// 正式发布前要确认它的许可证与本项目是否兼容（见 tools/live2d/README.md）。

export interface P2LPlayerLike {
  clips: string[]
  expressions: string[]
  advancedFeatures?: number
  play: (id: string | null) => void
  expression: (id: string | null) => void
  lipSync: (value: number) => void
  lookAt: (x: number, y: number) => void
  hitTest: (clientX: number, clientY: number) => string | null
  setAdvanced: (mask: number) => void
}

export interface P2LOptions {
  /** 资产根，末尾带斜杠 */
  base: string
  /** .p2lrt 文件名（相对 base） */
  model: string
  /** wasm 文件名（相对 base），默认 p2l_runtime.wasm */
  wasm?: string
}

interface P2LModule {
  P2LPlayer: {
    create(canvas: HTMLCanvasElement, wasm: string, model: string): Promise<P2LPlayerLike>
  }
}

const loaded = new Map<string, Promise<P2LModule>>()

/** 只加载一次同一个 base 下的 p2l.js */
function loadRuntime(base: string): Promise<P2LModule> {
  const key = base
  const hit = loaded.get(key)
  if (hit) return hit
  const p = import(/* @vite-ignore */ `${base}p2l.js` as string).then((mod: unknown) => {
    const m = mod as P2LModule
    if (!m?.P2LPlayer) throw new Error('p2l.js 里没有导出 P2LPlayer')
    return m
  })
  p.catch(() => loaded.delete(key))
  loaded.set(key, p)
  return p
}

/** 在给定 canvas 上创建 PSD2Live 播放器 */
export async function createP2LPlayer(canvas: HTMLCanvasElement, options: P2LOptions): Promise<P2LPlayerLike> {
  const { base, model, wasm = 'p2l_runtime.wasm' } = options
  const mod = await loadRuntime(base)
  return mod.P2LPlayer.create(canvas, `${base}${wasm}`, `${base}${model}`)
}
