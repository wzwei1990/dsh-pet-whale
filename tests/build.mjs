import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { root, verifyBuild } from '../scripts/verify-build.mjs'

test('构建守卫接受真实产物，拒绝错误注册、导出及依赖声明', async () => {
  await verifyBuild()
  const directory = mkdtempSync(join(root, '.build-test-'))
  try {
    mkdirSync(join(directory, 'lib'))
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    const writeManifest = () => writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
    writeManifest()
    writeFileSync(join(directory, 'lib/index.mjs'), 'export default function apply() {}')
    const bundle = readFileSync(join(root, 'lib/client.js'), 'utf8')
    writeFileSync(join(directory, 'lib/client.js'), bundle)
    await verifyBuild(directory)
    for (const code of [
      'export const apply = () => {}',
      'window.__ModuleLoader__.load({id:"wrong",factory:()=>({apply(){},inject:["sessions"]})})',
      'window.__ModuleLoader__.load({id:"pet-whale",factory:()=>({inject:["sessions"]})})',
      'window.__ModuleLoader__.load({id:"pet-whale",factory:()=>({apply(){},inject:[]})})',
    ]) {
      writeFileSync(join(directory, 'lib/client.js'), code)
      await assert.rejects(verifyBuild(directory))
    }
    writeFileSync(join(directory, 'lib/client.js'), bundle)
    manifest.dsh.client.inject = manifest.dsh.client.inject.filter(id => !id.endsWith('ui-session'))
    writeManifest()
    await assert.rejects(verifyBuild(directory), /uiSession/)
  } finally {
    // 只清理本测试创建的临时目录。
    rmSync(directory, { recursive: true, force: true })
  }
})

test('线上守卫按 manifest 检查全部 provider，包括 ui-session', { timeout: 15000 }, async () => {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  let inject = manifest.dsh.client.inject
  const server = createServer((req, res) => {
    res.end(req.url === '/' ? JSON.stringify({ id: 'pet-whale', rev: 'fixture', url: '/client.js', inject })
      : readFileSync(join(root, 'lib/client.js'), 'utf8'))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, 'scripts/verify-live.mjs'),
      `http://127.0.0.1:${server.address().port}`], { cwd: root, windowsHide: true, timeout: 10000 })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('error', reject)
    child.on('close', code => resolve({ code, output }))
  })
  try {
    const complete = await run()
    assert.equal(complete.code, 0, complete.output)
    inject = inject.filter(id => !id.endsWith('ui-session'))
    const incomplete = await run()
    assert.equal(incomplete.code, 1, incomplete.output)
    assert.match(incomplete.output, /FAIL.*manifest/)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
