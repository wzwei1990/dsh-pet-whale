/**
 * 精灵帧素材包的清单模型（照 hunmer/aboutme-pets 的 manifest.json 形态）。
 *
 * 形态要点（来自上游实际数据，不是自创）：
 * - 一个动作 = 一张透明 WebP 精灵表，网格 columns×rows，单帧 frameWidth×frameHeight，按 fps 播放
 * - 状态机写在清单里：idleAnimationId / click.animationIds / hover.animationIds / movement.*
 *   ⇒ 换素材包不用改插件代码，插件只负责按这份清单跑状态机
 *
 * @module dsh-pet/src/client/pets/sprite/manifest
 */

/** 一个动作（一张精灵表）。 */
export interface SpriteAnimation {
  id: string
  /** 英文名，日志用 */
  name: string
  /** 中文显示名（可选） */
  label?: string
  /** 相对素材包根的路径，如 spritesheet/idle.webp */
  file: string
  columns: number
  rows: number
  frameWidth: number
  frameHeight: number
  frameCount: number
  fps: number
  /**
   * 起手帧：素材开头常有一段几乎静止的「保持帧」（实测 drag 前 11 帧与第 0 帧差异 <5.3，
   * 第 11 帧才动）。从 0 播会显得慢半拍，这里记下脚本探测出的实际起播帧。
   * 由 tools/detect-start-frame 那套规则生成（与静帧平均差 >8 的第一帧）。
   */
  startFrame?: number
}

/** 动作池（点击/悬停共用同一形状）。 */
export interface SpritePool {
  animationIds: string[]
  strategy?: 'random' | 'sequence'
}

/** 素材包清单。 */
export interface SpritePack {
  schemaVersion: number
  id: string
  name: string
  /**
   * 整体播放倍速（默认 1）。素材来自 10 秒/动作的慢节奏视频，
   * 桌面宠物需要更利落的观感；1.2 表示 12fps 素材按 14.4fps 推进。
   */
  playbackRate?: number
  /** 精灵表画布尺寸（单帧尺寸） */
  canvasWidth: number
  canvasHeight: number
  idleAnimationId: string
  click?: SpritePool
  hover?: SpritePool
  movement?: {
    leftAnimationId?: string
    rightAnimationId?: string
    dragAnimationId?: string
    /**
     * 拖拽动画的起手帧：素材开头常有几百毫秒的静止前摇（实测 drag.webp 前 10 帧
     * 帧间差 <1，第 11 帧才动，12fps ≈ 0.83s），从第 0 帧播会「慢半拍」。
     */
    dragStartFrame?: number
    speed?: number
  }
  animations: SpriteAnimation[]
}

/** 拉清单；包根由调用方给（默认插件路由）。 */
export async function loadSpritePack(baseUrl: string): Promise<SpritePack> {
  const res = await fetch(baseUrl + 'manifest.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error('manifest ' + res.status)
  const pack = (await res.json()) as SpritePack
  if (!Array.isArray(pack.animations) || pack.animations.length === 0) throw new Error('清单里没有动作')
  if (!pack.animations.some((a) => a.id === pack.idleAnimationId)) throw new Error('idleAnimationId 不存在')
  return pack
}

/** 按 id 取动作；找不到返回 undefined（调用方兜底回 idle）。 */
export function animationOf(pack: SpritePack, id: string | undefined): SpriteAnimation | undefined {
  if (id === undefined) return undefined
  return pack.animations.find((a) => a.id === id)
}
