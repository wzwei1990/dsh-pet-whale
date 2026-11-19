/** 状态机单测：重启后快照卡在 running 时要能自己回待机（2026-11-19 用户反馈） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WhaleDriver, STALE_RUNNING_MS } from '../lib/state.mjs'

const base = { running: true, partial: null, runningCalls: [], lastAgentError: null, openError: null }

test('running 但长时间没有信号 → 回落 idle（重启后卡住的典型场景）', () => {
  const d = new WhaleDriver()
  d.prime(base)
  assert.equal(d.step(base, 0).state, 'think', '刚开始应进入思考')
  const later = d.step(base, STALE_RUNNING_MS + 1000)
  assert.equal(later.state, 'idle', '超过 30 秒无信号应回待机')
})

test('有工具在跑时不会因为超时回 idle', () => {
  const d = new WhaleDriver()
  const snap = { ...base, runningCalls: [{}] }
  d.prime(snap)
  assert.equal(d.step(snap, 0).state, 'working')
  const later = d.step(snap, 120_000)
  assert.equal(later.state, 'working', '工具还在跑就不该回待机')
})

test('流式文本持续变化时保持 think', () => {
  const d = new WhaleDriver()
  let partial = ''
  d.prime({ ...base, partial: '' })
  let now = 0
  for (const chunk of ['今', '今天', '今天写', '今天写点']) {
    now += 10_000
    partial = chunk
    const r = d.step({ ...base, partial }, now)
    assert.equal(r.state, 'think', `t=${now}ms 仍应思考`)
  }
})

test('回合结束（running=false）不再保持 working（会先庆祝再回待机）', () => {
  const d = new WhaleDriver()
  const busy = { ...base, runningCalls: [{}] }
  d.prime(busy)
  d.step(busy, 0)
  const r = d.step({ ...base, running: false }, 1000)
  assert.notEqual(r.state, 'working', '回合结束不应继续 working')
})

test('reset 清掉瞬态：切会话后不继承上一轮的庆祝', () => {
  const d = new WhaleDriver()
  const busy = { ...base, runningCalls: [{}] }
  d.prime(busy)
  d.step(busy, 0)
  const done = d.step({ ...base, running: false }, 1000)
  assert.equal(done.state, 'celebrate', '刚跑完应先庆祝')
  d.reset()
  d.prime({ ...base, running: false })
  assert.notEqual(d.step({ ...base, running: false }, 2000).state, 'celebrate', 'reset 后不应继承庆祝')
})
