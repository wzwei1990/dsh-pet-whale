#!/usr/bin/env node
/**
 * 按需准备 Electron：装到 ~/.dsh/pet-whale/electron（不随 npm 包分发 Electron 本体）。
 * 国内默认走 npmmirror 的 Electron 二进制镜像；可用 PET_WHALE_ELECTRON_MIRROR 覆盖。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const ELECTRON_VERSION = '45.4.1'

export const cacheRoot = () => process.env.PET_WHALE_ELECTRON_DIR ?? join(homedir(), '.dsh', 'pet-whale', 'electron')
export const mirror = () => process.env.PET_WHALE_ELECTRON_MIRROR ?? 'https://npmmirror.com/mirrors/electron/'

/** 已装好的 electron 可执行文件路径；没有返回 undefined */
export function electronBinary(dir = cacheRoot()) {
  const stamp = join(dir, 'version.txt')
  if (!existsSync(stamp)) return undefined
  if (readFileSync(stamp, 'utf8').trim() !== ELECTRON_VERSION) return undefined
  const pkg = join(dir, 'node_modules', 'electron', 'dist')
  const candidates = process.platform === 'win32' ? ['electron.exe'] : process.platform === 'darwin' ? ['Electron.app/Contents/MacOS/Electron'] : ['electron']
  for (const rel of candidates) {
    const file = join(pkg, rel)
    if (existsSync(file)) return file
  }
  return undefined
}

/** 确保 Electron 就绪，返回可执行文件路径 */
export function ensureElectron({ log = console.log } = {}) {
  const existing = electronBinary()
  if (existing !== undefined) return existing
  const dir = cacheRoot()
  mkdirSync(dir, { recursive: true })
  log(`[pet-whale desktop] 安装 Electron ${ELECTRON_VERSION} 到 ${dir}`)
  execFileSync(
    'npm',
    ['install', `electron@${ELECTRON_VERSION}`, '--prefix', dir, '--no-audit', '--no-fund', '--loglevel=error'],
    // Windows 下 npm 是 .cmd，必须走 shell 才能被 execFileSync 找到
    { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ELECTRON_MIRROR: mirror() } },
  )
  // 本机 npm 可能禁用了 postinstall（ignore-scripts），二进制不会自动下载：手动跑一次
  let binary = electronBinary()
  if (binary === undefined) {
    const installer = join(dir, 'node_modules', 'electron', 'install.js')
    if (existsSync(installer)) {
      log('[pet-whale desktop] 手动下载 Electron 二进制…')
      execFileSync(process.execPath, [installer], {
        stdio: 'inherit',
        env: { ...process.env, ELECTRON_MIRROR: mirror() },
      })
    }
    binary = electronBinary()
  }
  writeFileSync(join(dir, 'version.txt'), `${ELECTRON_VERSION}\n`)
  if (binary === undefined) throw new Error('Electron 安装完成但找不到可执行文件')
  return binary
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  console.log(ensureElectron())
}
