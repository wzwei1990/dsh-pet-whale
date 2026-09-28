// 本仓库改造后的体检：把"合并上游更新之后容易悄悄坏掉的地方"变成一条命令。
//
// 用法：pnpm pet:doctor    （只读，不改任何文件；用到的生成脚本都以 --check 模式调用）
// 注意：不能叫 "doctor"——pnpm 自带 `pnpm doctor`（检查 pnpm 自身安装），会把这个脚本挡住。
//
// 检查项：
//   1) BASE_CSS（styles.ts）里不能混进宠物私有选择器 —— 上游往 styles.ts 加宠物规则时最容易踩
//   2) 每只宠物的文件齐全、已注册，且 index.ts 里 id 与目录名一致
//   3) 宠物样式表不能定义 pw-* 关键帧，宠物之间不能重名
//   4) preview.html 的注入标记齐全，且注入区与 src 同步
//   5) preview.html 里的 V2 鲸鱼与 src/client/whale.ts 一致
//   6) lib/client.js 是否比 src/ 旧（旧了就要 pnpm build）
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const client = join(root, 'src', 'client')
const petsDir = join(client, 'pets')

let fails = 0
let warns = 0
const ok = (msg) => console.log(`OK    ${msg}`)
const warn = (msg) => { warns++; console.log(`WARN  ${msg}`) }
const bad = (msg) => { fails++; console.log(`FAIL  ${msg}`) }

/** 取文件里唯一那个模板字符串的内容。 */
const tpl = (file) => {
  const s = readFileSync(file, 'utf8')
  const a = s.indexOf('`')
  const b = s.lastIndexOf('`')
  return a >= 0 && b > a ? s.slice(a + 1, b) : ''
}

// ---------- 宠物清单 ----------
const petIds = existsSync(petsDir)
  ? readdirSync(petsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : []
if (petIds.length === 0) bad('src/client/pets/ 下没有任何宠物目录')

const registry = existsSync(join(petsDir, 'index.ts')) ? readFileSync(join(petsDir, 'index.ts'), 'utf8') : ''

/** SVG 不在 pets/<id>/markup.ts 里的宠物（生成物），回落到它的源文件，好让检查同样覆盖它 */
const MARKUP_FALLBACK = { whale: join(client, 'whale.ts') }

// ---------- 1) BASE_CSS 里不能有宠物私有选择器 ----------
const base = tpl(join(client, 'styles.ts'))
// 宠物部件类名从各自的 SVG 里动态取，加新宠物不用改这里
const partClasses = new Set()
for (const id of petIds) {
  const markup = join(petsDir, id, 'markup.ts')
  if (!existsSync(markup)) continue
  for (const m of tpl(markup).matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) partClasses.add(c)
  }
}
// 公共体系（不属于任何宠物）：小按钮、气泡框、投喂、打瞌睡、粒子层、思考滚动条
const KIT = /dsh-whale-|pat-heart|pat-press|patting|petting|edge-top|edge-bottom|pw-particle-layer|pw-water-|pw-stream-|pw-splash-|pw-drag-|pw-confetti|dsh-whale-think/
const CONTAINER = /\.pet-official\s*\{|\.pet-official svg|\.pet-official:active/
const offenders = []
base.split('\n').forEach((line, i) => {
  if (!/^\s*\[data-dsh-whale/.test(line)) return
  if (CONTAINER.test(line)) return
  if (KIT.test(line)) return // 共享部件（角标气泡、摸头按压/爱心）本就该在 BASE_CSS
  const names = [...partClasses].filter((c) => new RegExp(`\\.${c.replace(/[-]/g, '\\-')}\\b`).test(line))
  if (names.length > 0) offenders.push(`styles.ts:${i + 1} 命中宠物部件 ${names.join(',')} → ${line.trim().slice(0, 70)}`)
  else if (/\.pet-official[.\s]/.test(line) && !KIT.test(line)) offenders.push(`styles.ts:${i + 1} 宠物状态/部件规则 → ${line.trim().slice(0, 70)}`)
})
if (offenders.length === 0) ok('BASE_CSS 干净（styles.ts 里没有宠物私有选择器）')
else {
  bad(`BASE_CSS 混进了 ${offenders.length} 条宠物私有规则，应搬进 src/client/pets/<id>/styles.ts：`)
  for (const o of offenders.slice(0, 12)) console.log(`        ${o}`)
}

// ---------- 2)+3) 每只宠物 ----------
const keyframeOwners = new Map()
for (const id of petIds) {
  const dir = join(petsDir, id)
  const problems = []
  const notes = []
  if (!existsSync(join(dir, 'index.ts'))) problems.push('缺 index.ts')
  if (!existsSync(join(dir, 'styles.ts'))) problems.push('缺 styles.ts')
  if (!existsSync(join(dir, 'markup.ts'))) warn(`pets/${id} 没有 markup.ts（SVG 来自别处，例如生成物，属正常）`)
  if (!registry.includes(`./${id}`)) problems.push('没有在 pets/index.ts 里注册')
  const idx = existsSync(join(dir, 'index.ts')) ? readFileSync(join(dir, 'index.ts'), 'utf8') : ''
  if (idx && !new RegExp(`id:\\s*'${id}'`).test(idx)) problems.push(`index.ts 里的 id 与目录名 '${id}' 不一致`)
  if (existsSync(join(dir, 'text.ts'))) {
    const t = readFileSync(join(dir, 'text.ts'), 'utf8')
    if (!/\bzh\b/.test(t) || !/\ben\b/.test(t)) problems.push('text.ts 缺少 zh 或 en 文案')
  }
  if (existsSync(join(dir, 'styles.ts'))) {
    const css = tpl(join(dir, 'styles.ts'))
    // micro 声明了的原地动作，样式表里必须有对应规则，否则"声明了却不会演"（静默失效）
    const microSrc = /micro:\s*\[([^\]]*)\]/.exec(idx)
    if (microSrc) {
      const ids = [...microSrc[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
      for (const mid of ids) {
        if (!css.includes(`.micro-${mid}`)) problems.push(`micro 声明了 '${mid}'，但样式表里没有 .micro-${mid} 规则`)
      }
      if (ids.length > 0) notes.push(`${ids.length} 个原地动作（${ids.join('/')}）样式齐全`)
    }
    for (const m of css.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)) {
      const name = m[1]
      if (name.startsWith('pw-') && id !== 'whale') {
        // 鲸鱼私有表 = 上游 styles.ts 整表（1.2.4 起），pw-* 归它自己；其它宠物仍不得占用该前缀
        problems.push(`styles.ts 定义了 pw-* 关键帧 ${name}（pw-* 属于 BASE_CSS / 鲸鱼私有表）`)
      }
      if (keyframeOwners.has(name)) problems.push(`关键帧 ${name} 与宠物 ${keyframeOwners.get(name)} 重名`)
      else keyframeOwners.set(name, id)
    }
    // 行内 display:none 的部件，样式表里要显示它就必须 !important —— 这正是"御剑的剑一直不出现"的原因
    // 鲸鱼没有 pets/whale/markup.ts（SVG 是生成物），回落到 src/client/whale.ts 一起检查
    const markupFile = existsSync(join(dir, 'markup.ts')) ? join(dir, 'markup.ts') : MARKUP_FALLBACK[id]
    if (markupFile && existsSync(markupFile)) {
      const markup = tpl(markupFile)
      const hidden = new Set()
      for (const m of markup.matchAll(/<[a-zA-Z][^>]*>/g)) {
        const tag = m[0]
        if (!/style="[^"]*display\s*:\s*none/.test(tag)) continue
        const cls = /class="([^"]+)"/.exec(tag)
        if (cls) for (const c of cls[1].split(/\s+/)) if (c) hidden.add(c)
      }
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const [, selector, body] = rule
        if (!/display\s*:/.test(body) || /!important/.test(body)) continue
        for (const c of hidden) {
          if (new RegExp(`\\.${c.replace(/[-]/g, '\\-')}\\b`).test(selector)) {
            problems.push(`.${c} 在 SVG 里是行内 display:none，这里 ${selector.trim().slice(0, 40)} 的 display 少了 !important（永远压不过行内样式）`)
          }
        }
      }
    }
  }
  // 竖版盒子（h 明显大于 w）＝站立型角色：建议关掉 idle 的随机平移，
  // 否则 microSwim 会每 9~17 秒把她平移最多 ±100px/±70px，看着像"无缘无故到处飘"
  const petIndex = existsSync(join(dir, 'index.ts')) ? readFileSync(join(dir, 'index.ts'), 'utf8') : ''
  const sizeM = /size:\s*\{\s*w:\s*(\d+)\s*,\s*h:\s*(\d+)\s*\}/.exec(petIndex)
  if (sizeM) {
    const [, w, h] = sizeM.map(Number)
    if (h > w * 1.4 && !/idleDrift:\s*false/.test(petIndex)) {
      warn(`${id} 是竖版盒子（${w}×${h}，站立型）但没写 idleDrift:false —— idle 会被 microSwim 随机平移，看着像到处飘`)
    }
  }
  if (problems.length === 0) ok(`宠物 ${id}：文件齐全、已注册、关键帧无冲突${notes.length > 0 ? '，' + notes.join('；') : ''}`)
  else bad(`宠物 ${id}：${problems.join('；')}`)
}

// ---------- 4) preview.html 注入区 ----------
// 上游 1.2.3 起 preview.html 换成"直接加载插件本体 lib/client.js"的薄页面；
// 我们 fork 原来的手写游乐场及其 pet 注入标记（pet-css/pet-nodes/pet-ui-data/pet-mode-buttons）随之退役。
const preview = readFileSync(join(root, 'preview.html'), 'utf8')
if (/lib\/client\.js/.test(preview)) ok('preview.html 直接加载插件本体 lib/client.js（上游 1.2.3+ 架构）')
else bad('preview.html 没有引用 lib/client.js —— 上游版预览页应直接加载插件本体')
if (/<!-- pet-(css|nodes|ui-data|mode-buttons):begin -->/.test(preview)) warn('preview.html 仍带 pet-* 注入标记（旧游乐场版），与上游薄页面不一致')

/** 以 --check 模式跑生成脚本：只比较不写。 */
const runCheck = (script, label) => {
  try {
    const out = execFileSync(process.execPath, [join(root, 'scripts', script), '--check'], { encoding: 'utf8' })
    ok(`${label}${out.includes('OK') ? '' : `：${out.trim()}`}`)
  } catch (e) {
    bad(`${label}：${String(e.stdout || e.message).trim().split('\n').pop()}`)
  }
}
// 旧预览工具随架构变更退役：extract-whale.mjs 已由上游删除（SVG 以 src/client/whale.ts 为准）；
// sync-preview-pets.mjs 针对的是旧的手写 preview.html，不再作为体检项。

// ---------- 5.5) 行为层 class × 每只宠物的样式覆盖 ----------
// 上游加新状态时，很容易只给鲸鱼写样式；这里把"行为有、看不出"变成一条可读的提示。
const behaviourSrc = readFileSync(join(root, "src", "client", "index.ts"), "utf8")
const usedClasses = new Set()
for (const m of behaviourSrc.matchAll(/classList\.(?:add|remove|toggle)\(['"]([a-zA-Z][\w-]*)['"]/g)) usedClasses.add(m[1])
// 纯逻辑 class 不要求样式
const LOGIC_ONLY = new Set(["hidden", "dragging", "open"])
const classRe = (c) => new RegExp(`\\.${c.replace(/[-]/g, "\\-")}\\b`)
const gaps = new Map()
for (const id of petIds) {
  const css = readFileSync(join(root, "src", "client", "pets", id, "styles.ts"), "utf8")
  const lacks = [...usedClasses].filter((c) => !LOGIC_ONLY.has(c) && !classRe(c).test(base) && !classRe(c).test(css))
  if (lacks.length > 0) gaps.set(id, lacks)
}
if (gaps.size === 0) ok(`行为层 ${usedClasses.size} 个状态 class 在每只宠物里都有样式`)
else for (const [id, list] of gaps) warn(`宠物 ${id} 缺这些行为层 class 的样式（行为有、可能看不出）：${list.join(", ")}`)
// ---------- 6) 构建产物新鲜度 ----------
const libPath = join(root, 'lib', 'client.js')
if (!existsSync(libPath)) bad('lib/client.js 不存在，跑 pnpm build')
else {
  const libTime = statSync(libPath).mtimeMs
  let newest = 0
  const walk = (dir) => {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, d.name)
      if (d.isDirectory()) walk(p)
      else newest = Math.max(newest, statSync(p).mtimeMs)
    }
  }
  walk(join(root, 'src'))
  if (newest > libTime) bad('lib/client.js 比 src/ 旧，跑 pnpm build 重新构建')
  else ok('lib/client.js 比 src/ 新（构建产物不过期）')
}

console.log(`\n体检结果：${fails} 项失败，${warns} 项提示`)
process.exit(fails === 0 ? 0 : 1)
