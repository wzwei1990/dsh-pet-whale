import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampToWorkArea, computeWindowRect } from '../runtime/desktop/window-fit.mjs'

const work = { x: 0, y: 0, width: 1920, height: 1040 }

test('窗口默认贴右下角且在工作区内', () => {
  const rect = computeWindowRect({ w: 640, h: 360 }, work, 0.5)
  assert.ok(rect.width > 0 && rect.height > 0)
  assert.ok(rect.x + rect.width <= work.x + work.width)
  assert.ok(rect.y + rect.height <= work.y + work.height)
})

test('小屏幕不会超出工作区', () => {
  const small = { x: 0, y: 0, width: 800, height: 600 }
  const rect = computeWindowRect({ w: 640, h: 360 }, small, 0.5)
  assert.ok(rect.width <= small.width)
  assert.ok(rect.height <= small.height)
})

test('窗口跑到屏幕外时被钳回工作区', () => {
  const rect = clampToWorkArea({ x: -500, y: 5000, width: 400, height: 300 }, work)
  assert.ok(rect.x >= work.x)
  assert.ok(rect.y + rect.height <= work.y + work.height)
})

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

test('桌面端文件齐全且 package 脚本已声明', () => {
  for (const file of [
    'runtime/desktop/main.mjs',
    'runtime/desktop/preload.cjs',
    'runtime/desktop/index.html',
    'runtime/desktop/window-fit.mjs',
    'src/desktop/renderer.ts',
    'scripts/ensure-electron.mjs',
    'scripts/start-desktop.mjs',
    'docs/desktop.md',
  ]) {
    assert.ok(existsSync(join(repo, file)), `缺少 ${file}`)
  }
  const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts.desktop, 'node scripts/start-desktop.mjs')
  assert.ok(pkg.files.includes('runtime/desktop'))
})

test('Electron 应用清单与关键防护存在', () => {
  const app = JSON.parse(readFileSync(join(repo, 'runtime/desktop/package.json'), 'utf8'))
  assert.equal(app.main, 'main.mjs', 'Electron 需要 main 入口')
  const main = readFileSync(join(repo, 'runtime/desktop/main.mjs'), 'utf8')
  assert.match(main, /requestSingleInstanceLock/, '必须有单实例锁，避免重复启动两只')
  assert.match(main, /setIgnoreMouseEvents/, '必须有点击穿透')
  assert.match(main, /pet-whale\/api\/presence/, '必须轮询网页端状态')
  const client = readFileSync(join(repo, 'lib/client.js'), 'utf8')
  assert.match(client, /\/pet-whale\/api\/desktop/, '网页端要有桌面端开关接口')
  assert.match(client, /desktop-hidden/, '网页端要能在桌面端运行时收起自己')
})
