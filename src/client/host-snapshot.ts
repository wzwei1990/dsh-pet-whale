/** DSH 快照兼容边界：只解析输入，不订阅服务、不操作 DOM。 */
export interface SessionRow {
  displayTitle?: string
  parentId?: string
  origin?: string
  retainedBy?: Partial<Record<string, number>>
}

export interface SessionListLike {
  current?: string
  byId?: Readonly<Record<string, SessionRow | undefined>>
}

/** 0.1.5 的 current 优先；0.1.7 起由主视图的持有记录识别当前会话。 */
export function currentSessionId(list: SessionListLike): string | undefined {
  // current 存在但为 undefined 代表未选中，不能退回 retainedBy。
  if ('current' in list) return list.current
  const rows = list.byId ?? {}
  for (const id of Object.keys(rows)) {
    if ((rows[id]?.retainedBy?.mainView ?? 0) > 0) return id
  }
  return undefined
}

export function partialTextOf(partial: unknown): string {
  if (partial === null || typeof partial !== 'object') return ''
  const blocks = (partial as { blocks?: readonly unknown[] }).blocks
  if (!Array.isArray(blocks)) return ''
  const parts: string[] = []
  for (const block of blocks) {
    if (block === null || typeof block !== 'object') continue
    const b = block as { kind?: string; text?: unknown }
    if ((b.kind === 'text' || b.kind === 'reasoning') && typeof b.text === 'string') parts.push(b.text)
  }
  return parts.join(' ')
}

/** 短工具调用可能来不及进入 runningCalls，流式 tool-call 块也算活动。 */
export function partialHasToolCall(partial: unknown): boolean {
  if (partial === null || typeof partial !== 'object') return false
  const blocks = (partial as { blocks?: readonly unknown[] }).blocks
  if (!Array.isArray(blocks)) return false
  return blocks.some(block => block !== null && typeof block === 'object'
    && (block as { kind?: string }).kind === 'tool-call')
}
