/**
 * 同池随机挑选器（洗牌袋）。
 *
 * 规则（用户 2026-11-19 明确）：
 * - 只在**同一类型**（同一个池）里随机，不同类型之间互不影响；
 * - 一轮内每个动作恰好出现一次（洗牌后依次取）；
 * - 新一轮的第一个不会和上一轮最后一个相同 → 不出现"连续重复"；
 * - 每一轮顺序重新洗牌 → 长期看是随机的，不是固定循环。
 *
 * 独立成模块是为了能在 Node 里直接跑单测（tests/pick.test.mjs）。
 */
export type IdFilter = (id: string) => boolean

export interface PoolPicker {
  /** 从 ids 里挑一个；ids 会先按 valid 过滤。空池返回 undefined。 */
  pick: (ids: readonly string[] | undefined, key: string) => string | undefined
  /** 只看不取（调试用） */
  bagOf: (key: string) => readonly string[]
}

export function createPoolPicker(valid: IdFilter = () => true): PoolPicker {
  const bags: Record<string, string[]> = {}
  const lastPicked: Record<string, string> = {}

  const pick = (ids: readonly string[] | undefined, key: string): string | undefined => {
    const pool = (ids ?? []).filter(valid)
    if (pool.length === 0) return undefined
    if (pool.length === 1) return pool[0]

    let bag = bags[key]
    // 池子可能随时段变化：把袋子里已不属于当前池的动作剔掉，
    // 否则会吐出上一时段的动作（2026-11-19 单测抓到）
    if (bag !== undefined) {
      const allowed = new Set(pool)
      bag = bag.filter((id) => allowed.has(id))
      bags[key] = bag
    }
    if (bag === undefined || bag.length === 0) {
      bag = [...pool]
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = bag[i] as string
        bag[i] = bag[j] as string
        bag[j] = t
      }
      // 新一轮第一个别撞上一轮最后一个
      if (bag[0] === lastPicked[key]) {
        const t = bag[0] as string
        bag[0] = bag[1] as string
        bag[1] = t
      }
      bags[key] = bag
    }
    const picked = bag.shift()
    if (picked !== undefined) lastPicked[key] = picked
    return picked
  }

  return {
    pick,
    bagOf: (key) => bags[key] ?? [],
  }
}

/** 一次待机轮换的决策输入 */
export interface RotationInput {
  /** 当前正在播的动作 */
  lastTarget: string
  /** 当前时段/在场对应的待机池（已按素材存在性过滤） */
  pool: readonly string[]
  /** 自娱池 */
  activities: readonly string[]
  /** 已经轮换过几次（每 3 次插一段自娱） */
  rotations: number
  /** 基础待机动作 */
  idleId: string
}

export interface RotationDecision {
  /** 要播的动作；undefined 表示这次不播（比如正在说话/状态动作） */
  play?: string
  /** 轮换计数 */
  rotations: number
  /** 是否要重新排下一次轮换（任何情况都必须重排，否则轮换会停摆） */
  reschedule: boolean
}

/**
 * 待机轮换决策（纯函数，可单测）。
 *
 * 关键约束：**永远 reschedule**。
 * 之前的实现遇到"当前不是待机状态"或"池子只有 1 个"就直接 return，
 * 定时器从此不再重排 → 待机动作永久卡在同一个上（2026-11-19 用户反馈）。
 */
export function decideIdleRotation(input: RotationInput, pick: (ids: readonly string[], key: string) => string | undefined): RotationDecision {
  const { lastTarget, pool, activities, idleId } = input
  let rotations = input.rotations
  if (pool.length === 0) return { rotations, reschedule: true }

  const idling = lastTarget === idleId || pool.includes(lastTarget) || activities.includes(lastTarget)
  if (!idling) return { rotations, reschedule: true }

  rotations += 1
  if (activities.length > 0 && rotations % 3 === 0) {
    const picked = pick(activities, 'activity')
    if (picked !== undefined) return { play: picked, rotations, reschedule: true }
  }
  const next = pool.length <= 1 ? pool[0] : (pick(pool, 'idle') ?? idleId)
  return { play: next ?? idleId, rotations, reschedule: true }
}

/**
 * 防止"同一个动作连续播好几轮"：
 * 洗牌袋与"进入待机时抽一次"共用袋子，偶尔会出现 pick 回来正好等于当前动作，
 * 调用方若直接跳过播放，就会让这个动作再显示一整轮（表现成连续重复 2–3 次）。
 * 这里保证返回值与 lastTarget 不同（池子只有一个时除外）。
 */
export function avoidSame(play: string | undefined, lastTarget: string, pool: readonly string[], pick: (ids: readonly string[], key: string) => string | undefined): string | undefined {
  if (play !== lastTarget) return play
  if (pool.length <= 1) return pool[0]
  const others = pool.filter((id) => id !== lastTarget)
  return pick(others, 'idle') ?? others[0]
}
