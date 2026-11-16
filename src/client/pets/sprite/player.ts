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
        0,
        0,
        canvas.width,
        canvas.height,
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
