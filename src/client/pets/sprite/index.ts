/**
 * 精灵帧宠物「大肥鱼·精灵」：照 hunmer/aboutme-pets 的素材规格与状态机字段实现。
 *
 * 和 Live2D 那条路的区别：
 * - 动作是**整帧序列**（视频转透明 WebP 精灵表），不存在分层形变 ⇒ 天然没有跨层缝
 * - 动作清单在 manifest.json 里，加动作只要往素材目录丢文件 + 改清单，不用改这里
 *
 * 状态映射（照清单字段，不写死动作名）：
 *   idle（循环）→ 清单 idleAnimationId
 *   点击        → click.animationIds 随机，播完回 idle
 *   悬停        → hover.animationIds 随机，播完回 idle
 *   拖拽（容器 class=dragging）→ movement.dragAnimationId 循环
 *
 * @module dsh-pet/src/client/pets/sprite
 */
import type { PetModule } from '../types'
import { animationOf, loadSpritePack, type SpritePack } from './manifest'
import { createSpritePlayer, type SpritePlayer } from './player'

/** 素材包路由（Node 半 src/index.mjs 挂的静态路由） */
const PACK_BASE = '/pet-whale/sprite/dsh/'

/** 按清单字段随机取一个动作 id。 */
function pickFromPool(pack: SpritePack, ids: string[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined
  const valid = ids.filter((id) => animationOf(pack, id) !== undefined)
  if (valid.length === 0) return undefined
  return valid[Math.floor(Math.random() * valid.length)]
}

export const spritePet: PetModule = {
  id: 'sprite',
  name: { zh: '大肥鱼·精灵', en: 'Dafeiyu Sprite' },
  icon: '🐟',
  // html 只放一个占位盒；真正的绘制在 mount 里建 canvas
  html: '<div class="pwh-sprite-box"></div>',
  css: `
    .pwh-sprite-box { position: absolute; inset: 0; }
    .pwh-sprite-box canvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
      display: block; touch-action: none;
      image-rendering: auto;
    }
  `,
  // 素材是 640×360 的 16:9 画布，容器按同比例给，避免拉伸
  size: { w: 240, h: 135 },
  idleDrift: false,

  mount: (el: HTMLElement): (() => void) => {
    const box = el.querySelector('.pwh-sprite-box')
    if (!(box instanceof HTMLElement)) return () => {}

    const canvas = document.createElement('canvas')
    canvas.className = 'pwh-sprite-canvas'
    box.appendChild(canvas)

    let player: SpritePlayer | null = null
    let disposed = false
    let pack: SpritePack | null = null
    let observer: MutationObserver | null = null
    let dragging = false

    const onClick = (): void => {
      if (!player || !pack) return
      const id = pickFromPool(pack, pack.click?.animationIds)
      if (id) player.play(id, true)
    }
    const onEnter = (): void => {
      if (!player || !pack) return
      const id = pickFromPool(pack, pack.hover?.animationIds)
      if (id) player.play(id, true)
    }

    void (async () => {
      try {
        pack = await loadSpritePack(PACK_BASE)
        if (disposed) return
        player = await createSpritePlayer({ canvas, pack, baseUrl: PACK_BASE })
        if (disposed) {
          player.destroy()
          return
        }
        player.play(pack.idleAnimationId)
      } catch (error) {
        // 素材没放好时不要静默空白：留一行提示，便于用户自查目录
        canvas.remove()
        const tip = document.createElement('div')
        tip.className = 'pwh-sprite-tip'
        tip.textContent = '精灵帧素材未就绪'
        tip.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;font-size:11px;color:#889;'
        box.appendChild(tip)
        console.log('[pet-whale][warn] 精灵帧素材加载失败：', error)
      }
    })()

    el.addEventListener('click', onClick)
    el.addEventListener('mouseenter', onEnter)

    // 拖拽状态由插件在容器上切 class，这里跟着切动作
    observer = new MutationObserver(() => {
      const now = el.classList.contains('dragging')
      if (now === dragging) return
      dragging = now
      if (!player || !pack) return
      const dragId = pack.movement?.dragAnimationId
      if (now && dragId) player.play(dragId)
      else player.play(pack.idleAnimationId)
    })
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })

    return () => {
      disposed = true
      el.removeEventListener('click', onClick)
      el.removeEventListener('mouseenter', onEnter)
      observer?.disconnect()
      observer = null
      player?.destroy()
      player = null
      canvas.remove()
    }
  },
}
