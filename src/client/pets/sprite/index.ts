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
import { DAFEIYU_TEXT } from '../dafeiyu/text'
import { animationOf, loadSpritePack, type SpritePack } from './manifest'
import { createSpritePlayer, type SpritePlayer } from './player'

/** 素材包路由（Node 半 src/index.mjs 挂的静态路由） */
const PACK_BASE = '/pet-whale/sprite/dafeiyu-sprite/'

/** 插件加在 .pet-official 上的状态 class（与 state.ts 的 WhaleState 对齐） */
const STATE_CLASSES = ['think', 'working', 'celebrate', 'error', 'wait', 'disappointed'] as const

/**
 * 说话状态必须活在**模块级**而不是 mount 里：
 * 桌宠隐藏时会卸载 mount，如果状态跟着组件走，取消隐藏后就不知道"还在说话"，
 * 于是语音还在播、动作却回待机（2026-11-17 用户实测）。
 */
let speakingFlag = false
let applySpeaking: ((on: boolean) => void) | null = null

/** 事件监听只注册一次（HMR/重装载时先摘旧的） */
function ensureSpeakListener(): void {
  if (typeof document === 'undefined') return
  const HOOK = '__pwhSpriteSpeakHook'
  const host = window as unknown as Record<string, unknown>
  const prev = host[HOOK] as EventListener | undefined
  if (prev) document.removeEventListener('dsh:speaking', prev)
  const handler: EventListener = (event) => {
    const detail = (event as CustomEvent<{ on?: boolean }>).detail
    speakingFlag = detail?.on === true
    applySpeaking?.(speakingFlag)
  }
  host[HOOK] = handler
  document.addEventListener('dsh:speaking', handler)
}

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
  text: DAFEIYU_TEXT,
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
    /** 状态同步函数（iload 完成后才会真正生效；先占位，避免加载前调用报错） */
    let sync: () => void = () => {}

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
        sync()
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

    // 插件的 dragging / swimming 都加在**根容器**上（endDrag 里 root.classList.remove('dragging')），
    // 之前只查宠物元素的 class → 拖拽动画永远不触发（2026-11-17 实测：提起既不播动作也闪）。
    const rootEl = el.closest('[data-dsh-whale]') as HTMLElement | null
    let lastTarget = ''
    let lastOnce = false
    let speaking = false
    let lastTalk = ''

    /** 从 talk 池里挑一段（尽量不和上一段重复）；池空则回落到 idle。 */
    const pickTalk = (): string => {
      const pool = (pack?.talk?.animationIds ?? []).filter((id) => pack?.animations.some((a) => a.id === id))
      if (pool.length === 0) return pack?.idleAnimationId ?? ''
      if (pool.length === 1) return pool[0] as string
      const rest = pool.filter((id) => id !== lastTalk)
      const picked = rest[Math.floor(Math.random() * rest.length)] ?? pool[0]
      lastTalk = picked
      return picked as string
    }

    /** 待机池：默认 [idleAnimationId]，可配多段轮换 */
    const idlePool = (): string[] => {
      const raw = pack?.idleAnimationIds ?? []
      const valid = raw.filter((id) => pack?.animations.some((a) => a.id === id))
      if (valid.length > 0) return valid
      return pack ? [pack.idleAnimationId] : []
    }
    let idleRotateTimer = 0
    const clearIdleRotate = (): void => {
      if (idleRotateTimer !== 0) { clearTimeout(idleRotateTimer); idleRotateTimer = 0 }
    }
    /** 待机每 25s 换一段（还在待机才换） */
    const scheduleIdleRotate = (): void => {
      clearIdleRotate()
      idleRotateTimer = window.setTimeout(() => {
        idleRotateTimer = 0
        if (!player || !pack || speaking) return
        if (lastTarget !== pack.idleAnimationId && !idlePool().includes(lastTarget)) return
        const pool = idlePool()
        if (pool.length <= 1) return
        const next = pool.find((id) => id !== lastTarget) ?? pool[0]
        lastTarget = next ?? pack.idleAnimationId
        lastOnce = false
        player.play(lastTarget)
        scheduleIdleRotate()
      }, 25_000)
    }
    let lastIdlePick = ''

    const playTalk = (): void => {
      if (!player) return
      const id = pickTalk()
      ;(window as unknown as { __pwhSpriteState?: unknown }).__pwhSpriteState = { speaking: true, anim: id }
      if (!id) return
      lastTarget = id
      lastOnce = true
      // 一句一段：播完接着挑下一段（不重复同一段），直到说话结束
      player.play(id, true, false, undefined, () => {
        if (speaking) playTalk()
      })
    }

    sync = (): void => {
      if (!player || !pack) return
      const dragging = rootEl?.classList.contains('dragging') === true || el.classList.contains('dragging')
      const moving = rootEl?.classList.contains('swimming') === true || el.classList.contains('swimming')
      // 优先级：拖拽 > 说话 > 走动 > 待机
      if (dragging) {
        const target = pack.movement?.dragAnimationId ?? ''
        if (target && (target !== lastTarget || !lastOnce)) {
          lastTarget = target
          lastOnce = true
          player.play(target, true, true)
        }
        return
      }
      if (speaking) {
        // 已经在说就不打断；没在说才起一段
        if (!lastOnce || lastTarget === pack.idleAnimationId) playTalk()
        return
      }
      // agent 状态（思考/工作/庆祝/出错…）优先于走动/待机
      const running = STATE_CLASSES.find((name) => el.classList.contains(name))
      const stateAnim = running ? pack.states?.[running] : undefined
      const hasStateAnim = stateAnim !== undefined && pack.animations.some((a) => a.id === stateAnim)
      let target = hasStateAnim
        ? (stateAnim as string)
        : moving ? (pack.movement?.leftAnimationId ?? pack.idleAnimationId) : pack.idleAnimationId
      const enteringIdle = !hasStateAnim && !moving
      if (enteringIdle) {
        const pool = idlePool()
        if (pool.length > 1) {
          // 进入待机时随机换一段（避免永远从同一个呼吸动作开始）
          const choices = pool.filter((id) => id !== lastIdlePick)
          const picked = choices[Math.floor(Math.random() * choices.length)] ?? pool[0]
          lastIdlePick = picked ?? pack.idleAnimationId
          target = lastIdlePick
        }
      } else {
        clearIdleRotate()
      }
      ;(window as unknown as { __pwhSpriteState?: unknown }).__pwhSpriteState = { speaking: false, anim: target }
      if (target && (target !== lastTarget || lastOnce)) {
        lastTarget = target
        lastOnce = false
        player.play(target)
        if (enteringIdle) scheduleIdleRotate()
      }
      // 朝向交给插件：swim.ts 会写 pet.style.transform = scaleX(±1)
      canvas.style.transform = ''
    }

    // ── 对外接口：dsh-tts 之后接进来只需要调用它 ──
    //   window.__pwhSpeak.start()  → 开始说话（随机轮换碎碎念/哼歌，播完自动换下一段）
    //   window.__pwhSpeak.stop()   → 说完回 idle
    // 也可以派事件：document.dispatchEvent(new CustomEvent('pet-whale-speak', { detail: { on: true } }))
    const setSpeaking = (on: boolean): void => {
      speaking = on
      speakingFlag = on
      ;(window as unknown as { __pwhSpriteState?: unknown }).__pwhSpriteState = {
        speaking: on,
        anim: on ? lastTarget : pack?.idleAnimationId ?? '',
      }
      if (on) playTalk()
      else {
        lastTarget = ''
        lastOnce = false
        if (player && pack) {
          lastTarget = pack.idleAnimationId
          player.play(pack.idleAnimationId)
        }
      }
    }
    ;(window as unknown as { __pwhSpeak?: { start: () => void; stop: () => void } }).__pwhSpeak = {
      start: () => setSpeaking(true),
      stop: () => setSpeaking(false),
    }
    const onSpeakEvent = (e: Event): void => {
      const detail = (e as CustomEvent<{ on?: boolean }>).detail
      setSpeaking(detail?.on === true)
    }
    // 事件监听走模块级 ensureSpeakListener()（跨隐藏保留状态），这里只托管 setSpeaking
    applySpeaking = setSpeaking
    ensureSpeakListener()
    // 重新挂载时如果语音还在播（隐藏期间开始的），立刻接上说话动作
    if (speakingFlag) setSpeaking(true)

    observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    if (rootEl) observer.observe(rootEl, { attributes: true, attributeFilter: ['class', 'data-facing'] })

    return () => {
      disposed = true
      el.removeEventListener('click', onClick)
      el.removeEventListener('mouseenter', onEnter)
      clearIdleRotate()
      applySpeaking = null
      delete (window as unknown as { __pwhSpeak?: unknown }).__pwhSpeak
      observer?.disconnect()
      observer = null
      player?.destroy()
      player = null
      canvas.remove()
    }
  },
}
