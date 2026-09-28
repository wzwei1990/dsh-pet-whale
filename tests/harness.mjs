import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

export function observable(get) {
  const subs = new Set()
  return { getSnapshot: get, subscribe(fn) { subs.add(fn); return () => subs.delete(fn) },
    notify() { for (const fn of [...subs]) fn() }, subs }
}

// 只替换时钟和宿主输入；执行 npm 实际分发的 client bundle。
export function harness(options = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
  })
  const w = dom.window
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  Object.defineProperty(w.navigator, 'language', { value: 'zh-CN' })
  Object.defineProperty(w.navigator, 'languages', { value: ['zh-CN'] })
  let now = 10000, sequence = 0
  const jobs = new Map()
  w.performance.now = () => now
  w.Date.now = () => now
  const schedule = (fn, ms, interval = 0, raf = false) => {
    const id = ++sequence
    jobs.set(id, { fn, at: now + Math.max(1, ms || 0), interval, raf })
    return id
  }
  w.setTimeout = (fn, ms) => schedule(fn, ms)
  w.clearTimeout = id => jobs.delete(id)
  w.setInterval = (fn, ms) => schedule(fn, ms, ms)
  w.clearInterval = w.clearTimeout
  w.requestAnimationFrame = fn => schedule(fn, 16, 0, true)
  w.cancelAnimationFrame = w.clearTimeout
  let executed = 0
  function tick(ms) {
    const end = now + ms
    for (;;) {
      const next = [...jobs].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      const [id, j] = next
      now = j.at
      jobs.delete(id)
      if (j.interval) jobs.set(id, { ...j, at: now + j.interval })
      if (++executed > 100000) throw new Error('定时器空转')
      j.fn(j.raf ? now : undefined)
    }
    now = end
  }
  const errors = []
  w.addEventListener('error', e => { errors.push(e.error); e.preventDefault() })
  const captures = new Map()
  w.HTMLElement.prototype.setPointerCapture = function (id) { captures.set(id, this) }
  w.HTMLElement.prototype.hasPointerCapture = function (id) { return captures.get(id) === this }
  w.HTMLElement.prototype.releasePointerCapture = function (id) { captures.delete(id) }
  const rows = {
    a: { id: 'a', displayTitle: 'A', retainedBy: { mainView: 1 } },
    b: { id: 'b', displayTitle: 'B', retainedBy: {} },
  }
  const snaps = Object.fromEntries(['a', 'b'].map(id => [id, { sessionId: id, running: false, lastAgentError: null, openError: null }]))
  const faces = Object.fromEntries(['a', 'b'].map(id => [id, observable(() => snaps[id])]))
  const chats = Object.fromEntries(['a', 'b'].map(id => [id, { legacy: { partial: null, runningCalls: [], turnEnds: new Map() } }]))
  const chatObs = Object.fromEntries(['a', 'b'].map(id => [id, observable(() => chats[id])]))
  const bindings = Object.fromEntries(['a', 'b'].map(id => [id, { sessionId: id, session: faces[id] }]))
  const list = observable(() => ({ ids: Object.keys(rows), byId: rows, phase: 'ready', projectionsBySession: {} }))
  const status = new Map(['a', 'b'].map(id => [id, { running: false, pendingInteraction: undefined }]))
  const statusObs = observable(() => status)
  const ctx = { sessions: { list, binding: id => bindings[id] },
    uiConversation: { binding: b => ({ target: () => chatObs[b.sessionId] }) },
    uiSession: { sessionStatus: statusObs } }
  for (const [k, v] of Object.entries(options.storage ?? {})) w.localStorage.setItem(k, v)
  options.setup?.(w)
  let handoff
  const load = () => {
    w.__ModuleLoader__ = { load: h => { handoff = h } }
    w.eval(readFileSync(process.env.WHALE_TEST_BUNDLE ?? new URL('../lib/client.js', import.meta.url), 'utf8'))
    return handoff.factory(() => { throw new Error('unexpected runtime require') }).apply(ctx)
  }
  const disposers = []
  const mount = () => { const d = load(); disposers.push(d); return d }
  const dispose = mount()
  const root = () => w.document.querySelector('[data-dsh-whale]')
  const pet = () => root()?.querySelector('.pet-official')
  function pointer(type, id = 1, x = 300, y = 300, target = pet(), extra = {}) {
    const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })
    Object.assign(e, { pointerId: id, pointerType: 'touch', isPrimary: true, ...extra })
    target.dispatchEvent(e)
  }
  function click(target = pet()) { target.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) }
  function menu(...labels) {
    pet().dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    for (const label of labels) {
      const b = [...root().querySelectorAll('button')].find(b => b.textContent.includes(label))
      if (!b) throw new Error(`找不到菜单 ${label}`)
      click(b)
    }
  }
  function switchTo(id) { for (const [key, row] of Object.entries(rows)) row.retainedBy = key === id ? { mainView: 1 } : {}; list.notify() }
  function close() { for (const d of disposers) d(); dom.window.close() }
  return { w, jobs, tick, errors, captures, rows, snaps, faces, chats, chatObs, bindings, list, status, statusObs,
    ctx, mount, dispose, root, pet, pointer, click, menu, switchTo, close, get executed() { return executed } }
}
