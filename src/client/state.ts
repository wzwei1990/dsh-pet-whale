// 状态机：会话快照 → 鲸鱼状态。
// 持续状态（think/working/idle）直接由快照推导；瞬态（error/celebrate）由边沿事件触发，
// 到时间后回落到推导状态。优先级：error > celebrate > drag > think > working > idle。
//
// 回合语义（2026-08-14 定版调整）：
// - running 期间永不 idle：有工具 = working，无工具（文字流或模型内部推理）= think 深潜
// - working 粘滞 WORK_STICKY_MS：最后一次工具活动后再保持一小段"敲代码"，覆盖工具之间的推理空档
//
// ===== 快照字段与 dsh 0.1.5-rc.2 的对照（2026-09-15 核实）=====
// 会话快照的类型定义在
//   @deepseek-ai/dsh-api-session-controller/lib/types/client/contract/snapshot.d.ts
// 的 SessionSnapshot。0.1.5-rc.2 它只有：
//   sessionId / queue / pendingSubmissions / running / subagent / removed / openState /
//   openError / hasMore / loadingOlder / promptError / blank / lastAgentError /
//   promptAttempted / awaitingFirstTurn
// ——**没有** partial、**没有** runningCalls、**没有** turnEnds、**没有** pending。
// （同一份文件在 0.1.2-rc.1 里这四个字段就已经没有了；0.1.5 相对 0.1.2 在这份
//  SessionSnapshot 上的唯一变化是 PendingSubmission.images → attachments。）
//
// 所以这几个字段现在的来源分两处：
//   · running / lastAgentError / openError  → 仍然是上面的 SessionSnapshot；
//   · partial / runningCalls / turnEnds     → 会话对话视图的兼容投影
//       ChatSnapshot.legacy，类型在
//       @deepseek-ai/dsh-client-ui-chat/lib/types/client/contract/snapshot.d.ts
//       的 LegacyConversationSlice（注释原文："Compatibility projection backing
//       StatsPills and the legacy top-level snapshot fields"）。
//       取法见 index.ts：ctx.uiConversation.binding(binding).target('chat')。
//   · pending（等待用户 approval / plan-review / question）→ 0.1.5 **没有公开读取面**：
//       审批/提问的数据是 slot 的 carrier，只发给注册了对应 slot 的 UI 包
//       （dsh-client-ui-approval / dsh-client-ui-user-questions 都只导出 apply + props 类型）。
//       本文件与 index.ts 都按老字段兜底读：宿主补上就自动生效，没有就是 undefined，
//       所以 wait 在 0.1.5 上实际不会触发——这是有意的降级，不是漏改。
//       0.1.7 起 ctx.uiSession.sessionStatus 按会话给出 pendingInteraction，
//       index.ts 从那里把它填进 pending，wait 才真正能触发。
//
// 因此：**所有可能不存在的字段一律可选，读之前一律兜底**。
// 之前直接写 snap.runningCalls.length 就是这次 0.1.5 控制台里
// "TypeError: Cannot read properties of undefined (reading 'length')" 的成因——
// 它在订阅回调里抛，把整条快照链打断，鲸鱼状态从此不再更新。

export type WhaleState = 'idle' | 'think' | 'working' | 'celebrate' | 'error' | 'wait' | 'disappointed'

/** 鲸鱼需要的会话快照最小面（真实快照是其超集，见文件头注释）。 */
export interface WhaleSnapshot {
  running: boolean
  /** 有文本流 = 思考中（来自 ChatSnapshot.legacy.partial） */
  partial?: unknown | null
  /** 工具调用中（来自 ChatSnapshot.legacy.runningCalls） */
  runningCalls?: readonly unknown[]
  /**
   * 流式消息（partial）里已经出现 tool-call 块。
   * 这比 legacy.runningCalls 更早就能看到——短工具调用时 runningCalls 可能整个生命周期
   * 都没被观察到，只靠它会让鲸鱼漏掉 working。两者取或。
   */
  partialToolCall?: boolean
  lastAgentError: string | null
  openError: unknown | null
  /**
   * 已完成回合数 → 结束事件 seq（来自 ChatSnapshot.legacy.turnEnds）。
   * dsh 0.1.2 起会话快照不再带这个字段，所以是可选的；
   * 而且它来自 chat 投影、和 running（会话快照）不是同一次发布，可能滞后一个 tick，
   * 所以 step() 在"没增长"时也会按 running 真→假 的边沿兜底庆祝。
   */
  turnEnds?: ReadonlyMap<number, number>
  /**
   * 等待用户处理：approval / plan-review / question。
   * 0.1.2 起会话快照不再带这个字段，0.1.5 也没有替代的公开读取面，见文件头注释。
   */
  pending?: readonly unknown[]
}

export const ERROR_MS = 4000
export const DISAPPOINTED_MS = 2600
export const CELEBRATE_MS = 2500
/** working 粘滞时长：工具调用结束后继续保持"敲代码"的时间 */
export const WORK_STICKY_MS = 2500

/** 快照 → 持续状态。 */
export function deriveContinuous(snap: WhaleSnapshot, stickyUntil: number | null, now: number): WhaleState {
  if (!snap.running) return 'idle'
  // 字段可能整个缺失（0.1.5），先兜底再读长度
  if (hasToolActivity(snap)) return 'working'
  if (stickyUntil !== null && now < stickyUntil) return 'working'
  // 回合进行中但无工具：文字流或模型内部推理，都表现为深潜思考
  return 'think'
}

/** 有工具在飞：legacy.runningCalls 非空，或者流式消息里已经出现了 tool-call 块。 */
function hasToolActivity(snap: WhaleSnapshot): boolean {
  return (snap.runningCalls?.length ?? 0) > 0 || snap.partialToolCall === true
}

export interface WhaleStep {
  state: WhaleState
  /** 状态是新变化（刚进入）还是沿用 */
  changed: boolean
}

/** 状态驱动：吃快照序列，吐状态序列。 */
export class WhaleDriver {
  private prevRunning: boolean | null = null
  private prevTurnEnds = 0
  private prevError: string | null = null
  private transient: { state: 'celebrate' | 'error' | 'disappointed'; until: number } | null = null
  private stickyUntil: number | null = null
  private current: WhaleState = 'idle'

  /** 首帧初始化基线（不触发任何瞬态）。 */
  prime(snap: WhaleSnapshot): void {
    this.prevRunning = snap.running
    this.prevTurnEnds = snap.turnEnds?.size ?? 0
    this.prevError = errorKey(snap)
    this.transient = null
    this.stickyUntil = null
    this.current = (snap.pending?.length ?? 0) > 0 ? 'wait' : deriveContinuous(snap, this.stickyUntil, 0)
  }

  step(snap: WhaleSnapshot, now: number): WhaleStep {
    if (this.prevRunning === null) {
      this.prime(snap)
      return { state: this.current, changed: false }
    }

    const err = errorKey(snap)
    // 新回合优先恢复实时状态，上一回合的庆祝或失落不能遮住开工。
    if (snap.running && this.prevRunning === false) this.transient = null
    // error 边沿：新错误出现（含从上一次错误恢复后再次出错）
    if (err !== null && err !== this.prevError) {
      this.transient = { state: 'error', until: now + ERROR_MS }
    }
    this.prevError = err

    // celebrate 边沿：running 真→假 且回合数增长 且当前无错误
    if (this.prevRunning === true && snap.running === false) {
      // turnEnds 在 0.1.5 来自 chat 投影（ChatSnapshot.legacy.turnEnds），而 running 来自
      // 会话快照 —— 两者不是同一次发布。实测（0.1.5-rc.2 真机）：running 翻落的那一刻
      // legacy.turnEnds 还可能是空 Map，下一个 tick 才补上。所以"没增长"不能当成"没完成"，
      // 否则庆祝永远不触发（这是 1.1.1 首测发现的退化，不是推测）。
      // 规则：投影已经增长就用它，没增长就按 running 真→假 这次边沿自增一次。
      const ends = snap.turnEnds?.size
      const grew = ends !== undefined && ends > this.prevTurnEnds
      const turns = grew ? ends : this.prevTurnEnds + 1
      if (turns > this.prevTurnEnds && err === null) {
        this.transient = { state: 'celebrate', until: now + CELEBRATE_MS }
      }
      this.prevTurnEnds = turns
    } else if (snap.turnEnds !== undefined && snap.turnEnds.size > this.prevTurnEnds) {
      // 回合在同一段 running 里就结束了（排队 / 子代理等）：只做同步，不在这里庆祝，
      // 免得把计数和后面的边沿判断错开。
      this.prevTurnEnds = snap.turnEnds.size
    }
    this.prevRunning = snap.running

    // working 粘滞：见到工具活动就刷新窗口；回合结束清掉
    if (snap.running && hasToolActivity(snap)) this.stickyUntil = now + WORK_STICKY_MS
    if (!snap.running) this.stickyUntil = null
    if (this.stickyUntil !== null && now >= this.stickyUntil) this.stickyUntil = null

    // 即使 wait 抢占显示，也必须推进到期状态，否则 deadline 会每 24ms 唤醒一次。
    if (this.transient !== null && now >= this.transient.until) {
      this.transient = this.transient.state === 'error'
        ? { state: 'disappointed', until: this.transient.until + DISAPPOINTED_MS }
        : null
      if (this.transient !== null && now >= this.transient.until) this.transient = null
    }

    const waiting = (snap.pending?.length ?? 0) > 0
    let next: WhaleState
    if (waiting) {
      next = 'wait'
    } else if (this.transient !== null) {
      next = this.transient.state
    } else {
      next = deriveContinuous(snap, this.stickyUntil, now)
    }
    const changed = next !== this.current
    this.current = next
    return { state: next, changed }
  }

  /**
   * 安抚：失落时被戳，提前结束这段自愈。
   * 只对 disappointed 生效——error 正在报的时候不该被一戳抹掉，
   * celebrate 也没有提前结束的道理。返回是否真的安抚到了。
   */
  soothe(): boolean {
    if (this.transient === null || this.transient.state !== 'disappointed') return false
    this.transient = null
    return true
  }

  /**
   * 换了当前会话：下一帧当首帧重新起算基线。
   * 不重置的话，旧会话 running=true、新会话 running=false 会被 step 当成"回合跑完"误庆祝。
   */
  reset(): void {
    this.prevRunning = null
    this.stickyUntil = null
    this.transient = null
    this.current = 'idle'
    this.prevError = null
    this.prevTurnEnds = 0
  }

  /**
   * 别的会话跑完了：当前会话的快照里看不到这个边沿，由调用方直接递进来。
   * 正在报错 / 失落时不抢戏。下一次 step() 才会把状态真正切过去。
   */
  celebrateOther(now: number): void {
    if (this.transient !== null && this.transient.state !== 'celebrate' && now < this.transient.until) return
    this.transient = { state: 'celebrate', until: now + CELEBRATE_MS }
  }

  get state(): WhaleState {
    return this.current
  }

  /**
   * 下一个「不需要新快照、时间到了状态自己就该变」的时刻（ms，与 step 的 now 同基准）。
   * null = 没有待到期的东西。
   *
   * 为什么需要它：step() 只在快照更新时被调用，而 celebrate / error / disappointed 是
   * 到点回落的瞬态、working 粘滞也是到点回落。回合结束后快照往往就不再更新了，
   * 没人再调 step ⇒ 瞬态永远不结束。实测：celebrate 卡住 18.5 秒，直到下一条消息
   * 把它顶掉（用户看到的就是"庆祝停不下来"）。调用方拿这个时刻挂一个定时器即可。
   */
  nextDeadline(now: number): number | null {
    const candidates: number[] = []
    if (this.transient !== null) candidates.push(Math.max(now, this.transient.until))
    if (this.stickyUntil !== null) candidates.push(Math.max(now, this.stickyUntil))
    if (candidates.length === 0) return null
    return Math.min(...candidates)
  }
}

function errorKey(snap: WhaleSnapshot): string | null {
  if (snap.lastAgentError != null) return snap.lastAgentError
  if (snap.openError != null) return 'open-error'
  return null
}
