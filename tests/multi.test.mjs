import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateVisual, backgroundPhase, badgeSummary } from '../lib/multi.mjs'

const s = (id, extra = {}) => ({ id, title: id, running: false, pending: false, failed: false, ...extra })

test('后台相位优先级：待确认 > 出错 > 在跑', () => {
  assert.equal(backgroundPhase([s('a', { running: true })]), 'working')
  assert.equal(backgroundPhase([s('a', { failed: true }), s('b', { running: true })]), 'error')
  assert.equal(backgroundPhase([s('a', { pending: true }), s('b', { failed: true })]), 'wait')
  assert.equal(backgroundPhase([]), undefined)
})

test('主会话忙时以主会话为准，空闲时被后台相位顶上', () => {
  const bg = [s('bg', { running: true })]
  assert.equal(aggregateVisual('idle', bg, true), 'working')
  assert.equal(aggregateVisual('think', bg, true), 'think')
  assert.equal(aggregateVisual('idle', bg, false), 'idle', '关闭跟随全部时不受影响')
})

test('完成态（celebrate）不被后台"在跑"压掉', () => {
  assert.equal(aggregateVisual('celebrate', [s('bg', { running: true })], true), 'working')
})

test('角标统计在跑与待确认，标题用于 tooltip', () => {
  const r = badgeSummary([s('A', { running: true }), s('B', { pending: true, running: true }), s('C')])
  assert.equal(r.count, 2)
  assert.deepEqual(r.titles, ['A', 'B'])
  assert.deepEqual(r.waiting, ['B'])
})
