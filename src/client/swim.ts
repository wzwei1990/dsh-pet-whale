// src/client/swim.ts
// 桌宠小鲸鱼：自主游动动效系统
// 采用 rAF + 三次贝塞尔曲线轨迹 + 动态俯仰角（Banking/Pitch）+ 水平自适应翻转 + 深度下潜（Depth Dive）+ 航迹波纹水圈 + 流线微水泡 + 破浪飞溅水花 + 庆祝彩屑

import type { PetStrings } from './i18n'
import type { WhaleState } from './state'

export const SWIM_STORAGE_KEY = 'pet-whale:swim'

export interface SwimContext {
  root: HTMLElement
  pet: HTMLElement
  clampPos: (x: number, y: number) => { x: number; y: number }
  savePos: () => void
  popBubble: () => void
  showDialog: (text: string) => void
  getStrings: () => PetStrings
  isBusy: () => boolean
  /** 当前实际占位，随缩放变——粒子挂在全局层用视口坐标，必须按真尺寸算 */
  petSize: () => { w: number; h: number }
}

interface Point {
  x: number
  y: number
}

type SwimMode = 'cruise' | 'dive'

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]
const MAX_PARTICLES = 40

/** 获取或创建独立的全屏固定粒子层（挂在 body 下，避免随鲸鱼 root 位移） */
export function getOrCreateParticleLayer(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  let layer = document.querySelector<HTMLElement>('[data-dsh-whale-particles]')
  if (!layer) {
    layer = document.createElement('div')
    layer.setAttribute('data-dsh-whale-particles', '')
    layer.className = 'pw-particle-layer'
    document.body.appendChild(layer)
  }
  return layer
}

export class WhaleSwimmer {
  private ctx: SwimContext
  private enabled = false
  private rafId = 0
  private timerId: number | undefined
  private isSwimming = false
  private facing: 'left' | 'right' = 'left'
  private disposed = false

  // 物理与运动状态
  private currentPos: Point = { x: 0, y: 0 }
  private startPos: Point = { x: 0, y: 0 }
  private targetPos: Point = { x: 0, y: 0 }
  private cp1: Point = { x: 0, y: 0 }
  private cp2: Point = { x: 0, y: 0 }
  private startTime = 0
  private duration = 2400
  private currentMode: SwimMode = 'cruise'

  // 水效粒子管理
  private particles: HTMLElement[] = []
  private lastBubbleTime = 0
  private lastRippleTime = 0
  private lastStreamBubbleTime = 0
  private hasSplashedThisSession = false

  constructor(ctx: SwimContext) {
    this.ctx = ctx
    this.ctx.root.dataset.facing = this.facing
    this.loadState()
  }

  public get isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(value: boolean): void {
    if (this.enabled === value) return
    this.enabled = value
    this.saveState()
    if (this.enabled) {
      this.scheduleNext(1200)
    } else {
      this.stop()
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled)
    return this.enabled
  }

  public get currentFacing(): 'left' | 'right' {
    return this.facing
  }

  public setFacing(f: 'left' | 'right'): void {
    this.facing = f
    this.ctx.root.dataset.facing = f
    this.ctx.pet.style.transform = `scaleX(${f === 'left' ? 1 : -1}) rotate(0deg)`
  }

  private loadState(): void {
    try {
      this.enabled = localStorage.getItem(SWIM_STORAGE_KEY) === '1'
    } catch {
      this.enabled = false
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(SWIM_STORAGE_KEY, this.enabled ? '1' : '0')
    } catch {
      // 忽略本地存储异常
    }
  }

  /** agent 状态切换通知 */
  public onStateChange(state: WhaleState): void {
    if (state !== 'idle') {
      this.stop()
    } else if (this.enabled) {
      this.scheduleNext(2000 + Math.random() * 2000)
    }
  }

  /** 用户开始拖拽/点击交互时立即中断游泳 */
  /** 被甩晕之后游不直，到这个时刻为止 */
  private woozyUntil = 0
  /** 晕了多久：期间的航迹会明显更歪 */
  public setWoozy(ms: number): void {
    this.woozyUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + ms
  }
  private get isWoozy(): boolean {
    return (typeof performance !== 'undefined' ? performance.now() : Date.now()) < this.woozyUntil
  }

  public interrupt(): void {
    this.stop()
    if (this.enabled) {
      this.scheduleNext(5000 + Math.random() * 3000)
    }
  }

  /** 停止当前正在进行的游泳与计时器，平稳复位 */
  public stop(): void {
    if (this.rafId !== 0) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId)
      this.timerId = undefined
    }

    this.clearParticles()
    this.ctx.pet.style.opacity = '1'

    if (this.isSwimming) {
      this.isSwimming = false
      this.ctx.root.classList.remove('swimming')
      this.ctx.pet.classList.remove('swimming', 'swimming-dive')
      this.ctx.root.dataset.facing = this.facing
      // 平滑保留当前朝向，移除俯仰角与下潜形变
      this.ctx.pet.style.transform = `scaleX(${this.facing === 'left' ? 1 : -1}) rotate(0deg)`
      this.ctx.savePos()
    }
  }

  /** 调度下一次游泳 */
  public scheduleNext(delay?: number): void {
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId)
      this.timerId = undefined
    }
    if (this.disposed || !this.enabled) return

    const wait = delay ?? (3000 + Math.random() * 3500)
    this.timerId = window.setTimeout(() => {
      this.timerId = undefined
      if (!this.enabled) return

      // 检查减速偏好、页面可见性及繁忙状态
      if (this.prefersReducedMotion()) {
        this.scheduleNext(6000)
        return
      }

      if (this.ctx.isBusy()) {
        this.scheduleNext(1500)
        return
      }

      this.startSwimSession()
    }, wait)
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /** 启动一次自然游动或深潜 */
  private startSwimSession(): void {
    this.stop()

    // 游动期间由本循环逐帧写 left/top，容器上绝不能留着 transition：
    // 留着的话每帧写入都会被补间拦截，鲸鱼钉在原地，而水花水纹按算出来的
    // 逻辑坐标照常发射，看上去就是"鲸鱼没动，屏幕别处冒水纹"。
    this.ctx.root.style.transition = ''

    const curX = parseFloat(this.ctx.root.style.left) || 0
    const curY = parseFloat(this.ctx.root.style.top) || 0
    this.startPos = { x: curX, y: curY }
    this.currentPos = { x: curX, y: curY }

    // 22% 概率深潜，78% 概率常规巡航
    this.currentMode = Math.random() < 0.22 ? 'dive' : 'cruise'

    // 计算游动目标点与贝塞尔控制点
    const { target, cp1, cp2, duration } = this.planTrajectory(this.startPos, this.currentMode)
    this.targetPos = target
    this.cp1 = cp1
    this.cp2 = cp2
    this.duration = duration
    this.startTime = performance.now()
    this.lastBubbleTime = this.startTime
    this.lastRippleTime = this.startTime
    this.lastStreamBubbleTime = this.startTime
    this.hasSplashedThisSession = false

    this.isSwimming = true
    this.ctx.root.classList.add('swimming')
    this.ctx.pet.classList.add('swimming')
    if (this.currentMode === 'dive') {
      this.ctx.pet.classList.add('swimming-dive')
    }

    // 偶发台词
    if (Math.random() < 0.3) {
      const strings = this.ctx.getStrings()
      this.ctx.showDialog(pick(strings.feedback.swim))
    }

    this.rafId = window.requestAnimationFrame(this.step)
  }

  /** 规划贝塞尔曲线航迹 */
  private planTrajectory(start: Point, mode: SwimMode): { target: Point; cp1: Point; cp2: Point; duration: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900

    const dist = mode === 'dive' ? (100 + Math.random() * 120) : (140 + Math.random() * 180)
    
    // 偏向屏幕中心或根据当前位置自然游动
    const cx = vw / 2
    const cy = vh / 2
    const toCenterAngle = Math.atan2(cy - start.y, cx - start.x)
    // 叠加随机扰动角 (±60°)；刚被甩晕的时候连方向都拿不准，扰动放大一倍多
    const wobble = this.isWoozy ? 2.2 : 1
    const angle = toCenterAngle + (Math.random() * 1.8 - 0.9) * wobble

    const rawTx = start.x + Math.cos(angle) * dist
    const rawTy = start.y + Math.sin(angle) * dist + (mode === 'dive' ? (30 + Math.random() * 40) : 0)
    const target = this.ctx.clampPos(rawTx, rawTy)

    const dx = target.x - start.x
    const dy = target.y - start.y
    const actualDist = Math.hypot(dx, dy) || 1

    // 法向量用于生成侧向拱起弧度
    const nx = -dy / actualDist
    const ny = dx / actualDist
    const curveAmp = (mode === 'dive' ? 45 : (30 + Math.random() * 35)) * (Math.random() < 0.5 ? 1 : -1) * wobble

    let cp1: Point
    let cp2: Point

    if (mode === 'dive') {
      // 下潜模式：控制点下压，形成深潜 U 形弧
      cp1 = {
        x: start.x + dx * 0.3 + nx * curveAmp * 0.5,
        y: start.y + dy * 0.2 + 55,
      }
      cp2 = {
        x: start.x + dx * 0.7 + nx * curveAmp * 0.5,
        y: start.y + dy * 0.8 + 45,
      }
    } else {
      // 常规巡航：平滑 S 形或自然弧线
      cp1 = {
        x: start.x + dx * 0.33 + nx * curveAmp,
        y: start.y + dy * 0.33 + ny * curveAmp,
      }
      cp2 = {
        x: start.x + dx * 0.67 + nx * curveAmp * 0.6,
        y: start.y + dy * 0.67 + ny * curveAmp * 0.6,
      }
    }

    const duration = Math.max(1600, Math.min(3600, actualDist * 14 + (mode === 'dive' ? 600 : 0)))
    return { target, cp1, cp2, duration }
  }

  /** 产生尾部扩散水纹圈（挂在全局粒子层，视口绝对坐标，留出自然拖尾） */
  public spawnWaterRipple(x: number, y: number, isDive = false): void {
    if (typeof document === 'undefined' || this.prefersReducedMotion()) return
    const layer = getOrCreateParticleLayer()
    if (!layer) return

    const ripple = document.createElement('span')
    ripple.className = 'pw-water-ripple'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    if (isDive) {
      ripple.style.width = '52px'
      ripple.style.height = '32px'
    } else {
      ripple.style.width = '38px'
      ripple.style.height = '24px'
    }
    layer.appendChild(ripple)
    this.addParticle(ripple)
  }

  /** 产生游动流线微水泡（挂在全局粒子层，自然随洋流向上/向后漂移） */
  public spawnStreamBubble(x: number, y: number, isDive = false): void {
    if (typeof document === 'undefined' || this.prefersReducedMotion()) return
    const layer = getOrCreateParticleLayer()
    if (!layer) return

    const bubble = document.createElement('span')
    bubble.className = 'pw-stream-bubble'
    const size = isDive ? (5 + Math.random() * 5) : (3.5 + Math.random() * 4)
    const dx = (this.facing === 'left' ? 1 : -1) * (10 + Math.random() * 16)
    const dy = -(14 + Math.random() * 22)
    const dur = 0.9 + Math.random() * 0.45

    bubble.style.left = `${x + (Math.random() * 12 - 6)}px`
    bubble.style.top = `${y + (Math.random() * 10 - 5)}px`
    bubble.style.width = `${size.toFixed(1)}px`
    bubble.style.height = `${size.toFixed(1)}px`
    bubble.style.setProperty('--pw-b-dx', `${dx.toFixed(1)}px`)
    bubble.style.setProperty('--pw-b-dy', `${dy.toFixed(1)}px`)
    bubble.style.setProperty('--pw-b-dur', `${dur.toFixed(2)}s`)

    layer.appendChild(bubble)
    this.addParticle(bubble)
  }

  /** 产生破浪出水/翻滚飞溅微水花 */
  public spawnSplash(x: number, y: number, count = 5): void {
    if (typeof document === 'undefined' || this.prefersReducedMotion()) return
    const layer = getOrCreateParticleLayer()
    if (!layer) return

    for (let i = 0; i < count; i++) {
      const drop = document.createElement('span')
      drop.className = 'pw-splash-drop'
      const size = 3 + Math.random() * 3.5
      const dx = (Math.random() * 36 - 18)
      const dy = -(18 + Math.random() * 26)
      const dur = 0.5 + Math.random() * 0.25

      drop.style.left = `${x + (Math.random() * 14 - 7)}px`
      drop.style.top = `${y}px`
      drop.style.width = `${size.toFixed(1)}px`
      drop.style.height = `${size.toFixed(1)}px`
      drop.style.setProperty('--pw-sp-dx', `${dx.toFixed(1)}px`)
      drop.style.setProperty('--pw-sp-dy', `${dy.toFixed(1)}px`)
      drop.style.setProperty('--pw-sp-dur', `${dur.toFixed(2)}s`)

      layer.appendChild(drop)
      this.addParticle(drop)
    }
  }

  /** 产生悬空拖拽水滴下坠 */
  public spawnDrip(x: number, y: number): void {
    if (typeof document === 'undefined' || this.prefersReducedMotion()) return
    const layer = getOrCreateParticleLayer()
    if (!layer) return

    const drip = document.createElement('span')
    drip.className = 'pw-drag-drip'
    drip.style.left = `${x + (Math.random() * 10 - 5)}px`
    drip.style.top = `${y}px`
    drip.style.width = '4px'
    drip.style.height = '6.5px'

    layer.appendChild(drip)
    this.addParticle(drip)
  }

  /** 产生庆祝彩色纸屑粒子 */
  public spawnConfetti(x: number, y: number, count = 18): void {
    if (typeof document === 'undefined' || this.prefersReducedMotion()) return
    const layer = getOrCreateParticleLayer()
    if (!layer) return

    const colors = ['#4D6BFE', '#8FB5FF', '#3BC46D', '#FFD15C', '#F0A0A0', '#B388FF', '#FF9F43']
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span')
      el.className = 'pw-confetti'
      const w = 4.5 + Math.random() * 4
      const h = 6 + Math.random() * 5
      const color = pick(colors)
      const dx = Math.random() * 100 - 50
      const dy = -(40 + Math.random() * 50)
      const dur = 0.95 + Math.random() * 0.35

      el.style.left = `${x + (Math.random() * 16 - 8)}px`
      el.style.top = `${y + (Math.random() * 8 - 4)}px`
      el.style.setProperty('--pw-cf-w', `${w.toFixed(1)}px`)
      el.style.setProperty('--pw-cf-h', `${h.toFixed(1)}px`)
      el.style.setProperty('--pw-cf-bg', color)
      el.style.setProperty('--pw-cf-dx', `${dx.toFixed(1)}px`)
      el.style.setProperty('--pw-cf-dy', `${(Math.abs(dy) + 90 + Math.random() * 40).toFixed(1)}px`)
      el.style.setProperty('--pw-cf-dur', `${dur.toFixed(2)}s`)

      layer.appendChild(el)
      this.addParticle(el)
    }
  }

  private addParticle(el: HTMLElement): void {
    this.particles.push(el)
    el.addEventListener('animationend', () => {
      this.removeParticle(el)
    }, { once: true })

    if (this.particles.length > MAX_PARTICLES) {
      const oldest = this.particles.shift()
      oldest?.remove()
    }
  }

  private removeParticle(el: HTMLElement): void {
    const idx = this.particles.indexOf(el)
    if (idx !== -1) this.particles.splice(idx, 1)
    el.remove()
  }

  public clearParticles(): void {
    for (const p of this.particles) p.remove()
    this.particles = []
  }

  /** 动画帧主循环 */
  private step = (now: number): void => {
    if (!this.isSwimming) return

    if (this.ctx.isBusy()) {
      this.stop()
      this.scheduleNext(2000)
      return
    }

    const elapsed = now - this.startTime
    const progress = Math.min(1, elapsed / this.duration)

    // 三次缓动曲线（Ease-in-out Cubic）
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    // 计算当前贝塞尔位置 P(ease)
    const u = ease
    const u1 = 1 - u
    const rawX = u1 * u1 * u1 * this.startPos.x +
      3 * u1 * u1 * u * this.cp1.x +
      3 * u1 * u * u * this.cp2.x +
      u * u * u * this.targetPos.x

    const rawY = u1 * u1 * u1 * this.startPos.y +
      3 * u1 * u1 * u * this.cp1.y +
      3 * u1 * u * u * this.cp2.y +
      u * u * u * this.targetPos.y
    // 曲线控制点可能越界，且动画中途视口可能缩小；不能只钳终点。
    const { x: curX, y: curY } = this.ctx.clampPos(rawX, rawY)

    // 计算瞬时导数切线向量（用于确定朝向与俯仰角）
    const dX = 3 * u1 * u1 * (this.cp1.x - this.startPos.x) +
      6 * u1 * u * (this.cp2.x - this.cp1.x) +
      3 * u * u * (this.targetPos.x - this.cp2.x)

    const dY = 3 * u1 * u1 * (this.cp1.y - this.startPos.y) +
      6 * u1 * u * (this.cp2.y - this.cp1.y) +
      3 * u * u * (this.targetPos.y - this.cp2.y)

    // 水平朝向判断（默认 SVG 朝左：scaleX(1) 为向左，scaleX(-1) 为向右）
    if (Math.abs(dX) > 0.8) {
      const nextFacing = dX > 0 ? 'right' : 'left'
      if (this.facing !== nextFacing) {
        this.facing = nextFacing
        this.ctx.root.dataset.facing = this.facing
      }
    }

    // 俯仰角 Banking/Pitch 姿态计算
    const speed = Math.hypot(dX, dY) || 1
    const normalizedVy = dY / speed
    const maxPitch = this.currentMode === 'dive' ? 24 : 14
    let pitchDeg = 0

    if (this.facing === 'right') {
      // 朝右时，向下游动 (dY > 0) 头部向下倾斜，向上游动 (dY < 0) 头部向上仰起
      pitchDeg = Math.max(-maxPitch, Math.min(maxPitch, normalizedVy * maxPitch))
    } else {
      // 朝左时（默认），向下游动 (dY > 0) 头部在左侧应顺时针压下，向上为逆时针仰起
      pitchDeg = Math.max(-maxPitch, Math.min(maxPitch, -normalizedVy * maxPitch))
    }

    // 游动摆尾微颤（随速度变化的自然仿生起伏）
    const wiggle = Math.sin(progress * Math.PI * 6) * (1 - progress * 0.4) * 2.2
    pitchDeg += wiggle

    // 下潜深度透视：深度缩放 + 深度透明度
    let scaleDepth = 1
    let depthOpacity = 1
    const isDive = this.currentMode === 'dive'
    if (isDive) {
      const diveArc = Math.sin(progress * Math.PI)
      scaleDepth = 1 - diveArc * 0.12 // 下潜时缩小至 0.88
      depthOpacity = 1 - diveArc * 0.22 // 深度水域光影折射

      // 下潜后回升跃起破浪水花触发
      if (progress > 0.72 && progress < 0.85 && !this.hasSplashedThisSession) {
        this.hasSplashedThisSession = true
        const sz = this.ctx.petSize()
        this.spawnSplash(curX + sz.w / 2, curY + sz.h * 0.6, 5)
        this.spawnWaterRipple(curX + sz.w / 2, curY + sz.h * 0.6, true)
      }
    }

    // 更新 DOM 位置与形变
    const scaleX = (this.facing === 'left' ? 1 : -1) * scaleDepth
    const scaleY = scaleDepth
    this.ctx.root.style.left = `${curX}px`
    this.ctx.root.style.top = `${curY}px`
    this.ctx.pet.style.transform = `scale(${scaleX}, ${scaleY}) rotate(${pitchDeg.toFixed(2)}deg)`
    this.ctx.pet.style.opacity = `${depthOpacity.toFixed(3)}`

    // 计算尾巴在视口中的绝对发射坐标（固定挂在全屏粒子层，形成自然拖尾）
    const size = this.ctx.petSize()
    const tailX = curX + size.w * (this.facing === 'left' ? 112 / 137 : 25 / 137)
    const tailY = curY + size.h * 52 / 101

    // 1. 水流尾波圈发射（每隔 260~320ms）
    const rippleGap = isDive ? 220 : 300
    if (now - this.lastRippleTime > rippleGap && progress > 0.08 && progress < 0.92) {
      this.lastRippleTime = now
      this.spawnWaterRipple(tailX, tailY, isDive)
    }

    // 2. 尾迹流线水泡微粒发射（每隔 150~220ms）
    const streamGap = isDive ? 140 : 200
    if (now - this.lastStreamBubbleTime > streamGap && progress > 0.05 && progress < 0.95) {
      this.lastStreamBubbleTime = now
      this.spawnStreamBubble(tailX, tailY, isDive)
    }

    // 3. 鲸鱼本体冒大泡泡
    if (now - this.lastBubbleTime > (isDive ? 260 : 500)) {
      this.lastBubbleTime = now
      this.ctx.popBubble()
    }

    if (progress < 1) {
      this.rafId = window.requestAnimationFrame(this.step)
    } else {
      this.rafId = 0
      this.isSwimming = false
      this.ctx.root.classList.remove('swimming')
      this.ctx.pet.classList.remove('swimming', 'swimming-dive')
      this.ctx.root.dataset.facing = this.facing
      this.ctx.pet.style.opacity = '1'
      this.ctx.pet.style.transform = `scaleX(${this.facing === 'left' ? 1 : -1}) rotate(0deg)`
      this.ctx.savePos()

      this.scheduleNext()
    }
  }

  /** 完全清理 */
  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stop()
    if (typeof document !== 'undefined') {
      const layer = document.querySelector('[data-dsh-whale-particles]')
      layer?.remove()
    }
  }
}
