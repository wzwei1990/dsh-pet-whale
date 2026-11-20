/**
 * 精灵帧播放器：canvas 2D 定窗重绘，按清单的 fps 逐帧 drawImage 取格。
 *
 * 为什么这么写（照 aboutme-pets 的实际规格）：
 * - 一张表装一个动作，网格取帧 = drawImage(img, c*fw, r*fh, fw, fh, 0, 0, w, h)
 * - 格子尺寸就是画布尺寸（640×360），不做缩放插值，避免边缘发虚
 * - 12fps 素材、30fps 刷新：用「累计时间取整帧号」而不是每帧递增，避免掉帧后漂移
 *
 * @module dsh-pet/src/client/pets/sprite/player
 */
import type { SpriteAnimation, SpritePack } from './manifest'
import { computeFit } from './pick'

export interface SpritePlayerOptions {
  canvas: HTMLCanvasElement
  pack: SpritePack
  /** 素材包根（拼图片地址用） */
  baseUrl: string
}

export interface SpritePlayer {
  /**
   * 播一段动作。
   * @param once 只播一次
   * @param hold 播完后**定格在最后一帧**（不弹回 idle）；上游拖拽动画就是 playOnce 语义，
   *             悬空时保持被拎起的姿态，放下才切回 idle
   */
  play: (id: string, once?: boolean, hold?: boolean, from?: number, onEnd?: () => void, onLoop?: () => void) => void
  /** 当前动作 id（调试/日志） */
  current: () => string
  /** 当前是否在播一次性动作（点击/表情等），散步期间不应打断 */
  currentIsOnce: () => boolean
  /** 某段动画图是否已解码好（散步前用来确认能播了再走） */
  has: (id: string) => boolean
  /** 提前加载接下来要播的动作（轮换开始时就调用，避免到点还在等下载） */
  preload: (ids: readonly string[]) => void
  destroy: () => void
}

export async function createSpritePlayer(options: SpritePlayerOptions): Promise<SpritePlayer> {
  const { canvas, pack, baseUrl } = options
  canvas.width = pack.canvasWidth
  canvas.height = pack.canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 不可用')

  // 预载全部动作图（8 个 ≈ 7.6MB，一次载完最省心；多了再改成按需）
  const images = new Map<string, HTMLImageElement>()
  /** 等待图片加载的切换请求 */
  /** 整帧快照：任何"没有可画图像"的帧都贴它，保证不空帧 */
  const snapshot = document.createElement('canvas')
  let snapshotReady = false
  let pendingPlay: { id: string; once: boolean; hold: boolean; from: number; onEnd?: () => void; onLoop?: () => void } | null = null
  /** 解码图缓存上限：显示只用到 1–2 张，没必要让几十张位图常驻（实测 44 张 ≈ 1.2GB 会卡死页面） */
  const CACHE_MAX = 3
  const lru: string[] = []
  const touchImage = (id: string): void => {
    const i = lru.indexOf(id)
    if (i >= 0) lru.splice(i, 1)
    lru.push(id)
  }
  let prevAnimationId = ''
  const evictImages = (currentId: string, idleId: string): void => {
    while (lru.length > CACHE_MAX) {
      const victim = lru.find((id) => id !== currentId && id !== idleId && id !== prevAnimationId && !protectedIds.has(id))
      if (victim === undefined) break
      const i = lru.indexOf(victim)
      if (i >= 0) lru.splice(i, 1)
      const img = images.get(victim)
      if (img !== undefined && !img.complete) continue
      images.delete(victim)
      // 释放解码位图：先摘事件（否则 src='' 会触发 onerror 误报），再清 src
      if (img !== undefined) {
        img.onload = null
        img.onerror = null
        img.src = ''
      }
    }
  }
  /** 正在加载中的动作（避免重复发起） */
  const loading = new Set<string>()
  let disposed = false
  /** 解码失败/中断的保护集合：正在用、上一帧、待切换的图不参与淘汰 */
  const protectedIds = new Set<string>()
  const loadOne = (anim: SpriteAnimation, attempt = 0): Promise<void> => {
    if (images.has(anim.id) || loading.has(anim.id)) return Promise.resolve()
    loading.add(anim.id)
    const url = baseUrl + anim.file.split('/').map(encodeURIComponent).join('/')
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        loading.delete(anim.id)
        // 加载成功后摘掉事件：稍后淘汰时 src='' 会触发 error，不能当成"加载失败"
        img.onload = null
        img.onerror = null
        if (disposed) return resolve()
        images.set(anim.id, img)
        touchImage(anim.id)
        resolve()
      }
      img.onerror = () => {
        loading.delete(anim.id)
        // 内存压力/并发解码/更新期间的文件替换都可能让单个请求失败：重试两次
        if (attempt < 2 && !disposed) {
          window.setTimeout(() => { void loadOne(anim, attempt + 1).then(resolve) }, 300 * (attempt + 1))
          return
        }
        console.warn('[pet-whale][warn] 精灵帧图片加载失败（已重试 ' + attempt + ' 次）: ' + url)
        resolve()
      }
      img.src = url
    })
  }
  /**
   * 预加载策略（2026-11-19 卡死修复）：
   * 单张精灵表 5120×5400 解码约 110MB，之前把 states/talk/click/hover/activities
   * 全部塞进优先队列（20+ 张 ≈ 2GB+），每次更新重载就卡死页面。
   * 现在只预加载"马上会看到"的：基础待机 + 当前时段待机池 + 说话池。
   * 其余全部按需加载（play() 时补），配合播放器 LRU 上限，常驻解码内存可控。
   */
  const priority = new Set<string>()
  const add = (id?: string): void => { if (id) priority.add(id) }
  add(pack.idleAnimationId)
  const priorityAnims = pack.animations.filter((a) => priority.has(a.id))
  // 推迟到下一轮事件循环再解码，避免插件重载/首屏的同一个 tick 里做重活
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
  await Promise.all(priorityAnims.map(loadOne))

  // 待机帧是首屏底线：没加载成功就重试几次，避免"空白一段时间"
  const idleAnim = pack.animations.find((a) => a.id === pack.idleAnimationId)
  if (idleAnim !== undefined) {
    let attempt = 0
    while (!images.has(idleAnim.id) && attempt < 3 && !disposed) {
      attempt += 1
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
      await loadOne(idleAnim)
      if (!images.has(idleAnim.id)) console.warn('[pet-whale][warn] 待机帧加载失败，第 ' + attempt + ' 次重试')
    }
  }
  // 其余动作全部按需加载（不再后台批量解码，避免反复解码/淘汰）

  /**
   * 取景范围：不能只看 idle 帧。
   * 实测 idle 的内容在 y 63–329，但有些动作会画到头顶以外（举剑、头顶飘道具），
   * 只按 idle 包围盒映射 → 那些动作的顶部会被画布裁掉（2026-11-18 用户反馈）。
   * 这里扫描**所有动作的若干采样帧**，取并集包围盒，再按并集铺满画布。
   * 为了快，采样到 160×90 再扫（不逐像素全尺寸扫），误差 <4px。
   */
  /** 每段动画自己的取景：不同来源的素材锚点不一样，共用并集框会"歪" */
  /**
   * 取景：**缩放固定**（按基础待机算一次），每段动画只按自己的包围盒居中/贴底。
   * 之前用"每段自己的缩放"→ 不同动作包围盒不同 → 切换时忽大忽小；
   * 更早用"所有动作并集框"→ 不同来源素材互相拉偏（打电话歪）。
   */
  const bboxes = new Map<string, { x0: number; y0: number; w: number; h: number } | null>()
  const bboxOf = (anim: SpriteAnimation): { x0: number; y0: number; w: number; h: number } | null => {
    if (bboxes.has(anim.id)) return bboxes.get(anim.id) ?? null
    const img = images.get(anim.id)
    if (img === undefined) return null
    const SCALE = 0.25
    const total = anim.frameCount || anim.columns * anim.rows
    let x0 = anim.frameWidth
    let y0 = anim.frameHeight
    let x1 = -1
    let y1 = -1
    const c = document.createElement('canvas')
    c.width = Math.round(anim.frameWidth * SCALE)
    c.height = Math.round(anim.frameHeight * SCALE)
    const ctx2 = c.getContext('2d', { willReadFrequently: true })
    if (ctx2 === null) return null
    for (let k = 0; k < 3; k++) {
      const frame = Math.min(total - 1, Math.floor((total - 1) * (k / 2)))
      const col = frame % anim.columns
      const row = Math.floor(frame / anim.columns)
      ctx2.clearRect(0, 0, c.width, c.height)
      ctx2.drawImage(img, col * anim.frameWidth, row * anim.frameHeight, anim.frameWidth, anim.frameHeight, 0, 0, c.width, c.height)
      const data = ctx2.getImageData(0, 0, c.width, c.height).data
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (data[(y * c.width + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x
            if (x > x1) x1 = x
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
        }
      }
    }
    const result = x1 < 0
      ? null
      : { x0: x0 / SCALE, y0: y0 / SCALE, w: (x1 - x0 + 1) / SCALE, h: (y1 - y0 + 1) / SCALE }
    bboxes.set(anim.id, result)
    return result
  }

  const fitFor = (anim: SpriteAnimation): { scale: number; dx: number; dy: number } => {
    const bbox = bboxOf(anim)
    const fallback = { scale: 1, dx: 0, dy: 0 }
    if (bbox === null) return fallback
    const idleAnim = pack.animations.find((a) => a.id === pack.idleAnimationId)
    const idleBox = idleAnim !== undefined ? bboxOf(idleAnim) : null
    return computeFit(bbox, idleBox, pack.canvasWidth, pack.canvasHeight)
  }

  /** 播放倍速（manifest.playbackRate，默认 1） */
  const rate = Math.max(0.25, Math.min(4, pack.playbackRate ?? 1))
  const idleId = pack.idleAnimationId
  let current: SpriteAnimation = pack.animations.find((a) => a.id === idleId) as SpriteAnimation
  let once = false
  let hold = false
  let startFrame = 0
  let onEndCb: (() => void) | null = null
  /** 循环动作每播完一圈的回调（用于"播完再换"的轮换） */
  let onLoopCb: (() => void) | null = null
  /** 交叉淡入：切换动作时把上一帧叠在下面淡出，避免硬切（拖拽/状态切换的"闪一下"） */
  const FADE_MS = 240
  let fadeStart: number | null = null
  let prevImg: HTMLImageElement | undefined
  let prevFrame = 0
  /** 最近一次成功绘制的帧（目标动作没加载时用它顶上，避免画布空白） */
  let lastGood: { img: HTMLImageElement; anim: SpriteAnimation; frame: number } | null = null
  let startedAt = performance.now()
  let raf = 0
  let lastFrameAt = performance.now()
  let frameErrorLogged = false
  let stopped = false

  const drawUnsafe = (now: number): void => {
    if (stopped) return
    // 等待中的切换：图加载好了就补播
    if (pendingPlay !== null && images.has(pendingPlay.id)) {
      const p = pendingPlay
      pendingPlay = null
      const anim = pack.animations.find((a) => a.id === p.id)
      if (anim !== undefined) applyPlay(anim, p.once, p.hold, p.from, p.onEnd, p.onLoop)
    }
    if (typeof document !== 'undefined' && document.hidden) return
    const img = images.get(current.id)
    if (img === undefined) {
      // 目标动作还没加载：优先上一帧，没有就贴整帧快照，绝不空帧
      if (lastGood === null && snapshotReady) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height)
        raf = requestAnimationFrame(draw)
        return
      }
      if (lastGood !== null) {
        const lg = lastGood
        const fit = fitFor(lg.anim)
        const lc = lg.frame % lg.anim.columns
        const lr = Math.floor(lg.frame / lg.anim.columns)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          lg.img,
          lc * lg.anim.frameWidth, lr * lg.anim.frameHeight,
          lg.anim.frameWidth, lg.anim.frameHeight,
          fit.dx, fit.dy, lg.anim.frameWidth * fit.scale, lg.anim.frameHeight * fit.scale,
        )
      }
      return
    }
    const fit = fitFor(current)
    const total = current.frameCount || current.columns * current.rows
    const span = Math.max(1, total - startFrame)
    const elapsed = ((now - startedAt) / 1000) * current.fps * rate
    if (once && elapsed >= span) {
      if (hold) {
        // 定格：只画最后一帧，不推进时间（拖拽悬空期间保持姿态）
        const last = total - 1
        const lc = last % current.columns
        const lr = Math.floor(last / current.columns)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (img) {
          ctx.drawImage(img, lc * current.frameWidth, lr * current.frameHeight, current.frameWidth, current.frameHeight,
            fit.dx, fit.dy, current.frameWidth * fit.scale, current.frameHeight * fit.scale)
        }
        raf = requestAnimationFrame(draw)
        return
      }
      // 一次性动作播完：先回调（说话轮换用它挑下一段），再决定是否回 idle
      const cb = onEndCb
      onEndCb = null
      if (cb) {
        cb()
        raf = requestAnimationFrame(draw)
        return
      }
      const idle = pack.animations.find((a) => a.id === idleId)
      if (idle) {
        current = idle
        once = false
        startedAt = now
      }
    } else if (elapsed >= span) {
      startedAt = now // 循环动作从起手帧再来
      // 每循环一圈通知一次（延迟到下一 tick，避免在绘制中重入 play）
      const loopCb = onLoopCb
      if (loopCb !== null) window.setTimeout(() => { if (!disposed) loopCb() }, 0)
    }
    const passed = Math.floor(((now - startedAt) / 1000) * current.fps * rate)
    const frame = startFrame + (passed % span)
    const c = frame % current.columns
    const r = Math.floor(frame / current.columns)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 交叉淡入：先把上一帧画满，再把当前帧按进度叠上去
    const rawFade = fadeStart === null ? 1 : Math.min(1, (now - fadeStart) / FADE_MS)
    // ease-in-out（smoothstep）：比线性更不容易看出"跳一下"
    const fade = rawFade * rawFade * (3 - 2 * rawFade)
    if (fade < 1 && prevImg) {
      const pc = prevFrame % current.columns
      const pr = Math.floor(prevFrame / current.columns)
      ctx.drawImage(
        prevImg,
        pc * current.frameWidth, pr * current.frameHeight,
        current.frameWidth, current.frameHeight,
        fit.dx, fit.dy, current.frameWidth * fit.scale, current.frameHeight * fit.scale,
      )
      ctx.globalAlpha = fade
    }
    if (img) {
      lastGood = { img, anim: current, frame }
      ctx.drawImage(
        img,
        c * current.frameWidth,
        r * current.frameHeight,
        current.frameWidth,
        current.frameHeight,
        fit.dx,
        fit.dy,
        current.frameWidth * fit.scale,
        current.frameHeight * fit.scale,
      )
    }
    ctx.globalAlpha = 1
    if (fade >= 1) fadeStart = null
    // 记录整帧快照（尺寸与画布一致，直接 copy）
    if (snapshot.width !== canvas.width || snapshot.height !== canvas.height) {
      snapshot.width = canvas.width
      snapshot.height = canvas.height
    }
    const sctx = snapshot.getContext('2d')
    if (sctx !== null) {
      sctx.clearRect(0, 0, snapshot.width, snapshot.height)
      sctx.drawImage(canvas, 0, 0)
      snapshotReady = true
    }
    raf = requestAnimationFrame(draw)
  }
  /**
   * 安全包装：任何一帧抛异常都只丢这一帧，不让 requestAnimationFrame 链断掉。
   * 断链的表现就是"卡死"——画面停在某一帧再也不动（2026-11-18 用户反馈）。
   */
  const draw = (now = performance.now()): void => {
    if (stopped) return
    raf = 0
    lastFrameAt = performance.now()
    try {
      drawUnsafe(now)
    } catch (error) {
      if (!frameErrorLogged) {
        frameErrorLogged = true
        console.warn('[pet-whale][warn] 精灵帧绘制异常（已降级为丢帧继续）:', error)
      }
    }
    if (!disposed && raf === 0) raf = requestAnimationFrame(draw)
  }
  raf = requestAnimationFrame(draw)

  // 看门狗：3 秒没有成功走过一帧就重启渲染循环
  const watchdog = window.setInterval(() => {
    if (disposed) return
    if (performance.now() - lastFrameAt > 3000 && raf === 0) {
      console.warn('[pet-whale][warn] 精灵帧渲染停滞，重启循环')
      raf = requestAnimationFrame(draw)
    }
  }, 2000)

  /** 真正切换动画（play 的外部入口保证图片已加载） */
  const applyPlay = (
    next: SpriteAnimation,
    playOnce: boolean,
    holdLast: boolean,
    from: number,
    onEnd?: () => void,
    onLoop?: () => void,
  ): void => {
    touchImage(next.id)
    protectedIds.clear()
    protectedIds.add(next.id)
    protectedIds.add(pack.idleAnimationId)
    if (prevAnimationId !== '') protectedIds.add(prevAnimationId)
    if (pendingPlay !== null) protectedIds.add(pendingPlay.id)
    evictImages(next.id, pack.idleAnimationId)
    if (next.id !== current.id) {
      // 记下当前帧，切换后 120ms 内做交叉淡入
      const elapsedNow = Math.floor(((performance.now() - startedAt) / 1000) * current.fps * rate)
      const spanNow = Math.max(1, (current.frameCount || current.columns * current.rows) - startFrame)
      prevImg = images.get(current.id)
      prevAnimationId = current.id
      prevFrame = startFrame + (elapsedNow % spanNow)
      fadeStart = performance.now()
    }
    current = next
    once = playOnce
    hold = holdLast
    onEndCb = onEnd ?? null
    onLoopCb = playOnce ? null : (onLoop ?? null)
    startFrame = Math.max(0, from ?? next.startFrame ?? 0)
    startedAt = performance.now()
  }

  return {
    play: (id, playOnce = false, holdLast = false, from = 0, onEnd, onLoop) => {
      const next = pack.animations.find((a) => a.id === id)
      if (!next) return
      if (!images.has(next.id)) {
        // 图片没加载完就先不切：继续显示当前动画，加载完由 draw 里补播，避免白屏一下
        pendingPlay = { id, once: playOnce, hold: holdLast, from, onEnd, onLoop }
        void loadOne(next)
        return
      }
      pendingPlay = null
      applyPlay(next, playOnce, holdLast, from, onEnd)
    },
    /** 提前加载接下来要播的动作（轮换开始时就调用，避免到点还在等下载） */
    preload: (ids: readonly string[]) => {
      for (const id of ids) {
        const anim = pack.animations.find((a) => a.id === id)
        if (anim !== undefined) void loadOne(anim)
      }
    },
    current: () => current.id,
    currentIsOnce: () => once,
    has: (id) => images.has(id),
    destroy: () => {
      stopped = true
      cancelAnimationFrame(raf)
      disposed = true
      window.clearInterval(watchdog)
      lastGood = null
      // 真正释放位图：清 src 并断开引用，否则每次更新重载都留一份 110MB 解码内存
      for (const img of images.values()) {
        img.onload = null
        img.onerror = null
        img.src = ''
      }
      images.clear()
      bboxes.clear()
      pendingPlay = null
    },
  }
}
