#!/usr/bin/env node
/** 启动桌面端桌宠：确保 Electron → 起 runtime/desktop。 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureElectron } from './ensure-electron.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const appDir = join(root, 'runtime', 'desktop')

const binary = ensureElectron()
const child = spawn(binary, [appDir, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PET_WHALE_ROOT: root },
})
child.on('exit', (code) => process.exit(code ?? 0))
