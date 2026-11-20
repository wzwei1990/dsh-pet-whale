/** 素材清单一致性：池子里引用的动作必须存在、不重复，关键分类符合约定（2026-11-19） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(join(root, 'assets/sprite/dafeiyu-sprite/manifest.json'), 'utf8'))
const ids = new Set(manifest.animations.map((a) => a.id))

test('动作 id 唯一', () => {
  assert.equal(ids.size, manifest.animations.length, '存在重复的动作 id')
})

test('所有池子引用的动作都存在', () => {
  const pools = {
    talk: manifest.talk?.animationIds ?? [],
    click: manifest.click?.animationIds ?? [],
    hover: manifest.hover?.animationIds ?? [],
    activities: manifest.choreography?.activities ?? [],
    workingPool: manifest.states?.workingPool ?? [],
    ...Object.fromEntries(Object.entries(manifest.choreography?.periods ?? {}).map(([k, v]) => ['period:' + k, v])),
  }
  for (const [name, pool] of Object.entries(pools)) {
    for (const id of pool) assert.ok(ids.has(id), `${name} 引用了不存在的动作：${id}`)
    assert.equal(new Set(pool).size, pool.length, `${name} 有重复动作`)
    assert.ok(pool.length > 0, `${name} 是空池`)
  }
})

test('状态映射（含变体池）引用都存在', () => {
  for (const [key, value] of Object.entries(manifest.states ?? {})) {
    if (Array.isArray(value)) {
      for (const id of value) assert.ok(ids.has(id), `states.${key} 引用了不存在的动作：${id}`)
    } else {
      assert.ok(ids.has(value), `states.${key} 引用了不存在的动作：${value}`)
    }
  }
})

test('说话池保留对屏碎碎念与咯咯笑，且都是“动嘴”类', () => {
  const talk = manifest.talk.animationIds
  assert.ok(talk.includes('talk-mumble-screen'), '说话池应保留对屏碎碎念')
  assert.ok(talk.includes('talk-giggle'), '说话池应保留咯咯笑')
  for (const id of talk) {
    assert.match(id, /^(talk-|click-)/, `说话池里出现了不像“说话”的动作：${id}`)
  }
  assert.equal(talk.length, 2, '说话池按 A 方案只保留 2 段（素材里真正动嘴的只有这些）')
})

test('发呆/深度碎碎念已从说话池移出，归入合适分类', () => {
  const talk = manifest.talk.animationIds
  assert.ok(!talk.includes('talk-mumble-daze'), '发呆碎碎念不应在说话池')
  assert.ok(!talk.includes('talk-deep'), '深度碎碎念不应在说话池')
  const idlePools = Object.values(manifest.choreography.periods).flat()
  assert.ok(idlePools.includes('talk-mumble-daze'), '发呆碎碎念应落在待机池')
  assert.ok((manifest.choreography.activities ?? []).includes('talk-deep'), '深度碎碎念应归自娱池，不作为思考动作')
})

test('表演类动作分到自娱池，打电话归待机池', () => {
  const acts = manifest.choreography.activities
  for (const id of ['talk-sing', 'talk-clapper', 'talk-vocal']) {
    assert.ok(acts.includes(id), `${id} 应在自娱池`)
  }
  const idlePools = Object.values(manifest.choreography.periods).flat()
  assert.ok(idlePools.includes('talk-phone'), '打电话汇报应作为待机小动作')
  const talk = manifest.talk.animationIds
  for (const id of ['talk-sing', 'talk-clapper', 'talk-vocal', 'talk-phone']) {
    assert.ok(!talk.includes(id), `${id} 不应在说话池（不是说话动作）`)
  }
})

/** 读 WebP(VP8X) 画布尺寸，用于校验"网格声明 == 实际图片尺寸" */
function webpSize(file) {
  const buf = readFileSync(file)
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return null
  if (buf.toString('latin1', 12, 16) !== 'VP8X') return null
  const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16))
  const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
  return { w, h }
}

test('网格声明与图片实际尺寸一致（防串帧/裁切）', () => {
  let checked = 0
  for (const a of manifest.animations) {
    const size = webpSize(join(root, 'assets/sprite/dafeiyu-sprite', a.file))
    if (size === null) continue
    checked++
    assert.equal(size.w, a.frameWidth * a.columns, `${a.id} 宽度不符：图片 ${size.w}，声明 ${a.frameWidth * a.columns}`)
    assert.equal(size.h, a.frameHeight * a.rows, `${a.id} 高度不符：图片 ${size.h}，声明 ${a.frameHeight * a.rows}`)
    assert.equal(a.frameHeight, 360, `${a.id} 单帧高度应为 360（否则会画出上下相邻行）`)
  }
  assert.ok(checked >= 40, `只校验了 ${checked} 张，素材可能缺失`)
})

test('内容高度表：每段 bboxHeight 不超单帧高度，全局最大值一致', () => {
  let max = 0
  for (const a of manifest.animations) {
    assert.ok(typeof a.bboxHeight === 'number' && a.bboxHeight > 0, `${a.id} 缺少 bboxHeight（会导致缩放抖动）`)
    assert.ok(a.bboxHeight <= a.frameHeight, `${a.id} bboxHeight ${a.bboxHeight} 超过单帧高度 ${a.frameHeight}`)
    max = Math.max(max, a.bboxHeight)
  }
  assert.equal(manifest.maxContentHeight, max, 'maxContentHeight 必须等于所有动作的最高内容')
})
