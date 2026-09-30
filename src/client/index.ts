// pet-whale client bundle：纯 DOM 桌宠。
// apply(ctx) 由官方 client 通道调用；状态来自 ctx.sessions（会话生命周期快照）、
// ctx.uiConversation（会话对话视图，提供 partial / runningCalls / turnEnds）
// 与 ctx.uiSession.sessionStatus（0.1.7：每个会话的 running / 待确认，用于跟随所有会话）。
import type { Context } from '@deepseek-ai/cordis'
import type { ISessions, SessionFace } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client'
import { BASE_CSS } from './styles'
import { VOLUME_LEVELS, WhaleSounds } from './sounds'
import { WhaleDriver, type WhaleSnapshot, type WhaleState } from './state'
import { PALETTES, applyPalette, loadPaletteId, paletteOf, savePaletteId } from './palettes'
import { PETS, loadPetId, petOf, savePetId, type PetModule } from './pets'
import { detectBrowserLocale, getStrings, paletteName, petName, type PetLocale, type PetStrings } from './i18n'
import { WhaleSwimmer } from './swim'
import { currentSessionId, partialTextOf, partialHasToolCall, type SessionRow } from './host-snapshot'

// 官方 client 通道的服务闸：等 sessions / locale / uiConversation / uiSession 服务就绪后再 apply。
// uiConversation 由 @deepseek-ai/dsh-client-ui-conversation 提供，
// chat 视图（ChatSnapshot）由 @deepseek-ai/dsh-client-ui-chat 注册，
// uiSession 由 @deepseek-ai/dsh-client-ui-session 提供（0.1.5 就有，sessionStatus 是 0.1.7 才加的）。
export const inject = ['sessions', 'locale', 'uiConversation', 'uiSession']

const STATES: readonly WhaleState[] = ['idle', 'think', 'working', 'celebrate', 'error', 'wait', 'disappointed']
const POS_KEY = 'pet-whale:pos'
/** 隐藏状态：'1' 表示隐藏到右下角小按钮 */
const HIDDEN_KEY = 'pet-whale:hidden'
const PRETEND_KEY = 'pet-whale:pretend'
const SWIM_KEY = 'pet-whale:swim'
const THINK_TICKER_KEY = 'pet-whale:think-ticker'
const MINI_POS_KEY = 'pet-whale:mini-pos'
const AUTO_HIDE_KEY = 'pet-whale:auto-hide'
/** 完成提醒：页面在后台时闪标签页标题 */
const NOTIFY_KEY = 'pet-whale:notify'
/** 系统通知：需要浏览器授权，默认关 */
const SYS_NOTIFY_KEY = 'pet-whale:sys-notify'
/** 久坐提醒阈值（分钟），0 表示关 */
const SEDENTARY_KEY = 'pet-whale:sedentary'
const SEDENTARY_CHOICES = [0, 45, 60, 90] as const
/** 久坐计时的心跳间隔 */
const SEDENTARY_TICK_MS = 60000

/**
 * 熟悉度门槛：分数越过就进下一档。
 * 分数 = 互动次数 + 完成回合×2 + 共处天数×4——三个维度都算，
 * 免得只靠猛戳一天就刷满，"处得久"本身也该有分量。
 */
const BOND_THRESHOLDS = [0, 80, 400] as const
/** 形影不离档才有的主动搭话：检查间隔，与真正开口的概率 */
const CHATTER_TICK_MS = 45000
const CHATTER_CHANCE = 0.18

/**
 * 抓住左右猛甩：靠"方向反转"计数，不看速度。
 * 一条腿走够 SHAKE_MIN_LEG 才算一次真甩动，免得手抖被当成甩；
 * 反转要挤在 SHAKE_WINDOW_MS 里，慢慢来回挪不该把它晃晕。
 */
const SHAKE_MIN_LEG = 26
const SHAKE_REVERSALS = 4
const SHAKE_WINDOW_MS = 1100
const SHAKEN_MS = 1600
/** 晕完还要缓一会儿，不然一路甩下去会连环触发 */
const SHAKE_COOLDOWN_MS = 1400
/** 甩晕之后游不直的时长 */
const WOOZY_MS = 12000
/** 翻肚皮动画时长，与 pw-bellyUp 对齐 */
const BELLY_UP_MS = 2000
/** 拖着不放又不动多久开始不耐烦 */
const DRAG_IDLE_MS = 2000
/** 判定"贴边"的容差：拖到离边这么近就算压上去了 */
const EDGE_SLACK = 2
/** 离开页面超过这么久，视为已经休息过，久坐计时清零 */
const SEDENTARY_AWAY_RESET_MS = 600000
const AUTO_HIDE_CHECK_MS = 30000
/** 智能避让：只有 idle 且光标在身侧停留这么久才让开 */
const AVOID_DWELL_MS = 900
const AVOID_MARGIN = 48
const AVOID_STEP = 120
/** 抓取/右键后 8 秒内不再避让，保证“想抓就能抓住” */
const AVOID_COOLDOWN_MS = 8000
const SLEEP_MS = 20000
const DIALOG_MS = 2600
/** 自动音效最小间隔（防 think/working 抖动连响） */
const SOUND_GAP_MS = 1200

const pick = (list: string[]): string => list[Math.floor(Math.random() * list.length)]

/** 跟随所有会话：别的会话在跑 / 跑完 / 等确认也让鲸鱼知道，'0' 表示只看当前会话 */
const FOLLOW_ALL_KEY = 'pet-whale:follow-all'
/** 同时在跑的会话（含当前）到这个数就算"加班" */
const OVERTIME_AT = 4

/** DSH locale 服务的最小接口（不引入额外依赖）。 */
interface LocaleLike {
  getLocale(): { active: string }
  subscribe(fn: () => void): () => void
}

/** dsh-client-ui-session 的 SessionStatus 最小面（0.1.7）。 */
interface SessionStatusLike {
  readonly running: boolean | undefined
  readonly pendingInteraction: unknown
}
interface SessionStatusSource {
  getSnapshot(): ReadonlyMap<string, SessionStatusLike>
  subscribe(fn: () => void): () => void
}

export function apply(ctx: Context): () => void {
  if (typeof document === 'undefined') return () => {}

  // 挂在 document 上，bundle 重新求值后仍能找到上一代 disposer。
  const owner = document as Document & { __petWhaleDispose?: () => void }
  owner.__petWhaleDispose?.()
  let disposed = false
  const timers = new Set<number>()
  const later = (fn: () => void, ms: number): number => {
    if (disposed) return 0
    const id = window.setTimeout(() => {
      timers.delete(id)
      if (!disposed) fn()
    }, ms)
    timers.add(id)
    return id
  }
  const cancelLater = (id: number | undefined) => {
    window.clearTimeout(id)
    if (id !== undefined) timers.delete(id)
  }
  // 仅处理没有 disposer 的旧版残留节点。
  document.querySelectorAll('[data-dsh-whale-mini], [data-dsh-whale-particles]').forEach((el) => el.remove())
  // 双挂载防护：先清掉旧实例
  document.querySelectorAll('[data-dsh-whale]').forEach((el) => el.remove())
  document.getElementById('pet-whale-style')?.remove()
  document.getElementById('pet-whale-pet-style')?.remove()

  // ===== 样式 =====
  // 两张表：BASE_CSS 常驻（与宠物无关的 UI + 全部 keyframes）；
  // petStyle 只装"当前宠物"的私有样式，切宠物时整段替换 → 两只宠物的选择器与动画永不共存。
  const style = document.createElement('style')
  style.id = 'pet-whale-style'
  style.textContent = BASE_CSS
  document.head.appendChild(style)

  const petStyle = document.createElement('style')
  petStyle.id = 'pet-whale-pet-style'
  document.head.appendChild(petStyle)


    // ===== 语言 =====
    const localeService = (ctx as unknown as { locale?: LocaleLike }).locale
    let locale: PetLocale = localeService ? (localeService.getLocale().active === 'en' ? 'en' : 'zh') : detectBrowserLocale()

  // ===== 宠物 =====
  // 当前宠物决定 .pet-official 塞哪段 SVG、挂哪张私有样式表、说什么话；选择记在 localStorage。
  let activePet: PetModule = petOf(loadPetId())
  /** 宠物显示名：i18n 优先，缺了就用 PetModule 自带的名字 */
  const petDisplayName = (p: PetModule): string => petName(locale, p.id, locale === 'en' ? p.name.en : p.name.zh)
  /** 当前语言的文案：基准是鲸鱼口吻，宠物可以用 text 覆盖它（见 pets/cat/text.ts） */
  let strings: PetStrings = getStrings(locale, activePet.text?.[locale])
  // ===== DOM =====
  const root = document.createElement('div')
  root.setAttribute('data-dsh-whale', '')
  root.dataset.pet = activePet.id
  root.innerHTML = `
    <span class="dsh-whale-shadow"></span>
    <span class="dsh-whale-wake"></span>
    <div class="dsh-whale-dialog"></div>
    <span class="dsh-whale-snack">🐟</span>
    <span class="dsh-whale-zzz">Zzz...</span>
    <div class="pet-official idle" role="img" aria-label="${strings.aria.petName(petDisplayName(activePet))}">${activePet.html}</div>
    <span class="dsh-whale-badge" hidden></span>
    <div class="dsh-whale-menu" role="menu"></div>
  `
  const dialog = root.querySelector<HTMLElement>('.dsh-whale-dialog')!
  const badge = root.querySelector<HTMLElement>('.dsh-whale-badge')!
  const snack = root.querySelector<HTMLElement>('.dsh-whale-snack')!
  // 容器本身永不重建，只有它的 innerHTML 随宠物切换 → 容器上的状态 class 原地保留
  const pet = root.querySelector<HTMLElement>('.pet-official')!
  const menu = root.querySelector<HTMLElement>('.dsh-whale-menu')!
  /**
   * 追光瞳孔：唯一被 JS 直接引用的 SVG 部件。切换宠物会重建 innerHTML，
   * 所以按需现取而不是缓存元素引用（代价只是一次 querySelector）。
   */
  const petPupil = (): SVGCircleElement | null =>
    pet.querySelector<SVGCircleElement>(activePet.pupilSelector ?? '.pupil-highlight')

  /**
   * 切换宠物：换内联 SVG + 换宠物私有样式表 + 同步容器尺寸变量。
   * 不碰状态 class，所以新宠物立刻按当前状态动起来，不需要重放状态机。
   */
  const applyPet = (id: string): void => {
    const next = petOf(id)
    activePet = next
    savePetId(next.id)
    root.dataset.pet = next.id
    if (next.size) {
      root.style.setProperty('--pw-pet-w', `${next.size.w}px`)
      root.style.setProperty('--pw-pet-h', `${next.size.h}px`)
    } else {
      // 回落到 BASE_CSS 里的默认盒
      root.style.removeProperty('--pw-pet-w')
      root.style.removeProperty('--pw-pet-h')
    }
    // 文案跟着宠物走：基准（鲸鱼口吻）叠加这只宠物的覆盖，再重算一遍 a11y 标签
    strings = getStrings(locale, next.text?.[locale])
    pet.innerHTML = next.html
    pet.setAttribute('aria-label', strings.aria.petName(petDisplayName(next)))
    petStyle.textContent = next.css
  }
  applyPet(activePet.id)

  // ===== 大小 =====
  const SCALE_KEY = 'pet-whale:scale'
  /** 四档，对应 i18n 的 sizeNames */
  const SCALE_CHOICES = [0.8, 1, 1.3, 1.6] as const
  const loadScale = (): number => {
    try {
      const raw = Number(localStorage.getItem(SCALE_KEY))
      // 只认预设档，别人往存储里塞个 40 会把屏幕占满
      if (SCALE_CHOICES.includes(raw as (typeof SCALE_CHOICES)[number])) return raw
    } catch {
      // 忽略存储异常
    }
    return 1
  }
  let scale = loadScale()
  const applyScale = (next: number) => {
    scale = next
    root.style.setProperty('--pw-scale', String(next))
    try {
      localStorage.setItem(SCALE_KEY, String(next))
    } catch {
      // 忽略存储异常
    }
    // 变大之后原来的位置可能已经顶出屏幕，重新钳一次
    place()
    savePos()
  }
  const scaleName = () => strings.panel.sizeNames[SCALE_CHOICES.indexOf(scale as (typeof SCALE_CHOICES)[number])]

  // ===== 位置（localStorage 记忆 + 视口钳制） =====
  /** 一倍大小时的占位，实际尺寸要乘当前缩放 */
  const BASE_W = 137
  const BASE_H = 101
  const PET_W = () => BASE_W * scale
  const PET_H = () => BASE_H * scale
  const petSize = () => ({ w: PET_W(), h: PET_H() })
  const clampPos = (x: number, y: number) => {
    const maxX = Math.max(0, window.innerWidth - PET_W())
    const maxY = Math.max(0, window.innerHeight - PET_H())
    return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) }
  }
  const loadPos = () => {
    try {
      const raw = localStorage.getItem(POS_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as { x: number; y: number }
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return clampPos(parsed.x, parsed.y)
      }
    } catch {
      // 解析失败回默认
    }
    return clampPos(window.innerWidth - PET_W() - 16, window.innerHeight - PET_H() - 96)
  }
  const place = () => {
    const { x, y } = clampPos(parseFloat(root.style.left) || 0, parseFloat(root.style.top) || 0)
    root.style.left = `${x}px`
    root.style.top = `${y}px`
    return { x, y }
  }
  const pos = loadPos()
  root.style.left = `${pos.x}px`
  root.style.top = `${pos.y}px`
  document.body.appendChild(root)
  // 初始皮肤（默认陶土；用户换过后从 localStorage 恢复）
  applyPalette(root, paletteOf(loadPaletteId()))
  root.style.setProperty('--pw-scale', String(scale))

  // ===== 主题联动：跟随 DSH 亮/暗主题 =====
  const readTheme = (): 'light' | 'dark' => {
    const scheme = document.documentElement.style.colorScheme
    if (scheme === 'dark' || scheme === 'light') return scheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  const applyTheme = () => {
    root.dataset.theme = readTheme()
  }
  const themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
  applyTheme()

  const savePos = () => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(place()))
    } catch {
      // 忽略存储失败
    }
  }
  const onResize = () => {
    cancelAvoid()
    swimmer.stop()
    place()
    if (mini !== null) {
      const p = miniClamp(parseFloat(mini.style.right) || 0, parseFloat(mini.style.bottom) || 0)
      mini.style.right = `${p.right}px`
      mini.style.bottom = `${p.bottom}px`
    }
    if (ticker.classList.contains('show')) positionTicker()
    if (visualState === 'idle') swimmer.scheduleNext()
  }

  // ===== 台词 =====
  let dialogTimer: number | undefined
  const showDialog = (text: string) => {
    // 隐藏时不说话，避免“看不见的鲸鱼还在自言自语”
    if (disposed || root.classList.contains('hidden')) return
    dialog.textContent = text
    dialog.classList.add('show')
    cancelLater(dialogTimer)
    dialogTimer = later(() => dialog.classList.remove('show'), DIALOG_MS)
  }

  // ===== 音效 =====
  const sounds = new WhaleSounds()
  sounds.installGestureUnlock()
  let lastAutoSound = 0
  const autoSound = (state: WhaleState) => {
    // 隐藏时静音；页面不可见时也静音
    if (root.classList.contains('hidden') || document.hidden) return
    const now = performance.now()
    if (now - lastAutoSound < SOUND_GAP_MS) return
    lastAutoSound = now
    if (state === 'think') sounds.play('bubble')
    else if (state === 'working') sounds.play('work')
    else if (state === 'celebrate') sounds.play('celebrate')
    else if (state === 'error') sounds.play('error')
  }

  // ===== 状态应用 =====
  let visualState: WhaleState = 'idle'
  // 假装工作模式：开启后无论真实状态如何，都表演 working（敲代码）
  let pretendOn = false
  try {
    pretendOn = localStorage.getItem(PRETEND_KEY) === '1'
  } catch {
    // 忽略存储失败
  }
  // 思考链滚动条：默认开启，可右键关闭
  let tickerOn = true
  try {
    tickerOn = localStorage.getItem(THINK_TICKER_KEY) !== '0'
  } catch {
    // 忽略存储失败
  }
  // 最近一次错误文本：error 状态下点击鲸鱼可复制
  let lastErrorText = ''

  // ===== 泡泡 =====
  const popBubble = () => {
    const bubbles = pet.querySelectorAll<HTMLElement>('.bubble')
    if (bubbles.length === 0) return
    const b = bubbles[Math.floor(Math.random() * bubbles.length)]
    b.classList.remove('show')
    void b.offsetWidth
    b.classList.add('show')
    expireClass(b, 'show', 950)
  }

  // ===== 游泳系统 =====
  const swimmer = new WhaleSwimmer({
    root,
    pet,
    clampPos,
    savePos,
    popBubble,
    showDialog,
    getStrings: () => strings,
    petSize,
    isBusy: () =>
      root.classList.contains(HIDDEN_CLASS) ||
      dragStart !== null ||
      pet.classList.contains('petting') ||
      pet.classList.contains('belly-up') ||
      document.hidden ||
      menu.classList.contains('open') ||
      sleeping ||
      // 待机微游动的补间还没走完，此时启动游泳会两套动画抢同一个 left
      Date.now() < microSwimUntil ||
      visualState !== 'idle',
  })

  // ===== 陪伴统计存储 =====
  const STATS_KEY = 'pet-whale:stats'
  interface CompanionStats {
    completedRounds: number
    errorCount: number
    interactionCount: number
    firstDate: string
    /** 上次达到的关系档，只用来判断"这次是不是刚升上去" */
    bondTier: number
  }
  const loadStats = (): CompanionStats => {
    try {
      const raw = localStorage.getItem(STATS_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as Partial<CompanionStats>
        return {
          completedRounds: typeof parsed.completedRounds === 'number' ? parsed.completedRounds : 0,
          errorCount: typeof parsed.errorCount === 'number' ? parsed.errorCount : 0,
          interactionCount: typeof parsed.interactionCount === 'number' ? parsed.interactionCount : 0,
          firstDate: typeof parsed.firstDate === 'string' ? parsed.firstDate : new Date().toISOString().slice(0, 10),
          bondTier: typeof parsed.bondTier === 'number' ? parsed.bondTier : 0,
        }
      }
    } catch {
      // 忽略存储异常
    }
    const init: CompanionStats = {
      completedRounds: 0,
      errorCount: 0,
      interactionCount: 0,
      firstDate: new Date().toISOString().slice(0, 10),
      bondTier: 0,
    }
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(init))
    } catch {
      // 忽略存储异常
    }
    return init
  }
  const saveStats = (s: CompanionStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s))
    } catch {
      // 忽略存储异常
    }
  }
  const recordCelebrate = () => {
    const s = loadStats()
    s.completedRounds++
    saveStats(s)
    checkBondUp()
  }
  const recordError = () => {
    const s = loadStats()
    s.errorCount++
    saveStats(s)
  }
  const recordInteraction = () => {
    const s = loadStats()
    s.interactionCount++
    saveStats(s)
    checkBondUp()
  }
  const calcDays = (s: CompanionStats): number => {
    try {
      const start = new Date(s.firstDate).getTime()
      const now = Date.now()
      if (Number.isNaN(start)) return 1
      return Math.max(1, Math.floor((now - start) / 86400000) + 1)
    } catch {
      return 1
    }
  }

  const bondScore = (s: CompanionStats): number =>
    s.interactionCount + s.completedRounds * 2 + calcDays(s) * 4
  const bondTierOf = (score: number): number => {
    let tier = 0
    for (let i = 0; i < BOND_THRESHOLDS.length; i++) if (score >= BOND_THRESHOLDS[i]) tier = i
    return tier
  }
  /** 距下一档的百分比；已经满档返回 -1 */
  const bondProgress = (score: number, tier: number): number => {
    if (tier >= BOND_THRESHOLDS.length - 1) return -1
    const from = BOND_THRESHOLDS[tier]
    const to = BOND_THRESHOLDS[tier + 1]
    return Math.max(0, Math.min(99, Math.round(((score - from) / (to - from)) * 100)))
  }
  const currentTier = (): number => bondTierOf(bondScore(loadStats()))
  /**
   * 升档播报。写回存储放在弹话之前——弹话没弹出来也不该让同一档反复恭喜。
   * 分数只增不减，所以这里不必处理回落。
   */
  const checkBondUp = () => {
    const st = loadStats()
    const tier = bondTierOf(bondScore(st))
    if (tier <= st.bondTier) return
    st.bondTier = tier
    saveStats(st)
    later(() => showDialog(strings.bond.levelUp[tier]), 1500)
  }

  let stateInitialized = false
  const setState = (next: WhaleState, changed: boolean) => {
    const effective: WhaleState = pretendOn ? 'working' : next
    // 真开始干活了就别端着脾气，闹脾气只在闲着的时候成立
    if (effective !== 'idle' && sulking) clearSulk()
    if (effective !== 'idle') wake()
    for (const s of STATES) pet.classList.toggle(s, s === effective)
    if (effective === 'error' && visualState !== 'error') {
      endPat()
      clearReaction()
    }
    visualState = effective
    syncMiniState(effective)
    if (changed || !stateInitialized) {
      swimmer.onStateChange(effective)
      if (effective === 'idle') scheduleIdleMicro()
      else {
        clearIdleMicro()
        clearMicroAction() // 离场时把还没演完的原地动作收掉（首尾都是中性姿态，硬切看不出）
      }
      stateInitialized = true
    }
    if (changed) {
      showDialog(pick(strings.status[effective]))
      autoSound(effective)
      if (effective === 'celebrate') {
        recordCelebrate()
        notifyDone()
        const curX = parseFloat(root.style.left) || 0
        const curY = parseFloat(root.style.top) || 0
        swimmer.spawnConfetti(curX + PET_W() / 2, curY + PET_H() * 0.35, 24)
      } else if (effective === 'error') {
        recordError()
      }
    }
  }

  // 同一动作重触发只能由最新 timer 收尾；互斥动作不能叠加眼睛和 transform。
  const reactionClasses = ['squish', 'rolling', 'dizzy', 'joy', 'annoyed', 'shaken', 'belly-up', 'welcome']
  const classTimers = new Map<string, number>()
  const expireClass = (el: Element, name: string, ms: number) => {
    const key = el === pet ? name : `${name}:${Array.from(pet.querySelectorAll('.bubble')).indexOf(el)}`
    cancelLater(classTimers.get(key))
    classTimers.set(key, later(() => { classTimers.delete(key); el.classList.remove(name) }, ms))
  }
  const clearReaction = () => {
    for (const name of reactionClasses) {
      cancelLater(classTimers.get(name))
      classTimers.delete(name)
      pet.classList.remove(name)
    }
  }
  // ===== 戳戳 / 翻滚 / 开心 / 戳晕 / 欢迎 =====
  const triggerSquish = () => {
    markActive()
    recordInteraction()
    popBubble()
    sounds.play('bubble')
    clearReaction()
    pet.classList.remove('squish', 'dizzy', 'joy')
    void pet.offsetWidth
    pet.classList.add('squish')
    expireClass(pet, 'squish', 450)
    showDialog(pick(strings.bond.poke[currentTier()]))
  }
  const triggerRoll = () => {
    markActive()
    recordInteraction()
    sounds.play('trick')
    showDialog(strings.feedback.roll)
    clearReaction()
    pet.classList.remove('rolling', 'dizzy', 'joy')
    void pet.offsetWidth
    pet.classList.add('rolling', 'spouting')
    const curX = parseFloat(root.style.left) || 0
    const curY = parseFloat(root.style.top) || 0
    swimmer.spawnSplash(curX + PET_W() / 2, curY + PET_H() * 0.64, 6)
    swimmer.spawnWaterRipple(curX + PET_W() / 2, curY + PET_H() * 0.64, false)
    popBubble()
    later(() => popBubble(), 200)
    expireClass(pet, 'rolling', 1100)
    expireClass(pet, 'spouting', 1100)
  }
  const triggerJoy = () => {
    if (root.classList.contains(HIDDEN_CLASS)) return
    markActive()
    recordInteraction()
    clearReaction()
    pet.classList.remove('joy', 'squish', 'dizzy')
    void pet.offsetWidth
    pet.classList.add('joy')
    sounds.play('celebrate')
    showDialog(pick(strings.feedback.joy))
    popBubble()
    expireClass(pet, 'joy', 1100)
  }
  const triggerDizzy = () => {
    markActive()
    recordInteraction()
    clearReaction()
    pet.classList.remove('dizzy', 'squish', 'joy')
    void pet.offsetWidth
    pet.classList.add('dizzy')
    sounds.play('bubble')
    showDialog(pick(strings.feedback.pokeDizzy))
    expireClass(pet, 'dizzy', 900)
  }
  // ===== 连戳升级 =====
  // 戳一下就随机演一个，戳二十下还是同样的随机分布——那是控件，不是活物。
  // 连戳计数会在停手后自己衰减，所以"惹毛它"和"哄好它"都由手速决定。
  const POKE_ANNOYED_AT = 3
  const POKE_SULK_AT = 6
  /** 停手这么久，连戳计数清零 */
  const POKE_DECAY_MS = 2600
  /** 闹脾气持续时长，期间再戳只会更闹 */
  const SULK_MS = 4200
  let pokeStreak = 0
  let pokeDecayTimer = 0
  let sulking = false
  let sulkTimer = 0

  const clearSulk = () => {
    if (sulkTimer !== 0) {
      cancelLater(sulkTimer)
      sulkTimer = 0
    }
    sulking = false
    pet.classList.remove('sulking')
  }
  const bumpPokeStreak = () => {
    pokeStreak += 1
    if (pokeDecayTimer !== 0) cancelLater(pokeDecayTimer)
    pokeDecayTimer = later(() => {
      pokeDecayTimer = 0
      pokeStreak = 0
    }, POKE_DECAY_MS)
  }
  const triggerAnnoyed = () => {
    markActive()
    recordInteraction()
    clearReaction()
    pet.classList.remove('annoyed', 'squish', 'dizzy', 'joy')
    void pet.offsetWidth
    pet.classList.add('annoyed')
    sounds.play('bubble')
    showDialog(pick(strings.feedback.pokeAnnoyed))
    expireClass(pet, 'annoyed', 520)
  }
  const triggerSulk = () => {
    markActive()
    recordInteraction()
    clearSulk()
    sulking = true
    clearReaction()
    pet.classList.remove('annoyed', 'squish', 'dizzy', 'joy', 'rolling')
    void pet.offsetWidth
    pet.classList.add('sulking')
    sounds.play('bubble')
    showDialog(pick(strings.feedback.pokeSulk))
    sulkTimer = later(() => {
      sulkTimer = 0
      clearSulk()
      pokeStreak = 0
    }, SULK_MS)
  }
  /** 失落时被戳：当作安慰，提前结束自愈 */
  const triggerComfort = () => {
    markActive()
    recordInteraction()
    clearSulk()
    pokeStreak = 0
    clearReaction()
    pet.classList.remove('joy', 'squish', 'dizzy', 'annoyed')
    void pet.offsetWidth
    pet.classList.add('joy')
    sounds.play('celebrate')
    showDialog(pick(strings.feedback.comfort))
    popBubble()
    expireClass(pet, 'joy', 1100)
  }

  // ===== 完成提醒：你不看着的时候，让标签页替它喊你 =====
  // 鲸鱼演得再好，你切走了就等于没演。
  let notifyOn = true
  let sysNotifyOn = false
  try {
    notifyOn = localStorage.getItem(NOTIFY_KEY) !== '0'
    sysNotifyOn = localStorage.getItem(SYS_NOTIFY_KEY) === '1'
  } catch {
    // 忽略存储失败
  }
  const hasNotificationApi = typeof window !== 'undefined' && 'Notification' in window
  let permissionRequest = 0
  const notifications = new Set<Notification>()
  /** 我们改写标题前的原值；null 表示当前没在闪 */
  let titleBeforeFlash: string | null = null
  let flashedTitle = ''

  const restoreTitle = () => {
    if (titleBeforeFlash === null) return
    // 只有标题仍是我们写的那串才还原——期间 DSH 自己改过标题的话，别覆盖人家的新值
    if (document.title === flashedTitle) document.title = titleBeforeFlash
    titleBeforeFlash = null
    flashedTitle = ''
  }
  const flashTitle = () => {
    if (titleBeforeFlash !== null) return
    titleBeforeFlash = document.title
    flashedTitle = `✅ ${strings.notify.titleDone} · ${titleBeforeFlash}`
    document.title = flashedTitle
  }
  const sendSystemNotification = () => {
    if (!sysNotifyOn || !hasNotificationApi) return
    if (Notification.permission !== 'granted') return
    try {
      const n = new Notification(`${activePet.icon} ${strings.notify.titleDone}`, { body: strings.notify.bodyDone })
      notifications.add(n)
      later(() => { notifications.delete(n); n.close() }, 6000)
    } catch {
      // 通知构造失败（部分环境要求 ServiceWorker）时静默降级到标题闪烁
    }
  }
  /** 回合完成时调用：只在页面不可见时才提醒 */
  const notifyDone = () => {
    if (!document.hidden) return
    if (notifyOn) flashTitle()
    sendSystemNotification()
  }

  // ===== 久坐提醒 =====
  let sedentaryMin = 0
  try {
    const raw = Number(localStorage.getItem(SEDENTARY_KEY))
    if ((SEDENTARY_CHOICES as readonly number[]).includes(raw)) sedentaryMin = raw
  } catch {
    // 忽略存储失败
  }
  let sittingMs = 0
  let hiddenSince = 0
  let sedentaryTimer = 0

  const nudgeRest = () => {
    if (root.classList.contains(HIDDEN_CLASS)) return
    pet.classList.remove('welcome')
    void pet.offsetWidth
    pet.classList.add('welcome', 'spouting')
    showDialog(pick(strings.feedback.restNudge))
    sounds.play('bubble')
    expireClass(pet, 'welcome', 1400)
    expireClass(pet, 'spouting', 1400)
  }
  const sedentaryTick = () => {
    if (sedentaryMin === 0) return
    if (document.hidden) return
    sittingMs += SEDENTARY_TICK_MS
    if (sittingMs >= sedentaryMin * 60000) {
      sittingMs = 0
      nudgeRest()
    }
  }
  const startSedentary = () => {
    if (sedentaryTimer !== 0) window.clearInterval(sedentaryTimer)
    sedentaryTimer = 0
    sittingMs = 0
    if (sedentaryMin === 0) return
    sedentaryTimer = window.setInterval(sedentaryTick, SEDENTARY_TICK_MS)
  }
  startSedentary()

  const triggerWelcome = () => {
    if (root.classList.contains(HIDDEN_CLASS) || visualState !== 'idle') return
    clearReaction()
    pet.classList.remove('welcome')
    void pet.offsetWidth
    pet.classList.add('welcome')
    showDialog(strings.bond.welcome[currentTier()])
    sounds.play('bubble')
    expireClass(pet, 'welcome', 1200)
  }

  // ===== 隐藏 / 小按钮 / 状态指示 / 拖拽 / 定时 / 关闭 =====
  const HIDDEN_CLASS = 'hidden'
  const MINI_SIZE = 46
  let mini: HTMLButtonElement | null = null
  let quitWhale: () => void = () => {}

  const syncMiniState = (state: WhaleState) => {
    if (mini === null) return
    mini.dataset.state = state
    mini.title = `${strings.aria.miniTitle(state)}`
    // 图标与 a11y 文案跟随当前宠物（隐藏状态下切宠物也立刻对）
    mini.textContent = activePet.icon
    mini.setAttribute('aria-label', strings.aria.mini)
  }

  // ===== 小按钮位置（右下角偏移，localStorage 记忆） =====
  const miniClamp = (right: number, bottom: number) => {
    const maxRight = Math.max(0, window.innerWidth - MINI_SIZE)
    const maxBottom = Math.max(0, window.innerHeight - MINI_SIZE)
    return {
      right: Math.min(Math.max(0, right), maxRight),
      bottom: Math.min(Math.max(0, bottom), maxBottom),
    }
  }
  const loadMiniPos = () => {
    try {
      const raw = localStorage.getItem(MINI_POS_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as { right: number; bottom: number }
        if (typeof parsed.right === 'number' && typeof parsed.bottom === 'number') return miniClamp(parsed.right, parsed.bottom)
      }
    } catch {
      // 解析失败回默认
    }
    return { right: 14, bottom: 14 }
  }
  const saveMiniPos = () => {
    if (mini === null) return
    try {
      localStorage.setItem(MINI_POS_KEY, JSON.stringify({
        right: parseFloat(mini.style.right) || 0,
        bottom: parseFloat(mini.style.bottom) || 0,
      }))
    } catch {
      // 忽略存储失败
    }
  }

  // ===== 小按钮拖拽 =====
  let miniDrag: { pointerId: number; x: number; y: number; right: number; bottom: number } | null = null
  let miniDragging = false
  let miniSuppressClick = false
  const onMiniPointerDown = (e: PointerEvent) => {
    if (disposed || e.button !== 0 || e.isPrimary === false || mini === null || miniDrag !== null) return
    miniSuppressClick = false
    miniDrag = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      right: parseFloat(mini.style.right) || 0,
      bottom: parseFloat(mini.style.bottom) || 0,
    }
    try { mini.setPointerCapture(e.pointerId) } catch { /* window 事件兜底 */ }
  }
  const onMiniPointerMove = (e: PointerEvent) => {
    if (miniDrag === null || mini === null || e.pointerId !== miniDrag.pointerId) return
    const dx = e.clientX - miniDrag.x
    const dy = e.clientY - miniDrag.y
    if (!miniDragging && Math.abs(dx) + Math.abs(dy) > 4) {
      miniDragging = true
      miniSuppressClick = true
      mini.classList.add('dragging')
    }
    if (miniDragging) {
      const p = miniClamp(miniDrag.right - dx, miniDrag.bottom - dy)
      mini.style.right = `${p.right}px`
      mini.style.bottom = `${p.bottom}px`
    }
  }
  const onMiniDragEnd = (e?: PointerEvent) => {
    if (miniDrag === null || (e && e.pointerId !== miniDrag.pointerId)) return
    const id = miniDrag.pointerId
    miniDrag = null
    try { mini?.releasePointerCapture(id) } catch { /* 指针已被浏览器释放 */ }
    if (miniDragging) {
      miniDragging = false
      // mini 可能已被 removeMini 清掉（桌宠被召回），但 miniDragging 仍必须复位
      mini?.classList.remove('dragging')
      saveMiniPos()
    }
    // 下一次 pointerdown 再重置，避免移动端延迟 click 误召回。
  }

  const removeMini = () => {
    onMiniDragEnd()
    mini?.remove()
    mini = null
  }
  const createMini = () => {
    if (mini !== null) return
    mini = document.createElement('button')
    mini.type = 'button'
    mini.setAttribute('data-dsh-whale-mini', '')
    mini.setAttribute('aria-label', strings.aria.mini)
    // 小按钮图标跟随当前宠物
    mini.textContent = activePet.icon
    const pos = loadMiniPos()
    mini.style.right = `${pos.right}px`
    mini.style.bottom = `${pos.bottom}px`
    syncMiniState(visualState)
    mini.addEventListener('click', () => {
      if (miniSuppressClick) return
      showWhale()
    })
    mini.addEventListener('pointerdown', onMiniPointerDown)
    mini.addEventListener('lostpointercapture', onMiniDragEnd)
    document.body.appendChild(mini)
  }

  const showWhale = () => {
    removeMini()
    root.classList.remove(HIDDEN_CLASS)
    try {
      localStorage.removeItem(HIDDEN_KEY)
    } catch {
      // 忽略存储失败
    }
    place()
    triggerSquish()
    showDialog(strings.feedback.shown)
    swimmer.scheduleNext(1500)
    onSnapshot()
    if (!badge.hidden) startFollow()
  }
  const hideWhale = () => {
    endDrag()
    endPat()
    hideTicker()
    clearIdleMicro()
    cancelAvoid()
    swimmer.stop()
    root.classList.add(HIDDEN_CLASS)
    if (followRaf !== 0) window.cancelAnimationFrame(followRaf)
    followRaf = 0
    try {
      localStorage.setItem(HIDDEN_KEY, '1')
    } catch {
      // 忽略存储失败
    }
    createMini()
  }

  // ===== 定时隐藏 =====
  type AutoHidePlan = { at: number; daily: boolean; hh: number; mm: number }
  const readAutoHide = (): AutoHidePlan | null => {
    try {
      const raw = localStorage.getItem(AUTO_HIDE_KEY)
      if (raw === null) return null
      const parsed = JSON.parse(raw) as Partial<AutoHidePlan>
      if (typeof parsed.at === 'number' && typeof parsed.daily === 'boolean') return parsed as AutoHidePlan
    } catch {
      // 解析失败视为无计划
    }
    return null
  }
  const saveAutoHide = (plan: AutoHidePlan) => {
    try {
      localStorage.setItem(AUTO_HIDE_KEY, JSON.stringify(plan))
    } catch {
      // 忽略存储失败
    }
  }
  const clearAutoHide = () => {
    try {
      localStorage.removeItem(AUTO_HIDE_KEY)
    } catch {
      // 忽略存储失败
    }
  }
  const nextDailyAt = (hh: number, mm: number) => {
    const d = new Date()
    d.setHours(hh, mm, 0, 0)
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
    return d.getTime()
  }
  const scheduleOnce = (ms: number) => {
    saveAutoHide({ at: Date.now() + ms, daily: false, hh: 0, mm: 0 })
  }
  const scheduleDaily = (hh: number, mm: number) => {
    saveAutoHide({ at: nextDailyAt(hh, mm), daily: true, hh, mm })
  }
  const checkAutoHide = () => {
    const plan = readAutoHide()
    if (plan === null) return
    if (Date.now() < plan.at) return
    if (plan.daily) scheduleDaily(plan.hh, plan.mm)
    else clearAutoHide()
    if (!root.classList.contains(HIDDEN_CLASS)) hideWhale()
  }
  let autoHideTimer: number | undefined
  const startAutoHide = () => {
    checkAutoHide()
    autoHideTimer = window.setInterval(checkAutoHide, AUTO_HIDE_CHECK_MS)
  }

  // ===== 思考内容滚动条 =====
  // 真实状态为 think 时，把模型最近生成的文字截取一段放在桌宠正上方缓慢滚动；
  // 内容只保留最近 200 字（可读、不冗长），鲸鱼同时保持深潜思考动画。
  const THINK_TICKER_MAX = 200
  const THINK_TICKER_WIDTH = 360
  const ticker = document.createElement('div')
  ticker.setAttribute('data-dsh-whale-think', '')
  ticker.innerHTML = '<span class="dsh-whale-think-label">🧠</span><div class="dsh-whale-think-scroll"><span class="dsh-whale-think-text"></span></div>'
  root.appendChild(ticker)
  const tickerText = ticker.querySelector<HTMLElement>('.dsh-whale-think-text')!
  let tickerOffset = 0
  let tickerRaf = 0
  const hideTicker = () => {
    ticker.classList.remove('show')
    if (tickerRaf !== 0) {
      window.cancelAnimationFrame(tickerRaf)
      tickerRaf = 0
    }
  }
  const tickerTick = () => {
    if (document.hidden || root.classList.contains('hidden')) { hideTicker(); return }
    positionTicker()
    const max = Math.max(0, tickerText.scrollWidth - ticker.querySelector('.dsh-whale-think-scroll')!.clientWidth)
    tickerOffset += 0.5
    if (tickerOffset > max + 40) tickerOffset = 0
    tickerText.style.transform = `translateX(-${tickerOffset}px)`
    if (ticker.classList.contains('show')) tickerRaf = window.requestAnimationFrame(tickerTick)
    else tickerRaf = 0
  }
  const positionTicker = () => {
    // 水平对齐鲸鱼中心，并夹在视口内；垂直方向悬在鲸鱼头顶上方
    const rect = root.getBoundingClientRect()
    const width = Math.min(THINK_TICKER_WIDTH, window.innerWidth - 24)
    const centerX = rect.left + rect.width / 2
    const left = Math.min(Math.max(centerX, width / 2 + 12), window.innerWidth - width / 2 - 12)
    ticker.style.width = `${width}px`
    ticker.style.left = `${left}px`
    ticker.style.top = `${rect.top - 40}px`
  }
  const updateTicker = (text: string) => {
    if (text.trim() === '' || pretendOn || document.hidden || root.classList.contains('hidden')) {
      hideTicker()
      return
    }
    const nextText = text.slice(-THINK_TICKER_MAX)
    if (tickerText.textContent !== nextText) tickerOffset = 0
    tickerText.textContent = nextText
    positionTicker()
    ticker.classList.add('show')
    if (!reduceMotion && tickerRaf === 0) tickerRaf = window.requestAnimationFrame(tickerTick)
  }
  // ===== 后台省电：页面不可见时暂停动画/音效/思考流 =====
  let pageVisible = true
  const onVisibility = () => {
    pageVisible = !document.hidden
    root.classList.toggle('paused', document.hidden)
    mini?.classList.toggle('paused', document.hidden)
    if (document.hidden) {
      hiddenSince = Date.now()
      endDrag()
      onMiniDragEnd()
      endPat()
      hideTicker()
      swimmer.stop()
    } else {
      // 回来了就收掉标题上的提醒；离开够久则视为休息过，久坐重新计时
      restoreTitle()
      if (hiddenSince !== 0 && Date.now() - hiddenSince >= SEDENTARY_AWAY_RESET_MS) sittingMs = 0
      hiddenSince = 0
      onSnapshot()
      if (visualState === 'idle') swimmer.scheduleNext(2000)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  // ===== 角标跟着鲸鱼身体起伏 =====
  // 各状态的浮动动画不一样（idle 3.2s、睡觉 4s、游泳 0.85s、干活整只在晃），CSS 同步不了，
  // 只能每帧读身体的实际位置。只取"起伏"：用慢速均值当基线，角标位移 = 当前位置 - 基线，
  // 这样角标还钉在头前方，只跟着上下左右晃。只在角标显示、页面可见时跑。
  const petBody = pet.querySelector<SVGGElement>('.body')
  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let followRaf = 0
  let baseX = Number.NaN
  let baseY = Number.NaN
  const FOLLOW_MAX = 18
  const clampFollow = (v: number) => Math.max(-FOLLOW_MAX, Math.min(FOLLOW_MAX, v))
  const followBody = () => {
    followRaf = 0
    if (badge.hidden || document.hidden || root.classList.contains('hidden') || petBody === null) return
    const b = petBody.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    const x = b.left + b.width / 2 - r.left
    const y = b.top + b.height / 2 - r.top
    if (Number.isNaN(baseX)) {
      baseX = x
      baseY = y
    }
    // 约 2 秒的时间常数：比任何一种浮动周期都慢，基线不会被起伏本身带跑
    baseX += (x - baseX) * 0.008
    baseY += (y - baseY) * 0.008
    badge.style.translate = `${clampFollow(x - baseX).toFixed(1)}px ${clampFollow(y - baseY).toFixed(1)}px`
    followRaf = window.requestAnimationFrame(followBody)
  }
  const startFollow = () => {
    if (reduceMotion || followRaf !== 0) return
    followRaf = window.requestAnimationFrame(followBody)
  }
  const onFollowVisibility = () => {
    if (!document.hidden && !badge.hidden) startFollow()
  }
  document.addEventListener('visibilitychange', onFollowVisibility)

          // ===== 右键菜单 =====
    let menuMode: 'main' | 'more' | 'appearance' | 'behavior' | 'stats' | 'rest' = 'main'
    const appendMenuBtn = (label: string, onClick: () => void, cls = '') => {
      const btn = document.createElement('button')
      btn.type = 'button'
      if (cls) btn.className = cls
      btn.textContent = label
      btn.addEventListener('click', onClick)
      menu.appendChild(btn)
      return btn
    }
    /** 切换开关后原地重画菜单：菜单不关、位置不动 */
    const reopenMenu = (mode: 'main' | 'more' | 'appearance' | 'behavior' | 'stats' | 'rest') => {
      buildMenu(mode)
      menu.classList.add('open')
      positionMenu(lastMenuPos.x, lastMenuPos.y)
    }

    const buildMenu = (mode: 'main' | 'more' | 'appearance' | 'behavior' | 'stats' | 'rest' = 'main') => {
      menuMode = mode
      menu.textContent = ''
      const openMore = () => {
        buildMenu('more')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const openAppearance = () => {
        buildMenu('appearance')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const openBehavior = () => {
        buildMenu('behavior')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const openStats = () => {
        buildMenu('stats')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const openRest = () => {
        buildMenu('rest')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const backMain = () => {
        buildMenu('main')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
      const backMore = () => {
        buildMenu('more')
        menu.classList.add('open')
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }

      if (mode === 'main') {
        const items: [string, () => void][] = [
          [
            strings.menu.feed,
            () => {
              snack.classList.remove('drop')
              void snack.offsetWidth
              snack.classList.add('drop')
              sounds.play('snack')
              showDialog(strings.feedback.feed)
              later(() => {
                triggerJoy()
              }, 600)
            },
          ],
          [
            strings.menu.headpat,
            () => {
              triggerPat()
            },
          ],
          [
            `${strings.panel.pretend}${pretendOn ? ' ✓' : ''}`,
            () => {
              pretendOn = !pretendOn
              try {
                localStorage.setItem(PRETEND_KEY, pretendOn ? '1' : '0')
              } catch {
                // 忽略存储失败
              }
              updateTicker('')
              stateInitialized = false
              onSnapshot()
              showDialog(pretendOn ? strings.feedback.pretendOn : strings.feedback.pretendOff)
            },
          ],
          [
            sounds.isMuted ? strings.menu.soundOff : strings.menu.soundOn,
            () => {
              const next = !sounds.isMuted
              sounds.setMuted(next)
              buildMenu('main')
              menu.classList.add('open')
              positionMenu(lastMenuPos.x, lastMenuPos.y)
              if (next) sounds.play('bubble')
            },
          ],
          [
            strings.menu.hide,
            () => {
              hideWhale()
            },
          ],
          ...(lastErrorText !== ''
            ? [[strings.menu.copyError, () => { void copyError() }] as [string, () => void]]
            : []),
          [
            strings.menu.more,
            openMore,
          ],
        ]
        for (const [label, action] of items) {
          appendMenuBtn(label, () => {
            closeMenu()
            action()
          })
        }
        return
      }

      if (mode === 'more') {
        appendMenuBtn(`🎨 ${strings.panel.appearance} ▸`, openAppearance)
        appendMenuBtn(`🧠 ${strings.panel.behavior} ▸`, openBehavior)
        appendMenuBtn(`📊 ${strings.panel.stats} ▸`, openStats)
        appendMenuBtn(`🕐 ${strings.panel.rest} ▸`, openRest)
        appendMenuBtn(strings.panel.back, backMain, 'pw-back')
        return
      }

      if (mode === 'stats') {
        const stats = loadStats()
        const days = calcDays(stats)
        const items = [
          strings.panel.statsCompleted(stats.completedRounds),
          strings.panel.statsInteractions(stats.interactionCount),
          strings.panel.statsErrors(stats.errorCount),
          strings.panel.statsDays(days),
          strings.panel.statsBond(
            strings.bond.tierName[bondTierOf(bondScore(stats))],
            bondProgress(bondScore(stats), bondTierOf(bondScore(stats))),
          ),
        ]
        for (const it of items) {
          const itEl = document.createElement('div')
          itEl.className = 'pw-stats-item'
          itEl.textContent = it
          menu.appendChild(itEl)
        }
        appendMenuBtn(strings.panel.back, backMore, 'pw-back')
        return
      }

      if (mode === 'appearance') {
        // 宠物选择：色板对所有宠物通用，所以先选宠物、再挑配色
        const petTitle = document.createElement('div')
        petTitle.className = 'pw-panel-section-title'
        petTitle.textContent = strings.panel.pet
        menu.appendChild(petTitle)
        for (const p of PETS) {
          const name = petDisplayName(p)
          const petBtn = document.createElement('button')
          petBtn.type = 'button'
          petBtn.className = 'pw-palette-btn'
          // 当前项打勾，跟插件里其它开关的写法保持一致
          petBtn.appendChild(document.createTextNode(`${p.icon} ${name}${p.id === activePet.id ? ' ✅' : ''}`))
          petBtn.addEventListener('click', () => {
            closeMenu()
            if (p.id === activePet.id) return
            applyPet(p.id)
            // 隐藏状态下切宠物：小按钮的图标/文案也要跟着换
            syncMiniState(visualState)
            showDialog(strings.feedback.petApplied(name))
            sounds.play('bubble')
          })
          menu.appendChild(petBtn)
        }
        const colorTitle = document.createElement('div')
        colorTitle.className = 'pw-panel-section-title'
        colorTitle.textContent = strings.panel.colors
        menu.appendChild(colorTitle)
        for (const p of PALETTES) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'pw-palette-btn'
          const dot = document.createElement('span')
          dot.className = 'pw-swatch'
          dot.style.background = `linear-gradient(135deg, ${p.light}, ${p.main}, ${p.dark})`
          btn.appendChild(dot)
          btn.appendChild(document.createTextNode(paletteName(locale, p.id, p.name)))
          btn.addEventListener('click', () => {
            closeMenu()
            applyPalette(root, p)
            savePaletteId(p.id)
            showDialog(strings.feedback.paletteApplied(paletteName(locale, p.id, p.name)))
            sounds.play('bubble')
          })
          menu.appendChild(btn)
        }
        appendMenuBtn(strings.panel.size(scaleName()), () => {
          const i = SCALE_CHOICES.indexOf(scale as (typeof SCALE_CHOICES)[number])
          applyScale(SCALE_CHOICES[(i + 1) % SCALE_CHOICES.length])
          reopenMenu('appearance')
          showDialog(strings.feedback.sizeSet(scaleName()))
          sounds.play('bubble')
        })
        appendMenuBtn(strings.panel.back, backMore, 'pw-back')
        return
      }

      if (mode === 'behavior') {
                appendMenuBtn(`${strings.panel.thinkTicker}${tickerOn ? ' ✓' : ''}`, () => {
          tickerOn = !tickerOn
          try {
            localStorage.setItem(THINK_TICKER_KEY, tickerOn ? '1' : '0')
          } catch {
            // 忽略存储失败
          }
          updateTicker('')
          showDialog(tickerOn ? strings.feedback.tickerOn : strings.feedback.tickerOff)
          buildMenu('behavior')
          menu.classList.add('open')
          positionMenu(lastMenuPos.x, lastMenuPos.y)
        })
        appendMenuBtn(`${strings.panel.swim}${swimmer.isEnabled ? ' ✓' : ''}`, () => {
          const next = swimmer.toggle()
          showDialog(next ? strings.feedback.swimOn : strings.feedback.swimOff)
          buildMenu('behavior')
          menu.classList.add('open')
          positionMenu(lastMenuPos.x, lastMenuPos.y)
        })
        // 音量：静音 → 小 → 中 → 大 → 静音；换完响一声让人听到新音量
        appendMenuBtn(strings.panel.volume(sounds.isMuted ? strings.panel.volumeOff : strings.panel.volumeNames[VOLUME_LEVELS.indexOf(sounds.volume)]), () => {
          if (sounds.isMuted) {
            sounds.setMuted(false)
            sounds.setVolume('low')
          } else if (sounds.volume === 'high') {
            sounds.setMuted(true)
          } else {
            sounds.setVolume(VOLUME_LEVELS[VOLUME_LEVELS.indexOf(sounds.volume) + 1])
          }
          reopenMenu('behavior')
          sounds.play('bubble')
        })
        if (statusSource !== undefined) {
          appendMenuBtn(`${strings.panel.followAll}${followAll ? ' ✓' : ' ✕'}`, () => {
            followAll = !followAll
            try {
              localStorage.setItem(FOLLOW_ALL_KEY, followAll ? '1' : '0')
            } catch {
              // 忽略存储失败
            }
            updateBadge()
            onSnapshot()
            showDialog(followAll ? strings.feedback.followAllOn : strings.feedback.followAllOff)
            reopenMenu('behavior')
          })
        }
        appendMenuBtn(`${strings.panel.notify}${notifyOn ? ' ✓' : ' ✕'}`, () => {
          notifyOn = !notifyOn
          try {
            localStorage.setItem(NOTIFY_KEY, notifyOn ? '1' : '0')
          } catch {
            // 忽略存储失败
          }
          if (!notifyOn) restoreTitle()
          showDialog(notifyOn ? strings.feedback.notifyOn : strings.feedback.notifyOff)
          reopenMenu('behavior')
        })
        if (hasNotificationApi) {
          appendMenuBtn(`${strings.panel.sysNotify}${sysNotifyOn ? ' ✓' : ' ✕'}`, () => {
            const turningOn = !sysNotifyOn
            const request = ++permissionRequest
            const commit = (granted: boolean) => {
              if (disposed || request !== permissionRequest) return
              sysNotifyOn = turningOn && granted
              try {
                localStorage.setItem(SYS_NOTIFY_KEY, sysNotifyOn ? '1' : '0')
              } catch {
                // 忽略存储失败
              }
              showDialog(
                !turningOn
                  ? strings.feedback.sysNotifyOff
                  : granted
                    ? strings.feedback.sysNotifyOn
                    : strings.feedback.sysNotifyDenied,
              )
              reopenMenu('behavior')
            }
            // 只在用户主动打开时才申请权限，不在挂载时骚扰
            if (turningOn && Notification.permission === 'default') {
              void Notification.requestPermission().then((p) => commit(p === 'granted'), () => commit(false))
              return
            }
            commit(Notification.permission === 'granted')
          })
        }
        appendMenuBtn(strings.panel.sedentary(sedentaryMin), () => {
          const i = SEDENTARY_CHOICES.indexOf(sedentaryMin as (typeof SEDENTARY_CHOICES)[number])
          sedentaryMin = SEDENTARY_CHOICES[(i + 1) % SEDENTARY_CHOICES.length]
          try {
            localStorage.setItem(SEDENTARY_KEY, String(sedentaryMin))
          } catch {
            // 忽略存储失败
          }
          startSedentary()
          showDialog(sedentaryMin === 0 ? strings.feedback.sedentaryOff : strings.feedback.sedentarySet(sedentaryMin))
          reopenMenu('behavior')
        })
        appendMenuBtn(strings.panel.back, backMore, 'pw-back')
        return
      }

      if (mode === 'rest') {
        appendMenuBtn(`🕐 ${strings.panel.in1h}`, () => {
          closeMenu()
          scheduleOnce(3600000)
          showDialog(strings.feedback.schedule1h)
        })
        appendMenuBtn(`🌙 ${strings.panel.daily}`, () => {
          closeMenu()
          scheduleDaily(22, 0)
          showDialog(strings.feedback.scheduleDaily)
        })
        appendMenuBtn(`🚫 ${strings.panel.cancelSchedule}`, () => {
          closeMenu()
          clearAutoHide()
          showDialog(strings.feedback.scheduleCancel)
        })
        appendMenuBtn(strings.panel.hide, () => {
          closeMenu()
          hideWhale()
        })
        appendMenuBtn(strings.panel.close, () => {
          closeMenu()
          quitWhale()
        })
        appendMenuBtn(strings.panel.back, backMore, 'pw-back')
      }
    }
    let lastMenuPos = { x: 0, y: 0 }
    const positionMenu = (clientX: number, clientY: number) => {
      const rect = root.getBoundingClientRect()
      const menuW = menu.offsetWidth || 140
      const menuH = menu.offsetHeight || 130
      const x = Math.min(Math.max(0, clientX - rect.left), Math.max(0, rect.width - menuW))
      // 下方空间不足时往上开，避免菜单项变多后超出视口底部
      const preferUp = clientY + menuH + 8 > window.innerHeight
      const y = preferUp ? clientY - rect.top - menuH - 10 : clientY - rect.top + 12
      const minY = -rect.top + 8
      const maxY = Math.max(minY, window.innerHeight - rect.top - menuH - 8)
      menu.style.left = `${x}px`
      menu.style.top = `${Math.min(Math.max(minY, y), maxY)}px`
    }
    const openMenu = (clientX: number, clientY: number) => {
      lastMenuPos = { x: clientX, y: clientY }
      buildMenu('main')
      menu.classList.add('open')
      positionMenu(clientX, clientY)
    }
    const closeMenu = () => menu.classList.remove('open')
    const onDocPointerDown = (e: PointerEvent) => {
      if (!menu.contains(e.target as Node)) closeMenu()
    }

// ===== 拖拽 =====
  let dragging = false
  let suppressClick = false

  // ===== 智能避让（不干扰抓取/拖拽/右键） =====
  // 只有 idle、光标在鲸鱼身外 48px 内停留 0.9s 才让开；
  // 光标进入身体、按下抓取或右键都会立即取消，并进入 8s 冷却。
  let avoidCooldownUntil = 0
  let avoidTimer: number | undefined
  const cancelAvoid = () => {
    cancelLater(avoidTimer)
    avoidTimer = undefined
    root.style.transition = ''
  }
  const maybeAvoid = (e: MouseEvent) => {
    if (root.classList.contains('hidden') || dragging || menu.classList.contains('open') || visualState !== 'idle') return
    if (performance.now() < avoidCooldownUntil) return
    const rect = pet.getBoundingClientRect()
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
    if (inside) {
      cancelAvoid()
      return
    }
    const near = e.clientX >= rect.left - AVOID_MARGIN && e.clientX <= rect.right + AVOID_MARGIN
      && e.clientY >= rect.top - AVOID_MARGIN && e.clientY <= rect.bottom + AVOID_MARGIN
    if (!near) {
      cancelAvoid()
      return
    }
    if (avoidTimer !== undefined) return
    avoidTimer = later(() => {
      avoidTimer = undefined
      if (root.classList.contains('hidden') || dragging || menu.classList.contains('open') || visualState !== 'idle') return
      if (performance.now() < avoidCooldownUntil) return
      swimmer.interrupt()
      const r = pet.getBoundingClientRect()
      const insideNow = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (insideNow) return
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const len = Math.hypot(dx, dy) || 1
      const next = clampPos(cx - (dx / len) * AVOID_STEP - PET_W() / 2, cy - (dy / len) * AVOID_STEP - PET_H() / 2)
      root.style.transition = 'left .35s ease, top .35s ease'
      root.style.left = `${next.x}px`
      root.style.top = `${next.y}px`
      later(() => {
        root.style.transition = ''
        savePos()
      }, 380)
      showDialog(strings.feedback.avoid)
    }, AVOID_DWELL_MS)
  }

  // ===== 摸头 =====
  // 不按键、光标在头顶来回蹭就算摸。每掉一次头算一下，蹭到第二下它才眯眼，
  // 免得鼠标只是路过头顶也被当成摸。
  /** 两次掉头之间至少要走这么远，手抖不算 */
  const PAT_MIN_TRAVEL = 8
  /** 停手这么久就算摸完了 */
  const PAT_IDLE_MS = 650
  /** 每蹭这么多下冒一颗爱心 */
  const PAT_HEART_EVERY = 5
  const PAT_SAY_COOLDOWN_MS = 4000
  /** 这么多下蹭在 PAT_TOO_FAST_MS 以内就是乱蹭：生气、游开 */
  const PAT_TOO_FAST_STROKES = 8
  const PAT_TOO_FAST_MS = 1100
  /** 生气后这段时间里再蹭也不理 */
  const PAT_GRUMPY_MS = 5000
  const PAT_FLEE_STEP = 160
  let patStrokes = 0
  let patStrokeTimes: number[] = []
  let patBlockedUntil = 0
  let patLastY = 0
  let patDir = 0
  let patTurnX = 0
  let patLastX = 0
  let patEndTimer = 0
  let patSaidAt = -Infinity
  const inHeadZone = (x: number, y: number) => {
    const r = pet.getBoundingClientRect()
    if (r.width === 0) return false
    const fx = (x - r.left) / r.width
    const fy = (y - r.top) / r.height
    // SVG 默认朝左，头在左半边；朝右时整只镜像
    const head = swimmer.currentFacing === 'left' ? fx >= 0.05 && fx <= 0.6 : fx >= 0.4 && fx <= 0.95
    return head && fy >= 0 && fy <= 0.45
  }
  const patTimers = new Set<number>()
  const endPat = () => {
    for (const id of patTimers) cancelLater(id)
    patTimers.clear()
    cancelLater(patEndTimer)
    patEndTimer = 0
    patStrokes = 0
    patStrokeTimes = []
    patDir = 0
    pet.classList.remove('petting', 'pat-press')
    root.classList.remove('patting')
  }
  const pressHead = () => {
    pet.classList.remove('pat-press')
    void pet.offsetWidth
    pet.classList.add('pat-press')
  }
  const popHeart = () => {
    const heart = pet.querySelector<HTMLElement>('.pat-heart')
    if (heart === null) return
    heart.classList.remove('show')
    void heart.offsetWidth
    heart.classList.add('show')
  }
  /** 摸满一轮：冒爱心、说句话、算一次互动；失落时这一摸就是安慰 */
  const patReward = () => {
    popHeart()
    if (visualState === 'disappointed' && driver.soothe()) {
      onSnapshot()
      triggerComfort()
      return
    }
    recordInteraction()
    const now = performance.now()
    if (now - patSaidAt < PAT_SAY_COOLDOWN_MS) return
    patSaidAt = now
    sounds.play('bubble')
    showDialog(pick(strings.feedback.patted))
  }
  /** 乱蹭：吊眉、放狠话，朝远离光标的方向游开一段 */
  const patTooFast = () => {
    endPat()
    const now = performance.now()
    patBlockedUntil = now + PAT_GRUMPY_MS
    avoidCooldownUntil = now + PAT_GRUMPY_MS
    recordInteraction()
    clearSulk()
    sulking = true
    pet.classList.remove('annoyed', 'squish', 'dizzy', 'joy')
    pet.classList.add('sulking')
    sounds.play('bubble')
    showDialog(pick(strings.feedback.patTooFast))
    sulkTimer = later(() => {
      sulkTimer = 0
      clearSulk()
    }, 2600)
    swimmer.interrupt()
    const r = pet.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = cx - patLastX
    const dy = cy - patLastY
    const len = Math.hypot(dx, dy) || 1
    const next = clampPos(cx + (dx / len) * PAT_FLEE_STEP - PET_W() / 2, cy + (dy / len) * PAT_FLEE_STEP - PET_H() / 2)
    root.style.transition = 'left .6s cubic-bezier(.2,.8,.3,1), top .6s cubic-bezier(.2,.8,.3,1)'
    root.style.left = `${next.x}px`
    root.style.top = `${next.y}px`
    swimmer.spawnSplash(cx, r.top + r.height * 0.79, 4)
    later(() => {
      root.style.transition = ''
      savePos()
    }, 650)
  }
  const onPatStroke = () => {
    markActive()
    const now = performance.now()
    patStrokeTimes.push(now)
    if (patStrokeTimes.length > PAT_TOO_FAST_STROKES) patStrokeTimes.shift()
    if (patStrokeTimes.length === PAT_TOO_FAST_STROKES && now - patStrokeTimes[0] < PAT_TOO_FAST_MS) {
      patTooFast()
      return
    }
    patStrokes += 1
    if (patStrokes >= 2) {
      if (!pet.classList.contains('petting')) {
        swimmer.interrupt()
        cancelAvoid()
        pet.classList.add('petting')
        root.classList.add('patting')
      }
      pressHead()
    }
    if (patStrokes % PAT_HEART_EVERY === 0) patReward()
  }
  const maybePat = (e: MouseEvent) => {
    if (e.buttons !== 0 || dragging || menu.classList.contains('open') || root.classList.contains('hidden') || visualState === 'error' || performance.now() < patBlockedUntil) {
      if (patStrokes > 0) endPat()
      return
    }
    if (!inHeadZone(e.clientX, e.clientY)) {
      if (patStrokes > 0 || patDir !== 0) endPat()
      return
    }
    const prevX = patLastX
    patLastX = e.clientX
    patLastY = e.clientY
    const dx = e.clientX - prevX
    if (dx === 0) return
    const dir = dx > 0 ? 1 : -1
    if (patDir === 0) {
      patDir = dir
      patTurnX = prevX
    } else if (dir !== patDir) {
      // 掉头点是上一个位置：这一段从上次掉头走到这里，够远才算蹭了一下
      if (Math.abs(prevX - patTurnX) >= PAT_MIN_TRAVEL) onPatStroke()
      patDir = dir
      patTurnX = prevX
    }
    cancelLater(patEndTimer)
    patEndTimer = later(endPat, PAT_IDLE_MS)
  }
  /** 菜单「摸摸头」和长按：没有鼠标轨迹，就替你摸三下 */
  const triggerPat = () => {
    if (root.classList.contains('hidden') || visualState === 'error' || performance.now() < patBlockedUntil) return
    endPat()
    swimmer.interrupt()
    pet.classList.add('petting')
    root.classList.add('patting')
    ;[0, 280, 560].forEach((ms) => patTimers.add(later(pressHead, ms)))
    patTimers.add(later(() => {
      patSaidAt = -Infinity
      patReward()
    }, 560))
    patEndTimer = later(endPat, 1500)
  }

  // ===== idle 随机小动作 =====
  let idleMicroTimer: number | undefined
  const clearIdleMicro = () => {
    cancelLater(idleMicroTimer)
    idleMicroTimer = undefined
  }
  const microLook = () => {
    const pupil = petPupil()
    if (pupil === null) return
    const dx = Math.random() * 0.4 - 0.2
    const dy = Math.random() * 0.3 - 0.15
    pupil.style.transition = 'transform .45s ease'
    pupil.style.transform = `translate(${dx}px, ${dy}px)`
    later(() => {
      pupil.style.transition = ''
      pupil.style.transform = ''
    }, 1500)
  }
  const microBubbles = () => {
    popBubble()
    later(popBubble, 260)
  }
  /** microSwim 的补间时长，也是"坐标不可信"的窗口 */
  const MICRO_SWIM_MS = 1450
  let microSwimUntil = 0
  const microSwim = (quiet = false) => {
    const ox = parseFloat(root.style.left) || 0
    const oy = parseFloat(root.style.top) || 0
    const target = clampPos(ox + (Math.random() * 200 - 100), oy + (Math.random() * 140 - 70))
    root.style.transition = 'left 1.4s ease-in-out, top 1.4s ease-in-out'
    root.style.left = `${target.x}px`
    root.style.top = `${target.y}px`
    // 补间期间 style.left 已是终点、鲸鱼还在半路，这段时间内谁读坐标都会读偏
    microSwimUntil = Date.now() + MICRO_SWIM_MS
    later(() => {
      root.style.transition = ''
      microSwimUntil = 0
      savePos()
    }, MICRO_SWIM_MS)
    if (!quiet && Math.random() < 0.35) showDialog(pick(strings.feedback.swim))
  }
  // ===== 原地动作（宠物声明式，见 pets/types.ts 的 micro 约定）=====
  /** 单个动作占用的时长上限：宠物样式表里的动画要 ≤ 这个值（约定 2.2s，留 0.2s 余量） */
  const MICRO_ACTION_MS = 2400
  /** 动作会说话的几率 */
  const MICRO_LINE_CHANCE = 0.6
  let microActionTimer = 0
  let microActionClass = ''
  let microActionLast = ''
  /** 洗牌袋：声明的动作打乱后依次取，取完重洗 → 短周期内不会连着重复同一个 */
  let microBag: string[] = []
  const clearMicroAction = () => {
    if (microActionClass === '') return
    pet.classList.remove(microActionClass)
    microActionClass = ''
  }
  const nextMicroAction = (): string => {
    const list = activePet.micro ?? []
    if (list.length === 0) return ''
    if (microBag.length === 0) {
      microBag = [...list]
      for (let i = microBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = microBag[i]
        microBag[i] = microBag[j]
        microBag[j] = t
      }
      // 新一轮的第一个别和上一轮的最后一个撞（两只动作的宠物会明显）
      if (microBag.length > 1 && microBag[0] === microActionLast) {
        const t = microBag[0]
        microBag[0] = microBag[1]
        microBag[1] = t
      }
    }
    return microBag.shift() ?? ''
  }
  const playMicroAction = (id: string) => {
    if (id === '') return
    clearMicroAction()
    microActionLast = id
    microActionClass = `micro-${id}`
    pet.classList.add(microActionClass)
    window.clearTimeout(microActionTimer)
    microActionTimer = window.setTimeout(clearMicroAction, MICRO_ACTION_MS)
    const pool = strings.micro[id]
    if (pool !== undefined && pool.length > 0 && Math.random() < MICRO_LINE_CHANCE) showDialog(pick(pool))
  }

  const scheduleIdleMicro = () => {
    clearIdleMicro()
    idleMicroTimer = later(() => {
      // 睡着/闹脾气时不做原地动作（打瞌睡只是根上的 class，visualState 仍是 idle，所以这里必须单独看 sleeping）
      if (visualState !== 'idle' || sleeping || sulking || root.classList.contains('hidden') || dragging || document.hidden || menu.classList.contains('open')) {
        scheduleIdleMicro()
        return
      }
      if (swimmer.isEnabled) {
        // 在飞：只有原地小动作会显得别扭，留着看四周/吐泡泡
        if (Math.random() < 0.5) microLook()
        else microBubbles()
      } else if ((activePet.micro?.length ?? 0) > 0 && Math.random() < 0.62) {
        // 没开御剑的站立型宠物：优先演宠物声明的原地动作（拂袖/理鬓/掐指/远眺…）
        playMicroAction(nextMicroAction())
      } else {
        // idleDrift:false 的宠物（站立的灵儿）不做随机平移：平移而没有对应动作＝无缘无故到处飘
        const canDrift = activePet.idleDrift !== false
        const roll = Math.random()
        if (canDrift && roll < 0.35) microSwim()
        else if (roll < (canDrift ? 0.7 : 0.55)) microLook()
        else microBubbles()
      }
      scheduleIdleMicro()
    }, 9000 + Math.random() * 8000)
  }

  // ===== 甩晕 =====
  /** 当前这条腿的方向，0 表示还没定下来 */
  let shakeDir = 0
  /** 这条腿的起点；同向移动时跟着推进，等于一路记住最远处 */
  let shakeLegFrom = 0
  let shakeCount = 0
  let shakeWindowFrom = 0
  /** 晕到什么时候为止，也当冷却用 */
  let shakenUntil = 0
  const resetShake = () => {
    shakeDir = 0
    shakeCount = 0
  }
  const triggerShaken = () => {
    const now = performance.now()
    if (now < shakenUntil) return
    shakeCount = 0
    shakenUntil = now + SHAKEN_MS + SHAKE_COOLDOWN_MS
    markActive()
    recordInteraction()
    clearReaction()
    pet.classList.remove('shaken', 'dizzy', 'squish', 'joy', 'annoyed')
    void pet.offsetWidth
    pet.classList.add('shaken')
    sounds.play('bubble')
    showDialog(pick(strings.feedback.shaken))
    // 后遗症：接下来一段时间游不直
    swimmer.setWoozy(SHAKEN_MS + WOOZY_MS)
    expireClass(pet, 'shaken', SHAKEN_MS)
  }
  /** 双击的专属反应：翻肚皮。翻着的时候不接别的动作，让这两秒完整演完 */
  let bellyUpUntil = 0
  const triggerBellyUp = () => {
    const now = performance.now()
    if (now < bellyUpUntil) return
    bellyUpUntil = now + BELLY_UP_MS
    markActive()
    recordInteraction()
    // 双击必然先来两次单击，连戳计数已经涨了；翻肚皮是亲昵不是骚扰，清掉
    pokeStreak = 0
    if (pokeDecayTimer !== 0) {
      cancelLater(pokeDecayTimer)
      pokeDecayTimer = 0
    }
    if (sulking) clearSulk()
    clearReaction()
    pet.classList.remove('squish', 'dizzy', 'joy', 'annoyed', 'shaken')
    void pet.offsetWidth
    pet.classList.add('belly-up')
    sounds.play('trick')
    showDialog(pick(strings.feedback.bellyUp))
    expireClass(pet, 'belly-up', BELLY_UP_MS)
  }

  const trackShake = (x: number) => {
    const now = performance.now()
    const delta = x - shakeLegFrom
    const dir = Math.sign(delta)
    if (dir === 0) return
    if (shakeDir === 0) {
      // 还没起手：先等它朝某个方向走够距离，那才是第一条腿
      if (Math.abs(delta) >= SHAKE_MIN_LEG) {
        shakeDir = dir
        shakeLegFrom = x
      }
      return
    }
    if (dir === shakeDir) {
      shakeLegFrom = x
      return
    }
    // 掉头了，但得从最远处走回来足够多才算一次甩
    if (Math.abs(delta) < SHAKE_MIN_LEG) return
    shakeDir = dir
    shakeLegFrom = x
    if (now - shakeWindowFrom > SHAKE_WINDOW_MS) {
      shakeCount = 0
      shakeWindowFrom = now
    }
    shakeCount++
    if (shakeCount >= SHAKE_REVERSALS) triggerShaken()
  }

  let dragStart: { pointerId: number; x: number; y: number; ox: number; oy: number } | null = null
  let longPressTimer: number | undefined
  let longPressTriggered = false
  const onPetPointerDown = (e: PointerEvent) => {
    if (disposed || e.button !== 0 || e.isPrimary === false || dragStart !== null) return
    suppressClick = false
    endPat()
    // 抓住/开始拖拽：立即停下避让动作与游动，并冷却一段时间，想抓就能抓住
    cancelAvoid()
    swimmer.interrupt()
    avoidCooldownUntil = performance.now() + AVOID_COOLDOWN_MS
    markActive()
    dragStart = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ox: parseFloat(root.style.left) || 0,
      oy: parseFloat(root.style.top) || 0,
    }
    resetShake()
    shakeLegFrom = e.clientX
    shakeWindowFrom = performance.now()
    // 严格保持抓取时的朝向，拖拽过程中不发生任何朝向突变
    root.dataset.facing = swimmer.currentFacing
    try { pet.setPointerCapture(e.pointerId) } catch { /* window 事件兜底 */ }
      longPressTriggered = false
      cancelLater(longPressTimer)
      longPressTimer = later(() => {
        longPressTriggered = true
        suppressClick = true
        triggerPat()
      }, 700)
  }
  /**
   * 贴边挤扁。只在拖拽时判定——自己游到边上是贴着走，不是被人按上去的。
   * 台词有独立冷却，不然沿着边拖一路会一直喊。
   */
  let squeezeSaidAt = 0
  const updateEdge = (x: number, y: number) => {
    const maxX = Math.max(0, window.innerWidth - PET_W())
    const maxY = Math.max(0, window.innerHeight - PET_H())
    const onLeft = x <= EDGE_SLACK
    const onRight = !onLeft && x >= maxX - EDGE_SLACK
    // 角落里只按左右算，两个方向一起压会拧成麻花
    const sideways = onLeft || onRight
    const onTop = !sideways && y <= EDGE_SLACK
    const onBottom = !sideways && y >= maxY - EDGE_SLACK
    root.classList.toggle('edge-left', onLeft)
    root.classList.toggle('edge-right', onRight)
    root.classList.toggle('edge-top', onTop)
    root.classList.toggle('edge-bottom', onBottom)
    if (!sideways && !onTop && !onBottom) return
    const now = performance.now()
    if (now - squeezeSaidAt < 4000) return
    squeezeSaidAt = now
    if (sideways) {
      showDialog(pick(strings.feedback.squeezed))
      swimmer.spawnDrip(x + (onLeft ? PET_W() * 0.18 : PET_W() * 0.82), y + PET_H() * 0.87)
    } else {
      showDialog(pick(onTop ? strings.feedback.squashedTop : strings.feedback.squashedBottom))
      swimmer.spawnDrip(x + PET_W() * (Math.random() < 0.5 ? 0.25 : 0.75), y + PET_H() * 0.87)
    }
  }
  const clearEdge = () => {
    root.classList.remove('edge-left', 'edge-right', 'edge-top', 'edge-bottom')
  }

  /** 拖着不放又不动：三秒后开始扭 */
  let dragIdleTimer = 0
  /** fresh=true 表示这是人动了手才重排的，扭动该停；续问时不能清，否则刚扭就被抹掉 */
  const armDragIdle = (fresh = true) => {
    if (dragIdleTimer !== 0) cancelLater(dragIdleTimer)
    if (fresh) pet.classList.remove('impatient')
    dragIdleTimer = later(() => {
      if (!dragging) return
      pet.classList.add('impatient')
      showDialog(pick(strings.feedback.dragIdle))
      // 还不放手就继续问，但别太密
      armDragIdle(false)
    }, DRAG_IDLE_MS)
  }
  const disarmDragIdle = () => {
    if (dragIdleTimer !== 0) {
      cancelLater(dragIdleTimer)
      dragIdleTimer = 0
    }
    pet.classList.remove('impatient')
  }

  let lastDripTime = 0
  const onPetPointerMove = (e: PointerEvent) => {
    if (dragStart === null || e.pointerId !== dragStart.pointerId) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    if (!dragging && Math.abs(dx) + Math.abs(dy) > 4) {
      endPat()
      dragging = true
      suppressClick = true
      root.classList.add('dragging')
      cancelLater(longPressTimer)
      armDragIdle()
    }
    if (dragging) {
      const p = clampPos(dragStart.ox + dx, dragStart.oy + dy)
      root.style.left = `${p.x}px`
      root.style.top = `${p.y}px`

      trackShake(e.clientX)
      updateEdge(p.x, p.y)
      // 动了就说明人还在，重新开始数
      armDragIdle()

      const now = performance.now()
      if (now - lastDripTime > 380) {
        lastDripTime = now
        swimmer.spawnDrip(p.x + PET_W() / 2, p.y + PET_H() * 0.87)
      }
    }
  }
  const endDrag = (e?: PointerEvent) => {
    if (dragStart === null || (e && e.pointerId !== dragStart.pointerId)) return
    const id = dragStart.pointerId
    dragStart = null
    try { pet.releasePointerCapture(id) } catch { /* 指针已被浏览器释放 */ }
    resetShake()
    disarmDragIdle()
    clearEdge()
    if (dragging) {
      dragging = false
      root.classList.remove('dragging')
      const px = parseFloat(root.style.left) || 0
      const py = parseFloat(root.style.top) || 0
      swimmer.spawnSplash(px + PET_W() / 2, py + PET_H() * 0.79, 4)
      swimmer.spawnWaterRipple(px + PET_W() / 2, py + PET_H() * 0.79, false)
      savePos()
      // 保持初始朝向不变
      root.dataset.facing = swimmer.currentFacing
      pet.style.transform = `scaleX(${swimmer.currentFacing === 'left' ? 1 : -1}) rotate(0deg)`
    }
    cancelLater(longPressTimer)
    if (!e || e.type !== 'pointerup') {
      suppressClick = true
      endPat()
    }
    longPressTriggered = false
    // 下一次 pointerdown 重置；浏览器延迟合成的 click 仍应被吞掉。
  }

// ===== 打瞌睡 =====
  let sleepTimer: number | undefined
  let sleeping = false
  const markActive = () => {
    cancelLater(sleepTimer)
    if (sleeping) {
      sleeping = false
      root.classList.remove('sleeping')
      pet.classList.add('spouting')
      expireClass(pet, 'spouting', 1400)
      showDialog(strings.feedback.wake)
      sounds.play('bubble')
    }
    sleepTimer = later(() => {
      if (visualState !== 'idle' || dragging) {
        markActive()
        return
      }
      sleeping = true
      root.classList.add('sleeping')
      clearMicroAction() // 正要睡着时如果动作还没演完，收掉（否则会一边睡觉一边转圈）
      showDialog(strings.feedback.sleep)
    }, SLEEP_MS)
  }
  const wake = () => {
    if (sleeping) {
      sleeping = false
      root.classList.remove('sleeping')
      pet.classList.add('spouting')
      expireClass(pet, 'spouting', 1400)
    }
  }

  // ===== 追光（rAF 节流） =====
  let eyeRaf = 0
  const onMouseMove = (e: MouseEvent) => {
    // 隐藏时不再追光，也不因鼠标移动唤醒台词
    if (root.classList.contains('hidden')) return
    markActive()
    // 躲避判定自带守卫，且不能被下面追光的 rAF 节流挡掉，所以放在 early-return 之前
    maybeAvoid(e)
    maybePat(e)
    if (eyeRaf !== 0) return
    const pupil = petPupil()
    if (pupil === null) return
    eyeRaf = window.requestAnimationFrame(() => {
      eyeRaf = 0
      const rect = pet.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = Math.max(-0.18, Math.min(0.18, (e.clientX - cx) / 500))
      const dy = Math.max(-0.15, Math.min(0.15, (e.clientY - cy) / 450))
      pupil.style.transform = `translate(${dx}px, ${dy}px)`
    })
  }

  // ===== 事件绑定 =====
  const copyError = async () => {
    const text = lastErrorText
    let copied = false
    try {
      if (navigator.clipboard !== undefined) {
        await navigator.clipboard.writeText(text)
        copied = true
      }
    } catch {
      // 无权限或不安全上下文时给出失败反馈。
    }
    if (!disposed && text === lastErrorText) showDialog(copied ? strings.feedback.errorCopied : strings.feedback.errorCopyFailed)
  }
  pet.addEventListener('click', () => {
    if (disposed || suppressClick || performance.now() < bellyUpUntil) return
    // 错误状态下点击：复制错误信息
    if (visualState === 'error' && lastErrorText !== '') {
      void copyError()
      return
    }

    // 失落时的一戳是安慰，不该被随机三选一顶掉
    if (visualState === 'disappointed' && driver.soothe()) {
      onSnapshot()
      triggerComfort()
      return
    }

    markActive()
    bumpPokeStreak()

    // 已经闹上了：再戳只是火上浇油，不重置动画
    if (sulking) {
      recordInteraction()
      showDialog(pick(strings.feedback.pokeSulk))
      return
    }
    if (pokeStreak >= POKE_SULK_AT) {
      triggerSulk()
      return
    }
    if (pokeStreak >= POKE_ANNOYED_AT) {
      triggerAnnoyed()
      return
    }

    const rand = Math.random()
    if (rand < 0.65) {
      triggerSquish()
    } else if (rand < 0.85) {
      triggerRoll()
    } else {
      triggerDizzy()
    }
  })
  // 双击按关系深浅分流：翻肚皮是"完全放松"的姿势，
  // 只有处到形影不离才给你看，平时还是翻个跟头
  pet.addEventListener('dblclick', () => {
    if (disposed || suppressClick || performance.now() < bellyUpUntil || visualState === 'error') return
    if (currentTier() >= BOND_THRESHOLDS.length - 1) triggerBellyUp()
    else triggerRoll()
  })
  pet.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    // 右键也不许避让抢跑
    cancelAvoid()
    avoidCooldownUntil = performance.now() + AVOID_COOLDOWN_MS
    openMenu(e.clientX, e.clientY)
  })
  pet.addEventListener('pointerdown', onPetPointerDown)
  pet.addEventListener('lostpointercapture', endDrag)
  window.addEventListener('pointermove', onPetPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  window.addEventListener('pointermove', onMiniPointerMove)
  window.addEventListener('pointerup', onMiniDragEnd)
  window.addEventListener('pointercancel', onMiniDragEnd)
  const onBlur = () => { endDrag(); onMiniDragEnd(); endPat() }
  window.addEventListener('blur', onBlur)
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', markActive)
  document.addEventListener('wheel', markActive, { passive: true })
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('resize', onResize)

  // ===== 会话状态订阅 =====
  // 0.1.5 起数据分两处（见 state.ts 文件头的字段对照）：
  //  - ctx.sessions → SessionFace：running / lastAgentError / openError
  //  - ctx.uiConversation → binding(...).target('chat') 的 ChatSnapshot.legacy：
  //    partial / runningCalls / turnEnds —— 这三个字段 0.1.5 的会话快照里没有
  const driver = new WhaleDriver()
  const sessions: ISessions | undefined = ctx.sessions
  const uiConversation = ctx.uiConversation
  let unsubList: (() => void) | undefined
  let unsubSession: (() => void) | undefined
  let unsubChat: (() => void) | undefined
  let face: SessionFace | undefined
  let chat: ChatSnapshot | undefined
  let boundSession: unknown
  let prevSessionId: string | undefined = undefined
  let isFirstSessionSync = true

  // 0.1.7 的按会话状态；0.1.5 的 uiSession 没有 sessionStatus，这一整块自动不生效
  const statusRaw = (ctx as unknown as { uiSession?: { sessionStatus?: SessionStatusSource } }).uiSession?.sessionStatus
  const statusSource = typeof statusRaw?.getSnapshot === 'function' ? statusRaw : undefined

  /** 把两处订阅合成状态机需要的"最小快照面"。 */
  const composeSnapshot = (): WhaleSnapshot | undefined => {
    if (face === undefined) return undefined
    const session = face.getSnapshot()
    const legacy = chat?.legacy
    const partial = legacy?.partial ?? null
    const status = prevSessionId === undefined ? undefined : statusSource?.getSnapshot().get(prevSessionId)
    return {
      running: session.running,
      partial,
      runningCalls: legacy?.runningCalls ?? [],
      partialToolCall: partialHasToolCall(partial),
      lastAgentError: session.lastAgentError,
      openError: session.openError,
      turnEnds: legacy?.turnEnds,
      // pending：0.1.7 从 uiSession.sessionStatus 的 pendingInteraction 来；
      // 0.1.5 没有公开读取面（见 state.ts 文件头），按老字段兜底读，没有就是 undefined。
      pending:
        status?.pendingInteraction !== undefined
          ? [status.pendingInteraction]
          : (session as { pending?: readonly unknown[] }).pending,
    }
  }

  // ===== 跟随所有会话 =====
  let followAll = true
  try {
    followAll = localStorage.getItem(FOLLOW_ALL_KEY) !== '0'
  } catch {
    // 忽略存储失败
  }
  let otherRunning = 0
  let otherWaiting = 0
  /** 别的会话的事，要在状态切换的那句台词之后再说，不然会被盖掉 */
  let otherNews = ''
  const prevOtherRunning = new Map<string, boolean>()
  const prevOtherWaiting = new Map<string, boolean>()
  let statusPrimed = false

  const rowOf = (id: string): SessionRow | undefined =>
    (sessions?.list.getSnapshot().byId as Readonly<Record<string, SessionRow | undefined>> | undefined)?.[id]

  let badgeCount = 0
  const updateBadge = () => {
    const n = followAll ? otherRunning : 0
    badge.hidden = n === 0
    badge.textContent = n > 9 ? '9+' : String(n)
    badge.title = n === 0 ? '' : strings.multi.badge(n)
    // 数字变了就弹一下；先摘类再强制回流，连续变化也能重新播
    if (n > 0 && n !== badgeCount) {
      badge.classList.remove('pop')
      void badge.offsetWidth
      badge.classList.add('pop')
    }
    if (n > 0) startFollow()
    badgeCount = n
  }

  const recountOthers = () => {
    if (statusSource === undefined) return
    const snapshot = statusSource.getSnapshot()
    for (const id of prevOtherRunning.keys()) {
      if (!snapshot.has(id) || rowOf(id)?.parentId !== undefined || rowOf(id)?.origin === 'subagent') {
        prevOtherRunning.delete(id)
        prevOtherWaiting.delete(id)
      }
    }
    let running = 0
    let waiting = 0
    let done: string | undefined
    let newlyWaiting: string | undefined
    for (const [id, st] of snapshot) {
      const row = rowOf(id)
      // 子代理是当前会话自己派出去的活，不算"别的会话"
      if (row?.parentId !== undefined || row?.origin === 'subagent') continue
      if (id === prevSessionId) {
        // 当前会话的边沿归状态机管；清掉旧记录，免得切走时拿过期的"在跑"误判成刚跑完
        prevOtherRunning.delete(id)
        prevOtherWaiting.delete(id)
        continue
      }
      const isRunning = st.running === true
      const isWaiting = st.pendingInteraction !== undefined
      if (isRunning) running++
      if (isWaiting) waiting++
      if (statusPrimed && prevOtherRunning.get(id) === true && st.running === false) done ??= id
      if (statusPrimed && isWaiting && prevOtherWaiting.get(id) !== true) newlyWaiting ??= id
      prevOtherRunning.set(id, isRunning)
      prevOtherWaiting.set(id, isWaiting)
    }
    statusPrimed = true
    otherRunning = running
    otherWaiting = waiting
    updateBadge()
    if (followAll) {
      if (done !== undefined) {
        driver.celebrateOther(performance.now())
        otherNews = strings.multi.doneOther(rowOf(done)?.displayTitle ?? '')
      } else if (newlyWaiting !== undefined) {
        otherNews = strings.multi.waitingOther(rowOf(newlyWaiting)?.displayTitle ?? '')
      }
    }
  }
  const onStatus = () => {
    recountOthers()
    onSnapshot()
  }

  // 瞬态到点回落需要一个"没人推快照也要醒一次"的定时器。
  // 没有它：回合结束后快照不再更新 ⇒ step() 不再被调用 ⇒ celebrate 永远不停（实测 18.5s 以上）。
  let wakeTimer = 0
  const clearWake = () => {
    if (wakeTimer !== 0) {
      cancelLater(wakeTimer)
      wakeTimer = 0
    }
  }
  const scheduleWake = () => {
    clearWake()
    const now = performance.now()
    const at = driver.nextDeadline(now)
    if (at === null) return
    // +24ms 是给 performance.now / setTimeout 之间的粒度差留的余量，避免差一毫秒又睡一轮
    wakeTimer = later(() => {
      wakeTimer = 0
      onSnapshot()
    }, Math.max(16, at - now + 24))
  }

  /** 当前会话闲着时，别的会话的状态顶上来：有人等确认 > 有人在跑 */
  const withOthers = (state: WhaleState): WhaleState => {
    if (!followAll || state !== 'idle') return state
    if (otherWaiting > 0) return 'wait'
    if (otherRunning > 0) return 'working'
    return state
  }
  // 并发播报：档位只升不降，一批活全部跑完（总数归零）才清零，免得人数在档内上下抖动时反复喊
  let busyTier = 0
  let peakRunning = 0
  const trackConcurrency = (currentRunning: boolean) => {
    if (!followAll || statusSource === undefined) {
      busyTier = 0
      peakRunning = 0
      return
    }
    const total = otherRunning + (currentRunning ? 1 : 0)
    const tier = total >= OVERTIME_AT ? 2 : total >= 2 ? 1 : 0
    if (tier > busyTier) {
      otherNews = pick(tier === 2 ? strings.multi.overtime(total) : strings.multi.parallel(total))
      busyTier = tier
    }
    peakRunning = Math.max(peakRunning, total)
    if (total === 0) {
      // 真并发过才说收工的话；单个会话跑完还是平常的台词
      if (peakRunning >= 2) otherNews = pick(strings.multi.allDone)
      busyTier = 0
      peakRunning = 0
    }
  }

  let lastShown: WhaleState | null = null
  const announceOtherNews = () => {
    if (otherNews === '') return
    showDialog(otherNews)
    otherNews = ''
  }

  const onSnapshot = () => {
    if (disposed) return
    const snapObj = composeSnapshot() ?? { running: false, lastAgentError: null, openError: null }
    lastErrorText = snapObj.lastAgentError ?? (snapObj.openError != null ? 'open-error' : '')
    trackConcurrency(snapObj.running)
    const step = driver.step(snapObj, performance.now())
    const shown = withOthers(step.state)
    // 首帧（lastShown 为 null）跟 prime 一样不算变化，不冒台词不出声
    setState(shown, lastShown !== null && shown !== lastShown)
    lastShown = shown
    announceOtherNews()
    // 只有开关打开且真实状态是 think 时展示思考流；假装工作模式不展示
    updateTicker(tickerOn && step.state === 'think' ? partialTextOf(snapObj.partial) : '')
    scheduleWake()
  }
  const syncSession = () => {
    const id = currentSessionId(sessions.list.getSnapshot())
    const binding = id === undefined ? undefined : sessions.binding(id as Parameters<ISessions['binding']>[0])
    // 0.1.7 的会话列表会因为别的会话的元数据频繁发布；当前会话和它的绑定都没变就不重订
    if (disposed) return
    if (!isFirstSessionSync && id === prevSessionId && binding === boundSession) {
      recountOthers()
      onSnapshot()
      return
    }
    unsubSession?.()
    unsubChat?.()
    unsubSession = undefined
    unsubChat = undefined
    face = undefined
    chat = undefined
    boundSession = binding
    if (id !== undefined && id !== prevSessionId && !isFirstSessionSync) {
      triggerWelcome()
    }
    const switched = id !== prevSessionId
    if (switched && !isFirstSessionSync) driver.reset()
    prevSessionId = id
    isFirstSessionSync = false
    // 当前会话换了，"别的会话"的名单也跟着变，重新数一遍
    if (switched) recountOthers()

    if (id === undefined || binding === undefined) {
      onSnapshot()
      return
    }
    face = binding.session
    unsubSession = face.subscribe(onSnapshot)

    // 对话视图的 chat 投影：legacy 就是旧快照的 partial / runningCalls / turnEnds。
    // 契约上 target() 的第一次订阅会激活该 view。
    try {
      const target = uiConversation.binding(binding).target('chat')
      unsubChat = target.subscribe(() => {
        chat = target.getSnapshot()
        onSnapshot()
      })
      chat = target.getSnapshot()
    } catch {
      // 拿不到 chat 投影就退化成"没有工具/文本信号"：鲸鱼仍能 think / idle / celebrate，
      // 只是工具调用期间不切 working。绝不能让它把 apply 打断，那会整只鲸鱼消失。
      chat = undefined
    }
    onSnapshot()
  }

  let unsubStatus: (() => void) | undefined
  if (sessions !== undefined) {
    unsubList = sessions.list.subscribe(syncSession)
    syncSession()
    unsubStatus = statusSource?.subscribe(onStatus)
    onStatus()
  }

  markActive()

  // ===== 恢复隐藏状态（跨刷新记忆） =====
  try {
    if (localStorage.getItem(HIDDEN_KEY) === '1') {
      root.classList.add('hidden')
      createMini()
    }
  } catch {
    // 忽略存储失败
  }

  // ===== 启动定时隐藏检查 =====
  startAutoHide()

      // ===== 语言切换监听 =====
    let localeUnsub: (() => void) | undefined
    const applyLocale = (nextLocale: PetLocale) => {
      if (locale === nextLocale) return
      locale = nextLocale
      strings = getStrings(locale, activePet.text?.[locale])
      pet.setAttribute('aria-label', strings.aria.petName(petDisplayName(activePet)))
      if (mini !== null) mini.setAttribute('aria-label', strings.aria.mini)
      syncMiniState(visualState)
      if (menu.classList.contains('open')) {
        buildMenu(menuMode)
        positionMenu(lastMenuPos.x, lastMenuPos.y)
      }
    }
    localeUnsub = localeService?.subscribe(() => {
      const nextLocale: PetLocale = localeService.getLocale().active === 'en' ? 'en' : 'zh'
      applyLocale(nextLocale)
    })

// ===== 清理 =====
  // ===== 主动搭话：只有形影不离档才会 =====
  const chatterTick = () => {
    if (currentTier() < BOND_THRESHOLDS.length - 1) return
    // 干活、睡着、被藏起来、正开着菜单、在闹脾气——都不是搭话的时候
    if (
      visualState !== 'idle' ||
      document.hidden ||
      sleeping ||
      sulking ||
      root.classList.contains(HIDDEN_CLASS) ||
      menu.classList.contains('open')
    ) {
      return
    }
    if (Math.random() > CHATTER_CHANCE) return
    showDialog(pick(strings.bond.chatter))
  }
  const chatterTimer = window.setInterval(chatterTick, CHATTER_TICK_MS)
  // 挂载时也对一次账：隔了很久再回来，该升的档得当场认出来
  checkBondUp()

  const dispose = () => {
    if (disposed) return
    disposed = true
    endDrag()
    onMiniDragEnd()
    endPat()
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
    classTimers.clear()
    removalObserver.disconnect()
    if (owner.__petWhaleDispose === dispose) delete owner.__petWhaleDispose
    const api = document as Document & Record<string, unknown>
    delete api.__petWhalePets
    delete api.__petWhaleActivePet
    delete api.__petWhaleSetPet
    pet.removeEventListener('pointerdown', onPetPointerDown)
    pet.removeEventListener('lostpointercapture', endDrag)
    window.removeEventListener('pointermove', onPetPointerMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
    window.removeEventListener('pointermove', onMiniPointerMove)
    window.removeEventListener('pointerup', onMiniDragEnd)
    window.removeEventListener('pointercancel', onMiniDragEnd)
    window.removeEventListener('blur', onBlur)
    cancelLater(sleepTimer)
    window.clearTimeout(microActionTimer)
    if (sedentaryTimer !== 0) window.clearInterval(sedentaryTimer)
    window.clearInterval(chatterTimer)
    if (dragIdleTimer !== 0) cancelLater(dragIdleTimer)
    restoreTitle()
    for (const notification of notifications) {
      try { notification.close() } catch { /* 通知服务已失效时继续清理其他资源。 */ }
    }
    notifications.clear()
    if (pokeDecayTimer !== 0) cancelLater(pokeDecayTimer)
    if (sulkTimer !== 0) cancelLater(sulkTimer)
    cancelLater(dialogTimer)
    if (eyeRaf !== 0) window.cancelAnimationFrame(eyeRaf)
    unsubList?.()
    unsubStatus?.()
    unsubSession?.()
    unsubChat?.()
    clearWake()
    document.removeEventListener('pointerdown', onDocPointerDown)
    document.removeEventListener('keydown', markActive)
    document.removeEventListener('wheel', markActive)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    document.removeEventListener('visibilitychange', onFollowVisibility)
    if (followRaf !== 0) window.cancelAnimationFrame(followRaf)
    themeObserver.disconnect()
    clearIdleMicro()
    cancelAvoid()
    swimmer.dispose()
    sounds.dispose()
    localeUnsub?.()
    cancelLater(patEndTimer)
    if (autoHideTimer !== undefined) window.clearInterval(autoHideTimer)
    hideTicker()
    ticker.remove()
    removeMini()
    root.remove()
    style.remove()
    petStyle.remove()
  }
  const removalObserver = new MutationObserver(() => { if (!root.isConnected) dispose() })
  removalObserver.observe(document.body, { childList: true })
  owner.__petWhaleDispose = dispose

  // ===== 多宠物对外接口（fork 扩展）=====
  // 薄预览页（上游 1.2.3+ 的 preview.html）只加载 lib/client.js，拿不到模块内部；
  // 这里挂三个只读/切换用的小接口，页面据此列出宠物并切换。DSH 本体不需要它们。
  const petApi = document as Document & {
    __petWhalePets?: Array<{ id: string; zh: string; en: string; icon: string }>
    __petWhaleActivePet?: () => string
    __petWhaleSetPet?: (id: string) => string
  }
  petApi.__petWhalePets = PETS.map((p) => ({ id: p.id, zh: p.name.zh, en: p.name.en, icon: p.icon }))
  petApi.__petWhaleActivePet = () => activePet.id
  petApi.__petWhaleSetPet = (id: string) => {
    const next = petOf(id)
    applyPet(next.id)
    syncMiniState(visualState) // 隐藏状态下切宠物，小按钮的图标/文案也要跟着换
    return next.id
  }
  quitWhale = dispose
  onVisibility()
  return dispose
}
