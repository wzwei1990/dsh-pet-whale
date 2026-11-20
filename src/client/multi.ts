/** 多会话聚合：后台会话的相位如何影响桌宠（纯函数，便于单测）。 */
import type { WhaleState } from './state'

export interface BackgroundSession {
  readonly id: string
  readonly title: string
  /** 会话是否在跑（来自 uiSession.sessionStatus） */
  readonly running: boolean
  /** 有需要用户确认的交互 */
  readonly pending: boolean
  /** 最近一次 agent 错误（本轮内的错误会被状态机消费） */
  readonly failed: boolean
}

export type BackgroundPhase = 'wait' | 'working' | 'error'

/** 后台会话里最需要表达的那个相位：待确认 > 出错 > 在跑 */
export function backgroundPhase(sessions: readonly BackgroundSession[]): BackgroundPhase | undefined {
  let running = false
  let failed = false
  for (const s of sessions) {
    if (s.pending) return 'wait'
    if (s.failed) failed = true
    if (s.running) running = true
  }
  if (failed) return 'error'
  if (running) return 'working'
  return undefined
}

/**
 * 主视图会话空闲时，用后台会话的相位顶上；主视图自己在跑/等待时以它为准
 * （主会话的信息更细，后台只知道"在跑/待确认/出错"）。
 */
export function aggregateVisual(main: WhaleState, background: readonly BackgroundSession[], followAll: boolean): WhaleState {
  if (!followAll) return main
  const phase = backgroundPhase(background)
  if (phase === undefined) return main
  if (main !== 'idle' && main !== 'celebrate') return main
  return phase
}

/** 角标数字：在跑 + 待确认（去重后按会话数），并给每类取标题做 tooltip。 */
export function badgeSummary(sessions: readonly BackgroundSession[]): {
  count: number
  titles: string[]
  waiting: string[]
} {
  const titles: string[] = []
  const waiting: string[] = []
  for (const s of sessions) {
    if (s.pending) waiting.push(s.title)
    if (s.running) titles.push(s.title)
  }
  return { count: Math.max(titles.length, waiting.length), titles, waiting }
}
