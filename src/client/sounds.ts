// WebAudio 合成音效：从 preview.html 原样移植，加静音/音量记忆与浏览器自动播放策略解锁。

export type SoundType = 'bubble' | 'work' | 'celebrate' | 'error' | 'snack' | 'trick'

/** 音量三档；mid 就是 1.1.x 一直以来的响度 */
export type VolumeLevel = 'low' | 'mid' | 'high'
export const VOLUME_LEVELS: readonly VolumeLevel[] = ['low', 'mid', 'high']
const VOLUME_GAIN: Record<VolumeLevel, number> = { low: 0.4, mid: 1, high: 1.6 }

const MUTE_KEY = 'pet-whale:muted'
const VOLUME_KEY = 'pet-whale:volume'

export class WhaleSounds {
  private ctx: AudioContext | null = null
  /** 所有音效都接到这个总音量上，换档只改它的 gain */
  private master: GainNode | null = null
  private muted: boolean
  private level: VolumeLevel
  /**
   * 是否正在"说话"（TTS 播报中）。
   * 说话期间：总音量压低（duck），并跳过 bubble/trick/snack 这类互动小音，
   * 避免和语音叠在一起听不清。错误音仍保留（该提醒的要提醒）。
   */
  private speaking = false
  private disposed = false
  private resuming = false

  constructor() {
    let muted = false
    let level: VolumeLevel = 'mid'
    try {
      muted = localStorage.getItem(MUTE_KEY) === '1'
      const raw = localStorage.getItem(VOLUME_KEY)
      if ((VOLUME_LEVELS as readonly string[]).includes(raw ?? '')) level = raw as VolumeLevel
    } catch {
      // localStorage 不可用（隐私模式等），静音状态仅本次会话生效
    }
    this.muted = muted
    this.level = level
  }

  /** 说话时把总音量压到 35%，说完恢复。 */
  private applyGain(): void {
    if (this.master === null) return
    const base = VOLUME_GAIN[this.level]
    this.master.gain.value = this.speaking ? base * 0.35 : base
  }

  /** 说话状态：供 TTS 播报期间调用。 */
  setSpeaking(on: boolean): void {
    if (this.speaking === on) return
    this.speaking = on
    this.applyGain()
  }

  get isSpeaking(): boolean {
    return this.speaking
  }

  get isMuted(): boolean {
    return this.muted
  }

  get volume(): VolumeLevel {
    return this.level
  }

  setVolume(level: VolumeLevel): void {
    this.level = level
    this.applyGain()
    try {
      localStorage.setItem(VOLUME_KEY, level)
    } catch {
      // 忽略存储失败
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // 忽略存储失败
    }
  }

  /** 浏览器自动播放策略：AudioContext 需在用户手势后 resume，挂一次全局 pointerdown 解锁。 */
  installGestureUnlock(): void {
    if (this.disposed) return
    document.addEventListener('pointerdown', this.unlock, { capture: true, passive: true })
  }

  private readonly unlock = () => {
    if (this.muted || this.disposed) return
    try { this.acquire() } catch { /* 音频不可用不能打断用户手势 */ }
  }

  /** 卸载时收干净：热重载一次留一个 AudioContext 和一个全局监听，攒多了会出怪事 */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    document.removeEventListener('pointerdown', this.unlock, { capture: true })
    if (this.ctx !== null) void this.ctx.close().catch(() => {})
    this.ctx = null
    this.master = null
  }

  private acquire(): AudioContext | null {
    if (this.disposed) return null
    if (this.ctx === null) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor === undefined) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = VOLUME_GAIN[this.level]
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended' && !this.resuming) {
      this.resuming = true
      try {
        void this.ctx.resume().catch(() => {}).finally(() => { this.resuming = false })
      } catch {
        this.resuming = false
      }
    }
    return this.ctx
  }

  play(type: SoundType): void {
    // 说话期间不叠互动小音（气泡/逗弄/零食），只留 work/celebrate/error 这类状态音
    if (this.speaking && (type === 'bubble' || type === 'trick' || type === 'snack')) return
    if (this.muted) return
    try {
      const ctx = this.acquire()
      if (ctx === null) return
      const out: AudioNode = this.master ?? ctx.destination
      const now = ctx.currentTime
      if (type === 'bubble') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(420, now)
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.12)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14)
        osc.connect(gain)
        gain.connect(out)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === 'work') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(720, now)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06)
        osc.connect(gain)
        gain.connect(out)
        osc.start(now)
        osc.stop(now + 0.07)
      } else if (type === 'celebrate') {
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + i * 0.08)
          gain.gain.setValueAtTime(0.2, now + i * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.22)
          osc.connect(gain)
          gain.connect(out)
          osc.start(now + i * 0.08)
          osc.stop(now + i * 0.08 + 0.23)
        })
      } else if (type === 'error') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(320, now)
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26)
        osc.connect(gain)
        gain.connect(out)
        osc.start(now)
        osc.stop(now + 0.27)
      } else if (type === 'snack') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.1)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
        osc.connect(gain)
        gain.connect(out)
        osc.start(now)
        osc.stop(now + 0.13)
      } else if (type === 'trick') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(350, now)
        osc.frequency.exponentialRampToValueAtTime(1050, now + 0.35)
        gain.gain.setValueAtTime(0.28, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.connect(gain)
        gain.connect(out)
        osc.start(now)
        osc.stop(now + 0.42)
      }
    } catch {
      // 音效失败不影响任何功能
    }
  }
}
