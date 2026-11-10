// Live2D 渲染器（框架无关的挂载函数）。
//
// 为什么单独一层：宠物模块（pets/<id>/index.ts）只声明「盒子多大 + 怎么挂」，
// 渲染细节（PIXI 初始化、动作组发现、口型、销毁）都在这里，其它宠物将来也能复用。
//
// 三条实测结论决定了这里的写法（别随便「简化」掉）：
// 1) pixi-live2d-display 的 UMD 包会读 process.env，浏览器里没有 process —— 必须在
//    加载 cubism4.min.js 之前塞一个 window.process shim，否则整个库注册失败。
// 2) 必须用 dist/cubism4.min.js（index.min.js 是 cubism2 路径，window.PIXI.live2d 会是空的）。
// 3) 这个版本的库**只在 _render() 里推进模型时间**：model.update(dt) 只是把 dt 攒起来，
//    下一次真正渲染时才应用。所以不能用「调 N 次 update 看时间有没有走」当证据，
//    也不能在 rAF 停掉的窗口里指望动画继续。

/** 挂载参数 */
export interface Live2DMountOptions {
  /** 资产根（vendor/ 与 models/ 相对它） */
  base: string
  /** model3.json 相对 base 的路径 */
  model: string
  /** 画布铺满盒子后再放大多少倍：各家模型画布留白不同，靠它把人物怼满（默认 1） */
  zoom?: number
  /** 竖直微调，占盒子高度的比例，正数往下（默认 0） */
  offsetY?: number
  /** 点击宠物时播的动作组；false = 不绑（默认 'Tap'） */
  tapGroup?: string | false
  /** 调试：把内部对象挂到 window.__petWhaleLive2D */
  debug?: boolean
}

interface PixiApp {
  view: HTMLCanvasElement
  screen: { width: number; height: number }
  stage: unknown
  ticker: { add: (fn: () => void) => void; deltaMS: number }
  renderer: { resize: (w: number, h: number) => void; on: (ev: string, fn: () => void) => void }
  destroy: (options?: unknown) => void
}

interface Live2DModelLike {
  width: number
  height: number
  scale: { set: (v: number) => void }
  x: number
  y: number
  motion: (group: string, index?: number, priority?: number) => unknown
  update: (dt: number) => void
  destroy: () => void
  internalModel: {
    originalWidth: number
    originalHeight: number
    coreModel: { setPartOpacityById: (id: string, v: number) => void }
    motionManager: {
      definitions: Record<string, unknown[]>
      groups?: { idle?: string }
      state: { currentGroup?: string; currentIndex?: number }
    }
  }
}

/** MotionPriority.FORCE：用 FORCE 才盖得掉正在跑的待机动作（NORMAL 会被 reserve() 挡掉） */
const PRIORITY_FORCE = 3

/** 三件 vendor 的加载顺序不能变：core → pixi → cubism4 */
const VENDOR = ['vendor/live2dcubismcore.min.js', 'vendor/pixi.min.js', 'vendor/cubism4.min.js']

let vendorPromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = false
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`加载失败：${src}`))
    document.head.appendChild(el)
  })
}

/** 只加载一次；失败允许重试（换个 base 的场景） */
function loadVendor(base: string): Promise<void> {
  if (vendorPromise) return vendorPromise
  vendorPromise = (async () => {
    const w = window as unknown as { process?: unknown; PIXI?: { live2d?: unknown } }
    // ① process shim，必须在 cubism4 之前
    w.process = w.process ?? { env: { NODE_ENV: 'production' }, platform: 'browser' }
    for (const path of VENDOR) await loadScript(`${base}${path}`)
    if (!w.PIXI?.live2d) throw new Error('PIXI.live2d 未注册（vendor 包不对？应为 dist/cubism4.min.js）')
  })().catch((error) => {
    vendorPromise = null
    throw error
  })
  return vendorPromise
}

/**
 * 把 Live2D 模型挂到 el 里（自己建 canvas）。
 * 返回销毁函数：切换宠物/卸载时必须调用，否则 PIXI 的 ticker 会一直跑。
 */
export function mountLive2D(el: HTMLElement, options: Live2DMountOptions): () => void {
  const { base, model: modelPath, zoom = 1, offsetY = 0, tapGroup = 'Tap' } = options
  let disposed = false
  let app: PixiApp | null = null
  let model: Live2DModelLike | null = null
  let observer: ResizeObserver | null = null
  let rafId = 0

  const canvas = document.createElement('canvas')
  canvas.className = 'pwh-l2d-canvas'
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none'
  el.appendChild(canvas)

  /** 盒子尺寸（宠物是绝对定位的，某些时刻可能是 0 → 兜 1px 防止 PIXI 建 0 尺寸缓冲 */
  const box = () => ({
    w: Math.max(1, Math.round(el.clientWidth || 1)),
    h: Math.max(1, Math.round(el.clientHeight || 1)),
  })

  const fit = (): void => {
    if (!app || !model) return
    const { w, h } = box()
    app.renderer.resize(w, h)
    // 必须用**未缩放**的画布尺寸：model.width 是 localBounds × scale，
    // 拿它当基准会在 ResizeObserver 第二次回调时越缩越小（自反馈），
    // 最后模型跑到盒子外面去。
    const ow = model.internalModel.originalWidth
    const oh = model.internalModel.originalHeight
    const scale = Math.min(w / ow, h / oh) * zoom
    model.scale.set(scale)
    model.x = (w - ow * scale) / 2
    model.y = (h - oh * scale) / 2 + h * offsetY
  }

  const playTap = (): void => {
    if (!model || tapGroup === false) return
    const groups = model.internalModel.motionManager.definitions
    if (!groups[tapGroup]?.length) return
    const state = model.internalModel.motionManager.state
    const n = groups[tapGroup].length
    // 随机一支，避开正在播的那支：同一支会被 reserve() 直接拒掉，看着就是「点了没反应」
    let index = Math.floor(Math.random() * n)
    if (state.currentGroup === tapGroup && n > 1) {
      index = ((state.currentIndex ?? 0) + 1 + Math.floor(Math.random() * (n - 1))) % n
    }
    model.motion(tapGroup, index, PRIORITY_FORCE)
  }
  const onClick = (event: MouseEvent): void => {
    // 右键留给插件自己的菜单
    if (event.button !== 0) return
    playTap()
  }
  el.addEventListener('click', onClick)

  const boot = async (): Promise<void> => {
    await loadVendor(base)
    if (disposed) return
    const PIXI = (window as unknown as { PIXI: any }).PIXI
    // 库的自动更新挂在 Ticker.shared 上，不启动它模型会停在初始帧
    PIXI.Ticker.shared.autoStart = true
    PIXI.Ticker.shared.start()

    app = new PIXI.Application({
      view: canvas,
      width: box().w,
      height: box().h,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      // 自己驱动更新：autoUpdate 关掉后每帧只攒 dt，由 app.ticker 里的 update 推进，
      // 这样前台/后台可以明确门控，也不受库内部 Ticker.shared 的影响。
      autoStart: true,
    }) as PixiApp
    if (disposed) return
    const loaded = (await PIXI.live2d.Live2DModel.from(`${base}${modelPath}`, {
      autoInteract: false,
      autoUpdate: false,
    })) as Live2DModelLike
    if (disposed) {
      loaded.destroy()
      return
    }
    model = loaded
    ;(app.stage as unknown as { addChild: (c: unknown) => void }).addChild(loaded)
    // Haru 这类老样例模型有 A/B 两套手臂靠 motion 的 PartOpacity 隐藏，
    // 而 0.5.0-beta 不应用 PartOpacity → 显式隐藏 B 套（自建模型没这两组 id 时是空操作）
    app.renderer.on('prerender', () => {
      const core = model?.internalModel.coreModel
      core?.setPartOpacityById('Part01ArmRB001', 0)
      core?.setPartOpacityById('Part01ArmLB001', 0)
    })
    fit()
    // 库不会自己播待机动作（只有 Tap 这类被点才播）——不主动起一支，模型就是一张静止的立绘。
    const mm = loaded.internalModel.motionManager
    const idleGroup = mm.groups?.idle ?? 'Idle'
    if (mm.definitions[idleGroup]?.length) loaded.motion(idleGroup)
    if (options.debug) {
      ;(window as unknown as { __petWhaleLive2D?: unknown }).__petWhaleLive2D = { app, model }
    }
    app.ticker.add(() => {
      if (!model) return
      // 页面不可见时停住：rAF 本来就会停，这里只是让语义明确、也避免攒出巨大的 dt
      if (document.visibilityState === 'hidden') return
      model.update(app!.ticker.deltaMS)
    })
    observer = new ResizeObserver(fit)
    observer.observe(el)
  }

  void boot().catch((error) => {
    // 渲染失败不该把整只桌宠搞没：留一行日志 + 画布留空
    console.error('[pet-whale] Live2D 挂载失败：', error)
  })

  return () => {
    disposed = true
    cancelAnimationFrame(rafId)
    observer?.disconnect()
    el.removeEventListener('click', onClick)
    try {
      model?.destroy()
    } catch {
      // 忽略
    }
    try {
      app?.destroy({ removeView: true })
    } catch {
      // 忽略
    }
    canvas.remove()
    model = null
    app = null
  }
}
