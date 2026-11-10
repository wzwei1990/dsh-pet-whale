// 把 PSD2Live 的 web 导出物收进插件 assets，供 p2l 运行时加载。
//
// 用法：node tools/live2d/package_assets.mjs <导出目录> [模型名]
//   node tools/live2d/package_assets.mjs E:/dsnworkspace/dsh-live2d-own/export-web own
//
// 产物：assets/live2d/<模型名>/{p2l.js, p2l_runtime.wasm, <模型名>.p2lrt}
// 注意：p2l.js / p2l_runtime.wasm 是 PSD2Live 的伴随产物，发布前确认许可证（见 README）。
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const srcDir = process.argv[2]
const modelName = process.argv[3] || 'own'

if (!srcDir) {
  console.error('用法：node tools/live2d/package_assets.mjs <导出目录> [模型名]')
  process.exit(1)
}
const src = resolve(srcDir)
if (!existsSync(src)) {
  console.error('导出目录不存在：', src)
  process.exit(1)
}

const dst = join(repoRoot, 'assets', 'live2d', modelName)
mkdirSync(dst, { recursive: true })

const needed = ['index.html', 'p2l.js', 'p2l_runtime.wasm']
let p2lrt = null
for (const name of readdirSync(src)) {
  if (name.endsWith('.p2lrt')) p2lrt = name
}
if (!p2lrt) {
  console.error('导出目录里没有 .p2lrt，确认 PSD2Live 导出的是 target=web')
  process.exit(1)
}

for (const name of [...needed, p2lrt]) {
  const from = join(src, name)
  if (!existsSync(from)) {
    console.warn('缺文件，跳过：', name)
    continue
  }
  const to = join(dst, name)
  copyFileSync(from, to)
  console.log(`  ${name.padEnd(28)} ${(statSync(to).size / 1024).toFixed(0)} KB`)
}

// 模型文件名统一成 <模型名>.p2lrt，方便运行时不带配置
if (basename(p2lrt) !== `${modelName}.p2lrt`) {
  renameSync(join(dst, basename(p2lrt)), join(dst, `${modelName}.p2lrt`))
}

console.log('\n已放进：', dst)
console.log(`运行时默认查找：base=/pet-whale/live2d/${modelName}/  model=${modelName}.p2lrt`)
console.log('本地联调可临时覆盖（浏览器控制台）：')
console.log(`  localStorage['pet-whale:p2l-base'] = 'http://127.0.0.1:5203/'`)
console.log(`  localStorage['pet-whale:p2l-model'] = '${p2lrt}'`)
