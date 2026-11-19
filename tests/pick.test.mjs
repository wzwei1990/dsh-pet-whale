/** 洗牌袋随机挑选器单测（2026-11-19 用户要求：自测动作随机逻辑） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPoolPicker } from '../lib/pick.mjs'

const pool2 = ['a', 'b']
const pool3 = ['a', 'b', 'c']
const pool4 = ['a', 'b', 'c', 'd']

test('两段池：1000 次不出现连续重复', () => {
  const pick = createPoolPicker()
  let prev = ''
  for (let i = 0; i < 1000; i++) {
    const next = pick.pick(pool2, 'k')
    assert.notEqual(next, prev, `第 ${i} 次与上一次重复：${next}`)
    prev = next
  }
})

test('三段/四段池：每轮是完整排列，且无连续重复', () => {
  for (const pool of [pool3, pool4]) {
    const pick = createPoolPicker()
    const seq = Array.from({ length: pool.length * 200 }, () => pick.pick(pool, 'k'))
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], '不应连续重复')
    // 每 N 个一组必须恰好是池子的一个排列
    for (let i = 0; i < seq.length; i += pool.length) {
      const cycle = seq.slice(i, i + pool.length)
      assert.deepEqual([...cycle].sort(), [...pool].sort(), `第 ${i / pool.length} 轮不是完整排列`)
    }
  }
})

test('新一轮首项不等于上一轮末项（跨轮边界也不连续重复）', () => {
  const pick = createPoolPicker()
  const N = 4
  let prev = ''
  for (let i = 0; i < 500; i++) {
    const next = pick.pick(pool4, 'k')
    assert.notEqual(next, prev)
    prev = next
  }
})

test('每轮顺序是随机的（不是固定循环）', () => {
  const pick = createPoolPicker()
  const firsts = new Set()
  for (let cycle = 0; cycle < 60; cycle++) {
    const first = pick.pick(pool4, 'k')
    firsts.add(first)
    for (let i = 1; i < 4; i++) pick.pick(pool4, 'k')
  }
  assert.ok(firsts.size >= 2, `首项应有多样性，实际：${[...firsts].join(',')}`)
})

test('长期分布均匀（完整轮次内每个动作出现次数相等）', () => {
  const pick = createPoolPicker()
  const count = new Map(pool4.map((id) => [id, 0]))
  for (let i = 0; i < 4000; i++) {
    const id = pick.pick(pool4, 'k')
    count.set(id, count.get(id) + 1)
  }
  const values = [...count.values()]
  assert.equal(Math.max(...values) - Math.min(...values), 0, `分布不均：${JSON.stringify([...count])}`)
})

test('不同池互不影响', () => {
  const pick = createPoolPicker()
  const a = Array.from({ length: 8 }, () => pick.pick(pool2, 'idle'))
  const b = Array.from({ length: 8 }, () => pick.pick(pool3, 'talk'))
  assert.ok(a.every((id) => pool2.includes(id)))
  assert.ok(b.every((id) => pool3.includes(id)))
  for (let i = 1; i < a.length; i++) assert.notEqual(a[i], a[i - 1])
  for (let i = 1; i < b.length; i++) assert.notEqual(b[i], b[i - 1])
})

test('池子过滤：未知 id 不参与；单元素池直接返回；空池 undefined', () => {
  const pick = createPoolPicker((id) => id !== 'gone')
  for (let i = 0; i < 50; i++) assert.notEqual(pick.pick(['a', 'gone'], 'k'), 'gone')
  assert.equal(pick.pick(['only'], 'k'), 'only')
  assert.equal(pick.pick([], 'k'), undefined)
  assert.equal(pick.pick(undefined, 'k'), undefined)
})

test('切换池子后不会吐出旧池里的动作（时段变化场景）', () => {
  const pick = createPoolPicker()
  const dayPool = ['idle', 'talk-food', 'eat-lunch', 'talk-hum']
  const nightPool = ['state-wait', 'idle', 'idle-mirror', 'idle-fan']
  // 先按白天池抽几段（袋子会剩一部分顺序）
  for (let i = 0; i < 3; i++) pick.pick(dayPool, 'idle')
  // 切到深夜池：之后每次都必须来自 nightPool
  for (let i = 0; i < 40; i++) {
    const id = pick.pick(nightPool, 'idle')
    assert.ok(nightPool.includes(id), `切池后吐出了旧池动作：${id}`)
  }
})

// ── 待机轮换决策（之前遇到"非待机/池子只有1个"就 return，导致轮换永久停摆） ──
import { decideIdleRotation } from '../lib/pick.mjs'

const noop = () => undefined

test('轮换决策：当前不是待机动作时不播，但必须重排', () => {
  const d = decideIdleRotation({ lastTarget: 'state-think', pool: ['idle', 'a', 'b'], activities: [], rotations: 0, idleId: 'idle' }, noop)
  assert.equal(d.play, undefined)
  assert.equal(d.reschedule, true, '非待机也要重排，否则轮换永久停摆')
})

test('轮换决策：离开状态池只有 1 个动作时也要播并重排', () => {
  const d = decideIdleRotation({ lastTarget: 'idle', pool: ['state-wait'], activities: [], rotations: 0, idleId: 'idle' }, noop)
  assert.equal(d.play, 'state-wait')
  assert.equal(d.reschedule, true)
})

test('轮换决策：正常轮换取池内动作并累加计数', () => {
  const d = decideIdleRotation({ lastTarget: 'idle', pool: ['idle', 'a', 'b'], activities: [], rotations: 4, idleId: 'idle' }, (ids) => ids[1])
  assert.equal(d.play, 'a')
  assert.equal(d.rotations, 5)
  assert.equal(d.reschedule, true)
})

test('轮换决策：每第 3 次插一段自娱，之后继续排', () => {
  const d = decideIdleRotation({ lastTarget: 'idle', pool: ['idle', 'a'], activities: ['p1', 'p2'], rotations: 2, idleId: 'idle' }, (ids, key) => (key === 'activity' ? 'p2' : ids[0]))
  assert.equal(d.play, 'p2')
  assert.equal(d.rotations, 3)
  assert.equal(d.reschedule, true)
})

test('轮换决策：池子变化后只会给新池里的动作', () => {
  const d = decideIdleRotation({ lastTarget: 'idle', pool: ['state-wait', 'idle-mirror'], activities: [], rotations: 7, idleId: 'idle' }, (ids) => ids[1])
  assert.equal(d.play, 'idle-mirror')
})

import { avoidSame } from '../lib/pick.mjs'

test('轮换抽到与当前相同的动作时换一个（防连续重复多轮）', () => {
  assert.equal(avoidSame('a', 'a', ['a', 'b', 'c'], () => 'c'), 'c')
  assert.equal(avoidSame('b', 'a', ['a', 'b'], () => 'b'), 'b', '本来不同就原样返回')
  assert.equal(avoidSame('a', 'a', ['a'], () => undefined), 'a', '单元素池无法避免')
})

import { computeFit } from '../lib/pick.mjs'

test('取景缩放固定：不同包围盒的动作缩放一致（防忽大忽小）', () => {
  const idle = { x0: 100, y0: 60, w: 400, h: 300 }
  const a = computeFit({ x0: 120, y0: 40, w: 380, h: 320 }, idle, 640, 360)
  const b = computeFit({ x0: 60, y0: 100, w: 520, h: 260 }, idle, 640, 360)
  assert.equal(a.scale, b.scale, '缩放必须相同')
  assert.ok(Math.abs(a.scale - (360 * 0.92) / 300) < 1e-9, '缩放按待机包围盒计算')
})

test('取景：每段动作按自己的包围盒居中且贴底', () => {
  const idle = { x0: 100, y0: 60, w: 400, h: 300 }
  const box = { x0: 200, y0: 100, w: 200, h: 260 }
  const fit = computeFit(box, idle, 640, 360)
  const bottom = (box.y0 + box.h) * fit.scale + fit.dy
  assert.ok(Math.abs(bottom - 360 * 0.98) < 1e-6, '底部对齐')
  const center = (box.x0 + box.w / 2) * fit.scale + fit.dx
  assert.ok(Math.abs(center - 320) < 1e-6, '水平居中')
})
