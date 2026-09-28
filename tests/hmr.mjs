import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
test('HMR 校验支持不透明 rev、SSE 前置消息、相对 link、认证和内容不匹配', async () => {
  const home = mkdtempSync(join(dirname(root), 'hmr-test-'))
  const profile = join(home, 'profiles', 'audit')
  mkdirSync(join(profile, 'node_modules'), { recursive: true })
  const pkg = { dependencies: { 'pet-whale': 'link:' + relative(profile, root) },
    dsh: { profile: { bundles: ['pet-whale'] } } }
  writeFileSync(join(profile, 'package.json'), JSON.stringify(pkg))
  symlinkSync(root, join(profile, 'node_modules', 'pet-whale'), process.platform === 'win32' ? 'junction' : 'dir')
  let stale = false
  const server = createServer((req, res) => {
    if (req.url === '/?token=test-only') {
      res.writeHead(303, { 'set-cookie': 'test-auth=1; Path=/' }); res.end(); return
    }
    if (req.headers.cookie !== 'test-auth=1') { res.writeHead(401); res.end(); return }
    if (req.url === '/plugins/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.write(': connected\r\n\r\ndata: {"type":"rebuilt","id":"other"}\r\n\r\n')
      res.write('data: ' + JSON.stringify({ type: 'graph', graph: { entries: [{ id: 'pet-whale', rev: 'opaque-metadata', url: 'plugins/bundle.js' }] } }) + '\r\n\r\n')
      return
    }
    res.end(stale ? 'stale code' : readFileSync(join(root, 'lib/client.js'), 'utf8').trimEnd() + '\n;\n//# sourceMappingURL=host.map\n')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const run = args => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify-hmr.mjs', ...args], { cwd: root, windowsHide: true,
      env: { ...process.env, DSH_HOME: home, DSH_WEB_URL: `http://127.0.0.1:${server.address().port}`, DSH_WEB_TOKEN: 'test-only' } })
    let out = ''
    child.stdout.on('data', b => { out += b }); child.stderr.on('data', b => { out += b })
    child.on('error', reject); child.on('exit', code => resolve({ code, out }))
  })
  try {
    const success = await run(['--profile', 'audit'])
    assert.equal(success.code, 0, success.out)
    assert.ok(!success.out.includes('test-only'))
    stale = true
    const mismatch = await run(['--profile=audit'])
    assert.equal(mismatch.code, 1, mismatch.out)
    assert.match(mismatch.out, /内容与本地不一致/)
    stale = false
    pkg.dsh.profile.bundles = []
    writeFileSync(join(profile, 'package.json'), JSON.stringify(pkg))
    const disabled = await run(['--profile=audit'])
    assert.equal(disabled.code, 1, disabled.out)
    assert.match(disabled.out, /FAIL.*bundles/)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
