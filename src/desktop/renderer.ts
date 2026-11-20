/**
 * 桌面端渲染入口：在 Electron 窗口里播精灵桌宠。
 *
 * 动作规则与网页端保持一致（同一份纯逻辑）：
 * - 轮换："当前动画播完一圈"再换（onLoop），30 秒兜底
 * - 每第 3 轮抽一次自娱池（activities）
 * - 同池随洗牌袋 + avoidSame，不连续重复
 * - 点击/悬停从各自池随机
 * - 空闲 20 秒打瞌睡，1 分钟后自动醒；点一下唤醒
 *
 * 与 Web 端差异：没有 DSH Client 服务，会话状态（think/working/wait）暂由主进程桥接后推送。
 */
import { createSpritePlayer } from '../client/pets/sprite/player'
import type { SpritePack } from '../client/pets/sprite/manifest'
import { avoidSame, createPoolPicker, decideIdleRotation } from '../client/pets/sprite/pick'

interface DesktopBridge {
  onCommand?: (handler: (command: { type: string; payload?: unknown }) => void) => void
  ready?: (info: { pack: string }) => void
  openMenu?: () => void
  setInteractive?: (inside: boolean) => void
}

declare global {
  interface Window {
    petDesktop?: DesktopBridge
  }
}

const canvas = document.getElementById('pet') as HTMLCanvasElement | null
if (canvas === null) throw new Error('desktop renderer: missing #pet canvas')

const params = new URLSearchParams(location.search)
const packId = params.get('pack') ?? 'dafeiyu-sprite'
const baseUrl = `/sprite/${encodeURIComponent(packId)}/`

const SLEEP_MS = 20_000
const NAP_WAKE_MS = 60_000
const IDLE_FALLBACK_MS = 30_000

const boot = async (): Promise<void> => {
  const response = await fetch(`${baseUrl}manifest.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`manifest ${String(response.status)}`)
  const pack = (await response.json()) as SpritePack

  canvas.width = pack.canvasWidth
  canvas.height = pack.canvasHeight
  // 画布按窗口大小等比缩放（窗口 = 精灵尺寸 × 0.5 + 边距，这里再按实际空白算一次）
  const fitCanvas = (): void => {
    const availW = Math.max(80, window.innerWidth - 72)
    const availH = Math.max(60, window.innerHeight - 72)
    const scale = Math.min(availW / pack.canvasWidth, availH / pack.canvasHeight)
    canvas.style.width = `${String(Math.round(pack.canvasWidth * scale))}px`
    canvas.style.height = `${String(Math.round(pack.canvasHeight * scale))}px`
  }
  fitCanvas()
  window.addEventListener('resize', fitCanvas)

  const player = await createSpritePlayer({ canvas, pack, baseUrl })
  const idleId = pack.idleAnimationId
  const pool = (pack.choreography?.periods?.day ?? pack.idleAnimationIds ?? [idleId]).filter((id) => id !== '')
  const activities = (pack.choreography?.activities ?? []).filter((id) => pack.animations.some((a) => a.id === id))
  const picker = createPoolPicker((id) => pack.animations.some((a) => a.id === id))
  const pickFresh = (ids: readonly string[] | undefined, key: string): string | undefined => picker.pick(ids, key)

  let rotations = 0
  let lastTarget = ''
  /** 网页端推来的状态（idle 时本地自己轮换） */
  let remoteState = 'idle'
  let sleeping = false
  let sleepTimer = 0
  let napTimer = 0
  let idleFallback = 0

  const clearSleepTimers = (): void => {
    window.clearTimeout(sleepTimer)
    window.clearTimeout(napTimer)
    window.clearTimeout(idleFallback)
    sleepTimer = 0
    napTimer = 0
    idleFallback = 0
  }

  const playIdle = (id: string): void => {
    lastTarget = id
    player.play(id, false, false, 0, undefined, rotate)
  }

  const scheduleFallback = (): void => {
    window.clearTimeout(idleFallback)
    idleFallback = window.setTimeout(rotate, IDLE_FALLBACK_MS)
  }

  const rotate = (): void => {
    if (sleeping || remoteState !== 'idle') return
    const decision = decideIdleRotation(
      { lastTarget, pool, activities, rotations, idleId },
      pickFresh,
    )
    rotations = decision.rotations
    const chosen = avoidSame(decision.play, lastTarget, pool, pickFresh)
    if (chosen !== undefined && chosen !== lastTarget) playIdle(chosen)
    scheduleFallback()
  }

  const wake = (): void => {
    if (!sleeping) return
    sleeping = false
    window.clearTimeout(napTimer)
    const wakeId = pack.states?.wake
    if (wakeId !== undefined) {
      player.play(wakeId, true, false, 0, () => {
        rotate()
      })
    } else {
      rotate()
    }
  }

  const sleep = (): void => {
    if (sleeping || document.hidden) return
    sleeping = true
    window.clearTimeout(idleFallback)
    const sleepId = pack.states?.sleep
    if (sleepId !== undefined) player.play(sleepId, false, false, 0, undefined, () => undefined)
    // 1 分钟后自动醒一次，再继续待机
    napTimer = window.setTimeout(() => {
      if (sleeping) wake()
    }, NAP_WAKE_MS)
  }

  /** 有任何交互都重置"打瞌睡"倒计时 */
  const markActive = (): void => {
    if (sleeping) wake()
    window.clearTimeout(sleepTimer)
    sleepTimer = window.setTimeout(sleep, SLEEP_MS)
  }

  const playOnce = (ids: readonly string[] | undefined, key: string): void => {
    const id = pickFresh(ids, key)
    if (id === undefined) return
    sleeping = false
    window.clearTimeout(sleepTimer)
    player.play(id, true, false, 0, () => {
      markActive()
      rotate()
    })
  }

  const playRemote = (state: string): void => {
    remoteState = state
    if (state === 'idle') {
      rotate()
      return
    }
    const pool = state === 'working' ? pack.states?.workingPool : undefined
    const id = pool !== undefined && pool.length > 0 ? pickFresh(pool, 'working') : pack.states?.[state]
    if (id !== undefined && id !== '') {
      sleeping = false
      window.clearTimeout(sleepTimer)
      player.play(id, false, false, 0)
    }
  }

  // 点击穿透：按画布像素 alpha 判断鼠标是否落在人物上
  let lastInteractive = false
  let lastHitAt = 0
  window.addEventListener('mousemove', (event) => {
    const now = performance.now()
    if (now - lastHitAt < 80) return
    lastHitAt = now
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(((event.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.round(((event.clientY - rect.top) / rect.height) * canvas.height)
    let inside = false
    if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
      const ctx = canvas.getContext('2d')
      if (ctx !== null) {
        const alpha = ctx.getImageData(x, y, 1, 1).data[3] ?? 0
        inside = alpha > 8
      }
    }
    if (inside !== lastInteractive) {
      lastInteractive = inside
      window.petDesktop?.setInteractive?.(inside)
    }
  })
  window.addEventListener('mouseleave', () => {
    if (lastInteractive) {
      lastInteractive = false
      window.petDesktop?.setInteractive?.(false)
    }
  })

  markActive()
  rotate()

  canvas.addEventListener('click', () => {
    markActive()
    playOnce(pack.click?.animationIds, 'click')
  })
  canvas.addEventListener('mouseenter', () => {
    window.clearTimeout(sleepTimer)
    sleepTimer = window.setTimeout(sleep, SLEEP_MS)
    playOnce(pack.hover?.animationIds, 'hover')
  })
  window.addEventListener('beforeunload', () => {
    clearSleepTimers()
    player.destroy()
  })

  window.petDesktop?.ready?.({ pack: packId })
  window.petDesktop?.onCommand?.((command) => {
    if (command.type === 'play' && typeof command.payload === 'string') {
      player.play(command.payload, false, false, 0, rotate)
    }
    if (command.type === 'wake') wake()
    if (command.type === 'state' && typeof command.payload === 'object' && command.payload !== null) {
      const state = (command.payload as { state?: unknown }).state
      if (typeof state === 'string') playRemote(state)
    }
  })
}

void boot().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  document.body.dataset.error = message
  console.error('[pet-whale desktop]', message)
})
