// 自制 Live2D 模型宠物（PSD2Live 导出物，走 p2l 运行时）。
//
// 与 `./index.ts` 的区别：
// - `./index.ts` 是 pixi-live2d-display 那套，只能跑旧 moc3（如 Haru），且渲染新 moc3 会崩
// - 这里用 PSD2Live 导出的 web 运行时（p2l.js + p2l_runtime.wasm + *.p2lrt），自带
//   lipSync / lookAt / hitTest，正好是桌宠要的能力
//
// 资产：把 PSD2Live `project_export_target(target=web)` 的 4 个文件放进
//   assets/live2d/own/{p2l.js, p2l_runtime.wasm, <model>.p2lrt}
// 联调时可用 localStorage 覆盖：
//   pet-whale:p2l-base   = http://127.0.0.1:5203/     （资产根）
//   pet-whale:p2l-model  = Generated_artwork.p2lrt    （模型文件名）
import type { PetModule } from '../types'
import { createP2LPlayer, type P2LPlayerLike } from './p2l'
import { startTtsBridge, type TtsBridge } from './tts'

const BASE_KEY = 'pet-whale:p2l-base'
const MODEL_KEY = 'pet-whale:p2l-model'

function readStore(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

/** 表情名 → 中文提示（PSD2Live 导出的是 smile/sad/angry/surprised/shy/gloom） */
const EXPRESSIONS = ['smile', 'sad', 'angry', 'surprised', 'shy', 'gloom'] as const

export const live2dOwnPet: PetModule = {
  id: 'live2d-own',
  name: { zh: '大肥鱼', en: 'Big Fat Fish' },
  icon: '🐟',
  html: '',
  css: `
    .pwh-p2l-canvas { outline: none; }
  `,
  size: { w: 240, h: 380 },
  idleDrift: false,
  mount: (el) => {
    const base = readStore(BASE_KEY, '/pet-whale/live2d/own/')
    // 部署名是 own.p2lrt（package_assets.mjs 会把导出物统一改名成 <name>.p2lrt），
    // 不要再写 PSD2Live 的导出原名 Generated_artwork.p2lrt——那样会 404、播放器起不来。
    const model = readStore(MODEL_KEY, 'own.p2lrt')
    const canvas = document.createElement('canvas')
    canvas.className = 'pwh-p2l-canvas'
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none'
    // p2l 运行时按 **canvas 的像素尺寸** 渲染（创建后不再自己改），只给 CSS 尺寸会停在 300×150 的默认值。
    // 所以在 create 之前按显示尺寸 × dpr 设置 backing store（2026-11 实测：只设 CSS → 画布不变大）。
    {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const box = el.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round((box.width || 240) * dpr))
      canvas.height = Math.max(1, Math.round((box.height || 380) * dpr))
    }
    el.appendChild(canvas)

    let player: P2LPlayerLike | null = null
    let disposed = false
    let mouthRaf = 0
    let mouthTarget = 0
    let mouthValue = 0
    let tts: TtsBridge | null = null

    const onClick = (event: MouseEvent): void => {
      if (!player || event.button !== 0) return
      // 命中部位：头 → 点头；其它 → 摇一摇，权当反馈
      const hit = player.hitTest(event.clientX, event.clientY)
      player.play(hit === 'Head' ? 'Nod' : 'Shake')
    }
    const onMove = (event: PointerEvent): void => {
      if (!player) return
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      player.lookAt(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2)
    }
    const onLeave = (): void => player?.lookAt(0, 0)

    el.addEventListener('click', onClick)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    // 口型平滑：外部（dsh-tts 等）设置 window 上的目标值，这里每帧逼近
    const stepMouth = (): void => {
      if (disposed) return
      mouthValue += (mouthTarget - mouthValue) * 0.35
      if (Math.abs(mouthTarget - mouthValue) < 0.005) mouthValue = mouthTarget
      try {
        player?.lipSync(mouthValue)
      } catch {
        /* 播放器还没就绪 */
      }
      mouthRaf = requestAnimationFrame(stepMouth)
    }

    void (async () => {
      try {
        player = await createP2LPlayer(canvas, { base, model })
        if (disposed) return
        player.play('Idle')
        // 供外部（tts 驱动）使用
        ;(window as unknown as { __petWhaleP2L?: unknown }).__petWhaleP2L = {
          player,
          setMouth: (v: number) => {
            mouthTarget = Math.max(0, Math.min(1, Number(v) || 0))
          },
          play: (id: string) => player?.play(id),
          expression: (id: string) => player?.expression(id),
          expressions: [...EXPRESSIONS],
        }
        mouthRaf = requestAnimationFrame(stepMouth)
        // dsh-tts → 口型：装了就自动跟随，没装就静默停用
        tts = startTtsBridge((level) => {
          mouthTarget = level
        })
      } catch (error) {
        console.error('[pet-whale] p2l 模型加载失败：', error)
      }
    })()

    return () => {
      disposed = true
      cancelAnimationFrame(mouthRaf)
      tts?.stop()
      tts = null
      el.removeEventListener('click', onClick)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      delete (window as unknown as { __petWhaleP2L?: unknown }).__petWhaleP2L
      canvas.remove()
      player = null
    }
  },
}
