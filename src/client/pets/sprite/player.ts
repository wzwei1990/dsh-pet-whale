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
  /** 播一段动作；once=true 播完回 idle */
  play: (id: string, once?: boolean) => void
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
  await Promise.all(
    pack.animations.map(
      (a) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            images.set(a.id, img)
            resolve()
          }
          img.onerror = () => reject(new Error('图片加载失败: ' + a.file))
          img.src = baseUrl + a.file.split('/').map(encodeURIComponent).join('/')
        }),
    ),
  )

  /**
   * 素材里角色并不铺满整帧（实测 idle 帧：x 213–425、y 63–329，占 640×360 的中间偏下），
   * 直接铺满画布会让脚离容器底还有一段 → 和地面阴影之间有空隙，看着像“悬空”。
   * 这里按 idle 首帧的 alpha 包围盒算一次映射：底部对齐画布底、水平居中、整体放大到占满高度。
   */
  const fit = (() => {
    const idleAnim = pack.animations.find((a) => a.id === pack.idleAnimationId)
    const img = idleAnim ? images.get(idleAnim.id) : undefined
    if (!idleAnim || !img) return { scale: 1, dx: 0, dy: 0 }
    const probe = document.createElement('canvas')
    probe.width = idleAnim.frameWidth
    probe.height = idleAnim.frameHeight
    const pctx = probe.getContext('2d')
    if (!pctx) return { scale: 1, dx: 0, dy: 0 }
    pctx.drawImage(img, 0, 0, idleAnim.frameWidth, idleAnim.frameHeight, 0, 0, probe.width, probe.height)
    const data = pctx.getImageData(0, 0, probe.width, probe.height).data
    let x0 = probe.width, y0 = probe.height, x1 = -1, y1 = -1
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
    if (x1 < 0) return { scale: 1, dx: 0, dy: 0 }
    const bw = x1 - x0 + 1
    const bh = y1 - y0 + 1
    // 高度占满 96%，底部留 2% 当落地余量
    const scale = (pack.canvasHeight * 0.96) / bh
    const dx = pack.canvasWidth / 2 - (x0 + bw / 2) * scale
    const dy = pack.canvasHeight - (y0 + bh) * scale - pack.canvasHeight * 0.02
    return { scale, dx, dy }
  })()

  const idleId = pack.idleAnimationId
  let current: SpriteAnimation = pack.animations.find((a) => a.id === idleId) as SpriteAnimation
  let once = false
  let startedAt = performance.now()
  let raf = 0
  let stopped = false

  const draw = (now: number): void => {
    if (stopped) return
    const img = images.get(current.id)
    const total = current.frameCount || current.columns * current.rows
    const elapsed = ((now - startedAt) / 1000) * current.fps
    if (once && elapsed >= total) {
      // 一次性动作播完 → 回 idle
      const idle = pack.animations.find((a) => a.id === idleId)
      if (idle) {
        current = idle
        once = false
        startedAt = now
      }
    } else if (elapsed >= total) {
      startedAt = now // 循环动作从头再来
    }
    const frame = Math.floor(((now - startedAt) / 1000) * current.fps) % total
    const c = frame % current.columns
    const r = Math.floor(frame / current.columns)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (img) {
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
    raf = requestAnimationFrame(draw)
  }
  raf = requestAnimationFrame(draw)

  return {
    play: (id, playOnce = false) => {
      const next = pack.animations.find((a) => a.id === id)
      if (!next) return
      current = next
      once = playOnce
      startedAt = performance.now()
    },
    current: () => current.id,
    destroy: () => {
      stopped = true
      cancelAnimationFrame(raf)
      images.clear()
    },
  }
}
