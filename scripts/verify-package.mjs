// 离线验收 npm 实际分发包，不调用发布，也不修改宿主安装。
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root, verifyBuild } from './verify-build.mjs'

const npmCli = [process.env.npm_execpath,
  join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')]
  .find(path => path?.endsWith('npm-cli.js') && existsSync(path))
assert.ok(npmCli, '找不到 npm CLI，请用 npm run verify:package 运行')
function run(args, cwd, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', windowsHide: true, timeout: 120000 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, `${args[1] ?? args[0]} 失败：\n${result.stdout}\n${result.stderr}`)
  return result.stdout
}

// 与项目同盘创建临时消费方，不向 C 盘安装软件或依赖。
const temporary = mkdtempSync(join(root, '.package-test-'))
const npmEnv = { ...process.env, npm_config_cache: join(temporary, 'npm-cache') }
try {
  await verifyBuild()
  // 外层 verify/prepack 已验证构建；ignore-scripts 防止递归执行 prepack。
  // npm 各版本 --json 形态不同（12.x 返回对象、旧版返回数组），本机 npm 还会在前面混入 notice 行：
  // 从第一个 { 或 [ 起解析，再把结果归一成数组。
  const packText = run([npmCli, "pack", "--ignore-scripts", "--json", "--pack-destination", temporary], root, npmEnv)
  const jsonStart = ["[", "{"].map((ch) => packText.indexOf(ch)).filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? 0
  const parsedPack = JSON.parse(packText.slice(jsonStart))
  const packed = Array.isArray(parsedPack) ? parsedPack[0] : (parsedPack.files ? parsedPack : Object.values(parsedPack)[0])
  for (const { path } of packed.files) {
    assert.match(path, /^(?:package\.json|cordis\.patch\.yml|LICENSE|README(?:\.en)?\.md|lib\/(?:index\.mjs|client\.js))$/, `非预期文件进入包：${path}`)
  }
  const consumer = join(temporary, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'whale-package-check', private: true, type: 'module' }))
  run([npmCli, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
    '--omit=dev', join(temporary, packed.filename)], consumer, npmEnv)
  const require = createRequire(join(consumer, 'package.json'))
  const hostPath = require.resolve('pet-whale')
  const clientPath = require.resolve('pet-whale/client')
  const manifestPath = require.resolve('pet-whale/package.json')
  assert.equal(typeof (await import(pathToFileURL(hostPath).href)).default, 'function')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.equal(manifest.name, 'pet-whale')
  assert.ok(existsSync(join(dirname(manifestPath), manifest.dsh.bundle.patch)))
  assert.deepEqual(readFileSync(clientPath), readFileSync(join(root, 'lib/client.js')), '包内 client 与已测产物不同')
  await verifyBuild(dirname(manifestPath))
  const regression = run(['--test', 'tests/regression.mjs'], root, { ...process.env, WHALE_TEST_BUNDLE: clientPath })
  console.log(regression.trim())
  console.log(`PASS  ${packed.filename}：公开入口、依赖注入、文件清单、字节一致性及包内交互回归`)
} finally {
  // 只清理 mkdtemp 创建、由本脚本独占的目录。
  rmSync(temporary, { recursive: true, force: true })
}
