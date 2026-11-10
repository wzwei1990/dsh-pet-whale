// dsh-tts → 桌宠口型桥。
//
// 契约（dsh-tts 服务端，2026-11 确认）：
//   GET /dsh-tts/api/pending?since=<cursor>  →  { items: Utterance[], cursor }
//   Utterance = { seq, text, source, rate?, volume?, audioUrl?, durationMs?, createdAt }
//
// 设计：
// - 不依赖跨插件 API（ctx.provide('dshTts') 是 Node 侧服务，浏览器里拿不到），
//   改用 dsh-tts 自己暴露的 HTTP 轮询端点，插件之间零耦合。
// - 只取「比上次游标更新」的条目，游标存 localStorage，刷新后不重复张嘴。
// - 每条按 durationMs 跑一个音量包络；没有 durationMs 就按文本长度估。
// - dsh-tts 没装（404）时静默停用，不报错。

export interface TtsUtterance {
  seq: number
  text: string
  source?: string
  audioUrl?: string
  durationMs?: number
  createdAt?: number
}

export interface TtsBridge {
  /** 停止轮询 */
  stop: () => void
}

const CURSOR_KEY = 'pet-whale:tts-cursor'
const POLL_MS = 1200

function readCursor(): number {
  try {
    return Number(localStorage.getItem(CURSOR_KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

function writeCursor(value: number): void {
  try {
    localStorage.setItem(CURSOR_KEY, String(value))
  } catch {
    /* 忽略 */
  }
}

/** 按文本估时长（没有 durationMs 时的兜底）：中文约 5 字/秒 */
function estimateDuration(text: string): number {
  const chars = [...(text ?? '')].length
  return Math.max(600, Math.round((chars / 5) * 1000))
}

/**
 * 启动口型桥：每 POLL_MS 拉一次待播队列，把「正在说」的包络喂给 onLevel(0..1)。
 * @param onLevel 音量包络回调（桌宠渲染侧接到 player.lipSync）
 */
export function startTtsBridge(onLevel: (level: number) => void): TtsBridge {
  let cursor = readCursor()
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let envelopeTimer: ReturnType<typeof setInterval> | null = null
  let speaking = false
  let disabled = false

  const stopEnvelope = (): void => {
    if (envelopeTimer) clearInterval(envelopeTimer)
    envelopeTimer = null
    speaking = false
  }

  /** 按 durationMs 跑包络：三个不同频率的正弦叠加，模拟开口大小变化 */
  const speak = (durationMs: number): void => {
    stopEnvelope()
    const start = performance.now()
    speaking = true
    envelopeTimer = setInterval(() => {
      const elapsed = performance.now() - start
      if (elapsed >= durationMs) {
        stopEnvelope()
        onLevel(0)
        return
      }
      const t = elapsed / 1000
      // 起音/收尾各留 120ms 的斜坡，避免生硬
      const ramp = Math.min(1, elapsed / 120, (durationMs - elapsed) / 120)
      const raw = 0.45 + 0.35 * Math.abs(Math.sin(t * 11)) + 0.2 * Math.abs(Math.sin(t * 27))
      onLevel(Math.max(0, Math.min(1, raw * ramp)))
    }, 40)
  }

  const poll = async (): Promise<void> => {
    if (stopped || disabled) return
    if (document.visibilityState === 'hidden') {
      timer = setTimeout(poll, POLL_MS * 3)
      return
    }
    try {
      const res = await fetch(`/dsh-tts/api/pending?since=${cursor}`, { headers: { Accept: 'application/json' } })
      if (res.status === 404 || res.status === 501) {
        // 没装 dsh-tts
        disabled = true
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { items?: TtsUtterance[]; cursor?: number }
      const items = data.items ?? []
      for (const item of items) {
        // 只对"要说的话"开口型；试听/系统提示不动嘴
        if (item.source && item.source !== 'agent' && item.source !== 'bili' && item.source !== 'napcat' && item.source !== 'live') continue
        if (!speaking) speak(item.durationMs ?? estimateDuration(item.text))
      }
      if (typeof data.cursor === 'number' && data.cursor > cursor) {
        cursor = data.cursor
        writeCursor(cursor)
      }
    } catch {
      // 网络抖动/插件未启用：下一轮再试，不打扰用户
    } finally {
      if (!stopped && !disabled) timer = setTimeout(poll, POLL_MS)
    }
  }

  void poll()

  return {
    stop: () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stopEnvelope()
      onLevel(0)
    },
  }
}
