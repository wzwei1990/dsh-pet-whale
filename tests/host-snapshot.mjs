import test from 'node:test'
import assert from 'node:assert/strict'
import { currentSessionId, partialTextOf, partialHasToolCall } from '../src/client/host-snapshot.ts'

test('0.1.5 current 包含未选中状态，优先于主视图持有记录', () => {
  const byId = { a: { retainedBy: { mainView: 1 } } }
  assert.equal(currentSessionId({ current: 'b', byId }), 'b')
  assert.equal(currentSessionId({ current: undefined, byId }), undefined)
})

test('0.1.7 只接受 mainView 的正持有计数', () => {
  assert.equal(currentSessionId({ byId: {
    a: undefined, b: { retainedBy: { other: 1, mainView: 0 } },
    c: { retainedBy: { mainView: -1 } }, d: { retainedBy: { mainView: 2 } },
  } }), 'd')
  assert.equal(currentSessionId({}), undefined)
  assert.equal(currentSessionId({ byId: { a: {} } }), undefined)
})

test('缺失或损坏的流式输入返回空结果', () => {
  for (const partial of [null, undefined, 3, 'text', {}, { blocks: null }, { blocks: {} }]) {
    assert.equal(partialTextOf(partial), '')
    assert.equal(partialHasToolCall(partial), false)
  }
})

test('混合流式块只拼文本与推理，独立识别工具块', () => {
  const partial = { blocks: [null, 1, 'ignored', { kind: 'text', text: '正文' },
    { kind: 'reasoning', text: '思考' }, { kind: 'text', text: 42 },
    { kind: 'image', text: '忽略' }, { kind: 'tool-call' }] }
  assert.equal(partialTextOf(partial), '正文 思考')
  assert.equal(partialHasToolCall(partial), true)
  assert.equal(partialHasToolCall({ blocks: [{ kind: 'text', text: 'tool-call' }] }), false)
})
