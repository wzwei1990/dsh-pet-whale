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
  play: (id: string, once?: boolean, hold?: boolean, from?: number, onEnd?: () => void) => void
  /** 当前动作 id（调试/日志） */
  current: () => string
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
  /** 解码图缓存上限：显示只用到 1–2 张，没必要让几十张位图常驻（实测 44 张 ≈ 1.2GB 会卡死页面） */
  const CACHE_MAX = 10
  const lru: string[] = []
  const touchImage = (id: string): void => {
    const i = lru.indexOf(id)
    if (i >= 0) lru.splice(i, 1)
    lru.push(id)
  }
  let prevAnimationId = ''
  const evictImages = (currentId: string, idleId: string): void => {
    while (lru.length > CACHE_MAX) {
      const victim = lru.find((id) => id !== currentId && id !== idleId && id !== prevAnimationId)
      if (victim === undefined) break
      const i = lru.indexOf(victim)
      if (i >= 0) lru.splice(i, 1)
      const img = images.get(victim)
      images.delete(victim)
      // 释放解码位图：清掉 src，交给 GC
      if (img !== undefined) img.src = ''
    }
  }
  /** 正在加载中的动作（避免重复发起） */
  const loading = new Set<string>()
  let disposed = false
  const loadOne = (anim: SpriteAnimation): Promise<void> => {
    if (images.has(anim.id) || loading.has(anim.id)) return Promise.resolve()
    loading.add(anim.id)
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        loading.delete(anim.id)
        if (disposed) return resolve()
        images.set(anim.id, img)
        touchImage(anim.id)
        resolve()
      }
      img.onerror = () => {
        loading.delete(anim.id)
        console.warn('[pet-whale][warn] 精灵帧图片加载失败: ' + anim.file)
        resolve()
      }
      img.src = baseUrl + anim.file.split('/').map(encodeURIComponent).join('/')
    })
  }
  /**
   * 懒加载：32 段素材共 31MB，全量 Promise.all 会让首屏等很久。
   * 先只加载"马上会用到"的动作（待机池 / 状态 / 说话 / 点击 / 悬停 / 移动），
   * 其余在后台按顺序慢慢补；play() 遇到未加载的动作会即时补载。
   */
  const priority = new Set<string>()
  const add = (id?: string): void => { if (id) priority.add(id) }
  add(pack.idleAnimationId)
  for (const id of pack.idleAnimationIds ?? []) add(id)
  for (const ids of Object.values(pack.choreography?.periods ?? {})) for (const id of ids) add(id)
  for (const id of pack.choreography?.activities ?? []) add(id)
  for (const entry of Object.values(pack.states ?? {})) {
    if (typeof entry === 'string') add(entry)
    else if (Array.isArray(entry)) for (const id of entry) add(id)
  }
  for (const id of pack.talk?.animationIds ?? []) add(id)
  for (const id of pack.click?.animationIds ?? []) add(id)
  for (const id of pack.hover?.animationIds ?? []) add(id)
  add(pack.movement?.leftAnimationId)
  add(pack.movement?.rightAnimationId)
  add(pack.movement?.dragAnimationId)
  const priorityAnims = pack.animations.filter((a) => priority.has(a.id))
  const restAnims = pack.animations.filter((a) => !priority.has(a.id))
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
  // 后台补齐：逐个排队，避免和首屏抢带宽
  let bgIndex = 0
  const loadBackground = (): void => {
    if (disposed) return
    const next = restAnims[bgIndex++]
    if (next === undefined) return
    void loadOne(next).then(() => window.setTimeout(loadBackground, 120))
  }
  window.setTimeout(loadBackground, 800)

  /**
   * 取景范围：不能只看 idle 帧。
   * 实测 idle 的内容在 y 63–329，但有些动作会画到头顶以外（举剑、头顶飘道具），
   * 只按 idle 包围盒映射 → 那些动作的顶部会被画布裁掉（2026-11-18 用户反馈）。
   * 这里扫描**所有动作的若干采样帧**，取并集包围盒，再按并集铺满画布。
   * 为了快，采样到 160×90 再扫（不逐像素全尺寸扫），误差 <4px。
   */
  const fit = (() => {
    const SCALE = 0.25
    const probe = document.createElement('canvas')
    probe.width = Math.round(pack.canvasWidth * SCALE)
    probe.height = Math.round(pack.canvasHeight * SCALE)
    const pctx = probe.getContext('2d', { willReadFrequently: true })
    if (!pctx) return { scale: 1, dx: 0, dy: 0 }
    let x0 = probe.width
    let y0 = probe.height
    let x1 = -1
    let y1 = -1
    for (const anim of pack.animations) {
      const img = images.get(anim.id)
      if (!img) continue
      const total = anim.frameCount || anim.columns * anim.rows
      // 每个动作抽 8 帧（含首尾），足以覆盖大多数“飘出去”的瞬间
      for (let k = 0; k < 8; k++) {
        const frame = Math.min(total - 1, Math.floor((total - 1) * (k / 7)))
        const col = frame % anim.columns
        const row = Math.floor(frame / anim.columns)
        pctx.clearRect(0, 0, probe.width, probe.height)
        pctx.drawImage(
          img,
          col * anim.frameWidth, row * anim.frameHeight, anim.frameWidth, anim.frameHeight,
          0, 0, probe.width, probe.height,
        )
        const data = pctx.getImageData(0, 0, probe.width, probe.height).data
        for (let y = 0; y < probe.height; y++) {
          for (let x = 0; x < probe.width; x++) {
            if (data[(y * probe.width + x) * 4 + 3] > 24) {
              if (x < x0) x0 = x
              if (x > x1) x1 = x
              if (y < y0) y0 = y
              if (y > y1) y1 = y
            }
          }
        }
      }
    }
    if (x1 < 0) return { scale: 1, dx: 0, dy: 0 }
    const bx0 = x0 / SCALE
    const by0 = y0 / SCALE
    const bw = (x1 - x0 + 1) / SCALE
    const bh = (y1 - y0 + 1) / SCALE
    // 高度占满 94%（留 3% 上下余量给“飘出去”的峰值帧），底部对齐
    const scale = (pack.canvasHeight * 0.94) / bh
    const dx = pack.canvasWidth / 2 - (bx0 + bw / 2) * scale
    const dy = pack.canvasHeight - (by0 + bh) * scale - pack.canvasHeight * 0.03
    return { scale, dx, dy }
  })()

  /** 播放倍速（manifest.playbackRate，默认 1） */
  const rate = Math.max(0.25, Math.min(4, pack.playbackRate ?? 1))
  const idleId = pack.idleAnimationId
  let current: SpriteAnimation = pack.animations.find((a) => a.id === idleId) as SpriteAnimation
  let once = false
  let hold = false
  let startFrame = 0
  let onEndCb: (() => void) | null = null
  /** 交叉淡入：切换动作时把上一帧叠在下面淡出，避免硬切（拖拽/状态切换的"闪一下"） */
  const FADE_MS = 120
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
    if (typeof document !== 'undefined' && document.hidden) return
    const img = images.get(current.id)
    if (img === undefined) {
      // 目标动作还没加载（懒加载/即时补载中）：继续画上一帧，绝不空帧
      if (lastGood !== null) {
        const lg = lastGood
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
    }
    const passed = Math.floor(((now - startedAt) / 1000) * current.fps * rate)
    const frame = startFrame + (passed % span)
    const c = frame % current.columns
    const r = Math.floor(frame / current.columns)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 交叉淡入：先把上一帧画满，再把当前帧按进度叠上去
    const fade = fadeStart === null ? 1 : Math.min(1, (now - fadeStart) / FADE_MS)
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

  return {
    play: (id, playOnce = false, holdLast = false, from = 0, onEnd) => {
      const next = pack.animations.find((a) => a.id === id)
      if (!next) return
      if (!images.has(next.id)) void loadOne(next)
      touchImage(next.id)
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
      startFrame = Math.max(0, from ?? next.startFrame ?? 0)
      startedAt = performance.now()
    },
    current: () => current.id,
    destroy: () => {
      stopped = true
      cancelAnimationFrame(raf)
      disposed = true
      window.clearInterval(watchdog)
      lastGood = null
      images.clear()
    },
  }
}
