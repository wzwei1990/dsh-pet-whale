// 校验真实产物的入口和 DSH 注册契约；可从任意工作目录运行。
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import vm from 'node:vm'

export const root = fileURLToPath(new URL('../', import.meta.url))
const providers = {
  sessions: '@deepseek-ai/dsh-api-session-controller',
  locale: '@deepseek-ai/dsh-client-locale',
  uiConversation: '@deepseek-ai/dsh-client-ui-conversation',
  uiSession: '@deepseek-ai/dsh-client-ui-session',
}

export async function verifyBuild(directory = root) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
  for (const file of ['lib/index.mjs', 'lib/client.js']) {
    assert.ok(statSync(resolve(directory, file)).size > 0, `${file} 为空`)
  }
  const host = await import(pathToFileURL(resolve(directory, 'lib/index.mjs')).href)
  assert.equal(typeof host.default, 'function', 'Node 入口缺少默认 apply')
  const registrations = []
  const code = readFileSync(resolve(directory, 'lib/client.js'), 'utf8')
  // 实际求值能发现顶层 ESM、包装语法错误和注册缺失。
  vm.runInNewContext(code, { window: { __ModuleLoader__: { load: value => registrations.push(value) } } },
    { timeout: 5000, filename: 'client.js' })
  assert.equal(registrations.length, 1, 'client 必须恰好注册一次')
  const registration = registrations[0]
  assert.equal(registration.id, manifest.name, 'client 注册 id 与包名不一致')
  assert.equal(typeof registration.factory, 'function', 'client 缺少 factory')
  const client = registration.factory(id => { throw new Error(`未声明的运行时 require：${id}`) })
  assert.equal(typeof client?.apply, 'function', 'client 缺少 apply')
  assert.ok(Array.isArray(client.inject) && client.inject.length > 0, 'client 缺少 inject')
  for (const service of client.inject) {
    assert.ok(providers[service], `校验器缺少服务映射：${service}`)
    assert.ok(manifest.dsh?.client?.inject?.includes(providers[service]), `manifest 缺少 ${service} 的提供方`)
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    await verifyBuild()
    console.log('PASS  Node 入口、client 注册、导出及 manifest 注入契约')
  } catch (error) {
    console.error(`构建产物验证失败：${error.message}`)
    process.exitCode = 1
  }
}
