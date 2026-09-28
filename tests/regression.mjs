import test from 'node:test'
import assert from 'node:assert/strict'
import { harness } from './harness.mjs'

function scenario(name, fn, options) {
  test(name, async () => { const h = harness(options); try { await fn(h) } finally { h.close() } })
}

scenario('第二根手指不能接管或结束拖拽', h => {
  h.pointer('pointerdown', 1)
  h.pointer('pointermove', 1, 340)
  const left = h.root().style.left
  h.pointer('pointerdown', 2, 600, 300, h.pet(), { isPrimary: false })
  h.pointer('pointermove', 2, 700)
  assert.equal(h.root().style.left, left)
  h.pointer('pointercancel', 2)
  assert.ok(h.root().classList.contains('dragging'))
  h.pointer('pointercancel', 1)
  assert.ok(!h.root().classList.contains('dragging'))
  assert.equal(h.captures.size, 0)
})
scenario('丢失 capture 后清理拖拽、边缘和长按', h => {
  h.pointer('pointerdown')
  h.pointer('pointermove', 1, -2000)
  h.pointer('lostpointercapture')
  h.tick(2500)
  assert.ok(!h.root().classList.contains('dragging'))
  assert.ok(!h.root().classList.contains('edge-left'))
  assert.ok(!h.pet().classList.contains('impatient'))
})
scenario('capture 不可用也能由 window 收到松手', h => {
  h.pet().setPointerCapture = () => { throw new Error('capture unavailable') }
  h.pointer('pointerdown')
  h.pointer('pointermove', 1, 340)
  h.pointer('pointerup', 1, 340, 300, h.w)
  h.tick(1000)
  assert.equal(h.errors.length, 0)
  assert.ok(!h.root().classList.contains('dragging'))
  assert.ok(!h.pet().classList.contains('petting'))
})
scenario('卸载时取消长按和全部 timer/rAF', h => {
  h.pointer('pointerdown')
  h.dispose()
  assert.equal(h.jobs.size, 0)
  h.tick(3000)
  assert.equal(h.jobs.size, 0)
  assert.equal(h.captures.size, 0)
})
scenario('重复加载停止旧实例，旧 disposer 不影响新实例', h => {
  h.mount()
  assert.equal(h.list.subs.size, 1)
  assert.equal(h.faces.a.subs.size, 1)
  assert.equal(h.statusObs.subs.size, 1)
  h.dispose()
  h.snaps.a.running = true; h.faces.a.notify()
  assert.ok(h.pet().classList.contains('think'))
})
scenario('切换 session 后错误瞬态不复活', h => {
  h.snaps.a.lastAgentError = 'boom'; h.faces.a.notify()
  h.switchTo('b')
  h.faces.b.notify()
  assert.ok(h.pet().classList.contains('idle'))
  h.tick(4200)
  assert.ok(!h.pet().classList.contains('disappointed'))
})
scenario('working 粘滞到期后没有 24ms 空转', h => {
  h.snaps.a.running = true
  h.chats.a.legacy.runningCalls = [{}]; h.faces.a.notify()
  h.chats.a.legacy.runningCalls = []; h.chatObs.a.notify()
  h.tick(2600)
  assert.ok(h.pet().classList.contains('think'))
  const before = h.executed
  h.tick(1000)
  assert.ok(h.executed - before < 5, `空转 ${h.executed - before} 次`)
})
scenario('等待确认期间到期的错误不会持续空转', h => {
  h.snaps.a.lastAgentError = 'boom'; h.faces.a.notify()
  h.status.set('a', { running: true, pendingInteraction: {} }); h.statusObs.notify()
  h.tick(7000)
  const before = h.executed; h.tick(1000)
  assert.ok(h.executed - before < 5)
})
scenario('安抚立即去掉失落，而不是等旧 deadline', h => {
  h.snaps.a.lastAgentError = 'boom'; h.faces.a.notify(); h.tick(4050)
  assert.ok(h.pet().classList.contains('disappointed'))
  h.click()
  assert.ok(!h.pet().classList.contains('disappointed'))
  assert.ok(h.pet().classList.contains('joy'))
})
scenario('连续戳不被上一次动画 timer 提前截断', h => {
  h.w.Math.random = () => 0.1
  h.click(); h.tick(300); h.click(); h.tick(200)
  assert.ok(h.pet().classList.contains('squish'))
  h.tick(260); assert.ok(!h.pet().classList.contains('squish'))
})
scenario('摸头中开始拖拽，旧摸头回调不能再次压头', h => {
  h.menu('摸摸头')
  h.pointer('pointerdown'); h.pointer('pointermove', 1, 340)
  h.tick(600)
  assert.ok(!h.pet().classList.contains('pat-press'))
  assert.ok(!h.pet().classList.contains('petting'))
})
scenario('关闭假装工作立即恢复真实 running 状态', h => {
  h.snaps.a.running = true; h.faces.a.notify()
  h.menu('假装工作'); h.menu('假装工作')
  assert.ok(h.pet().classList.contains('think'))
})
scenario('长按开始摸头后转为拖动会立即停止摸头', h => {
  h.pointer('pointerdown'); h.tick(750)
  assert.ok(h.pet().classList.contains('petting'))
  h.pointer('pointermove', 1, 340); h.tick(600)
  assert.ok(!h.pet().classList.contains('petting'))
  assert.ok(!h.pet().classList.contains('pat-press'))
})
scenario('未选中 session 时仍庆祝后台完成', h => {
  h.switchTo(undefined)
  h.status.set('b', { running: true }); h.statusObs.notify()
  h.status.set('b', { running: false }); h.statusObs.notify()
  assert.ok(h.pet().classList.contains('celebrate'))
  h.tick(2600); assert.ok(h.pet().classList.contains('idle'))
})
scenario('列表补齐子代理元数据后角标立即刷新', h => {
  h.status.set('b', { running: true }); h.statusObs.notify()
  assert.equal(h.root().querySelector('.dsh-whale-badge').textContent, '1')
  h.rows.b.parentId = 'a'; h.list.notify()
  assert.equal(h.root().querySelector('.dsh-whale-badge').hidden, true)
})
scenario('过期后台记录移除后重新出现不误庆祝', h => {
  h.status.set('b', { running: true }); h.statusObs.notify()
  h.status.delete('b'); h.statusObs.notify()
  h.status.set('b', { running: false }); h.statusObs.notify()
  assert.ok(h.pet().classList.contains('idle'))
})
scenario('隐藏后 badge 和 ticker 不继续跑 rAF', h => {
  h.snaps.a.running = true; h.chats.a.legacy.partial = { blocks: [{ kind: 'text', text: 'test' }] }; h.faces.a.notify()
  h.status.set('b', { running: true }); h.statusObs.notify()
  h.menu('隐藏到右下角'); h.tick(32)
  assert.equal([...h.jobs.values()].filter(j => j.raf).length, 0)
})
scenario('AudioContext 构造失败不打断 pointerdown', h => {
  h.pointer('pointerdown')
  assert.equal(h.errors.length, 0)
}, { setup(w) { w.AudioContext = class { constructor() { throw new Error('audio blocked') } } } })

scenario('直接移除根 DOM 后自动注销全部资源', async h => {
  h.pointer('pointerdown'); h.root().remove()
  await Promise.resolve()
  assert.equal(h.jobs.size, 0)
  assert.equal(h.list.subs.size, 0)
  assert.equal(h.statusObs.subs.size, 0)
})
scenario('卸载与重挂后不残留通知、粒子或延迟投喂', h => {
  h.menu('投喂'); h.dispose(); h.tick(1000)
  assert.equal(h.jobs.size, 0)
  assert.equal(h.w.document.querySelector('[data-dsh-whale-particles]'), null)
  h.mount(); h.dispose(); h.mount()
  assert.equal(h.list.subs.size, 1)
})
scenario('小按钮拒绝第二指针并在 cancel 后释放 capture', h => {
  h.menu('隐藏到右下角')
  const mini = h.w.document.querySelector('[data-dsh-whale-mini]')
  h.pointer('pointerdown', 1, 600, 500, mini)
  h.pointer('pointermove', 1, 560, 500, mini)
  const before = mini.style.right
  h.pointer('pointerdown', 2, 600, 500, mini, { isPrimary: false })
  h.pointer('pointermove', 2, 800, 500, mini)
  assert.equal(mini.style.right, before)
  h.pointer('pointercancel', 2, 800, 500, mini)
  assert.ok(mini.classList.contains('dragging'))
  h.pointer('pointercancel', 1, 560, 500, mini)
  assert.ok(!mini.classList.contains('dragging'))
  assert.equal(h.captures.size, 0)
  h.tick(500); h.click(mini)
  assert.ok(h.root().classList.contains('hidden'))
})
scenario('窗口失焦与快速重抓均能恢复', h => {
  h.pointer('pointerdown'); h.pointer('pointermove', 1, -2000)
  h.w.dispatchEvent(new h.w.Event('blur'))
  assert.ok(!h.root().classList.contains('dragging'))
  h.pointer('pointerdown', 2); h.pointer('pointerup', 2); h.click()
  assert.ok(['squish', 'dizzy', 'rolling'].some(c => h.pet().classList.contains(c)))
})
scenario('视口比鲸鱼窄时只标记一侧边缘', h => {
  h.w.innerWidth = 100
  h.pointer('pointerdown'); h.pointer('pointermove', 1, 340)
  assert.ok(h.root().classList.contains('edge-left'))
  assert.ok(!h.root().classList.contains('edge-right'))
})
scenario('下潜中断恢复 opacity，轨迹每帧不越界', h => {
  h.w.Math.random = () => 0.1
  h.root().style.top = `${h.w.innerHeight - 101}px`
  h.tick(2400)
  assert.ok(h.root().classList.contains('swimming'))
  for (let i = 0; i < 10; i++) {
    h.tick(40)
    assert.ok(parseFloat(h.root().style.top) <= h.w.innerHeight - 101)
  }
  h.pointer('pointerdown')
  assert.equal(h.pet().style.opacity, '1')
}, { storage: { 'pet-whale:swim': '1' } })
scenario('新回合立即覆盖上一回合的庆祝', h => {
  h.snaps.a.running = true; h.faces.a.notify()
  h.snaps.a.running = false; h.faces.a.notify()
  assert.ok(h.pet().classList.contains('celebrate'))
  h.snaps.a.running = true; h.faces.a.notify()
  assert.ok(h.pet().classList.contains('think'))
})
scenario('相同 idle 快照不反复推迟游泳启动', h => {
  for (let i = 0; i < 5; i++) { h.tick(1000); h.faces.a.notify() }
  assert.ok(h.root().classList.contains('swimming'))
}, { storage: { 'pet-whale:swim': '1' }, setup(w) { w.Math.random = () => 0.9 } })
scenario('AudioContext resume 拒绝不会产生未处理 rejection', async h => {
  h.pointer('pointerdown')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(h.errors.length, 0)
}, { setup(w) {
  w.AudioContext = class {
    state = 'suspended'
    createGain() { return { gain: {}, connect() {} } }
    resume() { return Promise.reject(new Error('blocked resume')) }
    close() { return Promise.resolve() }
  }
} })
scenario('通知权限在卸载后返回不能重建菜单或写入偏好', async h => {
  h.menu('更多设置', '行为', '系统通知')
  h.dispose()
  h.w.resolvePermission('granted')
  await Promise.resolve()
  assert.equal(h.w.localStorage.getItem('pet-whale:sys-notify'), null)
  assert.equal(h.jobs.size, 0)
}, { setup(w) {
  w.Notification = class {
    static permission = 'default'
    static requestPermission() { return new Promise(resolve => { w.resolvePermission = resolve }) }
  }
} })
scenario('剪贴板不可用不能谎报复制成功', async h => {
  h.snaps.a.lastAgentError = 'boom'; h.faces.a.notify(); h.click()
  await Promise.resolve()
  assert.ok(!h.root().querySelector('.dsh-whale-dialog').textContent.includes('已复制'))
})
scenario('后台动画快照不能重新开启 ticker，回来恢复', h => {
  h.snaps.a.running = true
  h.chats.a.legacy.partial = { blocks: [{ kind: 'text', text: 'thinking' }] }
  h.faces.a.notify()
  let hidden = true
  Object.defineProperty(h.w.document, 'hidden', { get: () => hidden })
  h.w.document.dispatchEvent(new h.w.Event('visibilitychange'))
  h.faces.a.notify(); h.tick(32)
  assert.equal([...h.jobs.values()].filter(j => j.raf).length, 0)
  hidden = false; h.w.document.dispatchEvent(new h.w.Event('visibilitychange'))
  assert.ok(h.root().querySelector('[data-dsh-whale-think]').classList.contains('show'))
})
scenario('剪贴板拒绝不会谎报成功或产生未处理 rejection', async h => {
  h.snaps.a.lastAgentError = 'boom'; h.faces.a.notify(); h.click()
  await new Promise(resolve => setImmediate(resolve))
  assert.match(h.root().querySelector('.dsh-whale-dialog').textContent, /复制失败/)
}, { setup(w) {
  Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } })
} })
scenario('卸载会关闭已经发出的系统通知', h => {
  Object.defineProperty(h.w.document, 'hidden', { value: true })
  h.snaps.a.running = true; h.faces.a.notify()
  h.snaps.a.running = false; h.faces.a.notify()
  assert.equal(h.w.notifications.length, 1)
  h.dispose()
  assert.equal(h.w.notifications[0].closed, true)
  assert.equal(h.jobs.size, 0)
}, { storage: { 'pet-whale:sys-notify': '1' }, setup(w) {
  w.notifications = []
  w.Notification = class {
    static permission = 'granted'
    constructor() { w.notifications.push(this) }
    close() { this.closed = true }
  }
} })
