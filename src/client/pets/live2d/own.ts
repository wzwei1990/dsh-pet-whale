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

/**
 * 按名字挑动作 id。
 * p2l 的 `clips` 是**动作 id**，而 PSD2Live 用内置动作 seed 出来的 id 可能是 `motion_1/2/3`，
 * 名字才是 Idle/Blink/Nod/Shake —— 硬编码 play('Idle') 会直接找不到（2026-11 实测：
 * 重新 seed 后 clips 变成 motion_1..4，桌宠就不动了）。所以这里按 id 模糊匹配，再退回第一个。
 */
function pickClip(player: P2LPlayerLike, wanted: string): string | null {
  const clips = player.clips ?? []
  if (clips.length === 0) return null
  const lower = wanted.toLowerCase()
  return (
    clips.find(id => id === wanted) ??
    clips.find(id => id.toLowerCase() === lower) ??
    clips.find(id => id.toLowerCase().includes(lower)) ??
    clips[0] ??
    null
  )
}

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
    // 重复 mount（拖拽/切宠后重挂）会残留旧 canvas → 画面上叠出"第二个模型"，
    // 所以挂载前先清掉同容器里已有的 p2l 画布。
    for (const old of Array.from(el.querySelectorAll('canvas.pwh-p2l-canvas'))) old.remove()
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

    // 挂载后把宠物容器夹回可视区：
    // 核心按「上一只宠物」的尺寸算过位置，换成更大的宠物（240×380）后会往右下溢出，
    // 实测右侧被切掉 56px（2026-11-12）。这里只修正越界，用户拖过就不动。
    {
      const root = el.parentElement
      if (root) {
        const box = root.getBoundingClientRect()
        const margin = 8
        if (box.right > window.innerWidth) {
          root.style.left = Math.max(0, Math.round(window.innerWidth - box.width - margin)) + 'px'
        }
        if (box.bottom > window.innerHeight) {
          root.style.top = Math.max(0, Math.round(window.innerHeight - box.height - margin)) + 'px'
        }
      }
    }

    let player: P2LPlayerLike | null = null
    let disposed = false
    let mouthRaf = 0
    let mouthTarget = 0
    let mouthValue = 0
    let tts: TtsBridge | null = null

    // ===== 精灵动作层（点头）：整图序列帧，播放期间淡出 Live2D 画面 =====
    // 为什么不用模型变形：这套自动 rig 在幅度稍大时会把层扯开（腰/手臂处露缝）。
    // 精灵帧是整图，不存在层间断缝，配合 120ms 淡入淡出观感最稳。
    const sprite = document.createElement('img')
    sprite.className = 'pwh-p2l-sprite'
    sprite.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:0;transition:opacity 120ms ease'
    sprite.alt = ''
    el.appendChild(sprite)
    const NOD_FRAMES: HTMLImageElement[] = [1, 2, 3, 4, 5].map((i) => {
      const img = new Image()
      img.src = `${base}sprites/nod_${i}.png`
      return img
    })
    let spriteTimer = 0
    const playSprite = (frames: HTMLImageElement[]): void => {
      if (disposed || frames.length === 0) return
      window.clearTimeout(spriteTimer)
      canvas.style.transition = 'opacity 120ms ease'
      canvas.style.opacity = '0'
      let i = 0
      const step = (): void => {
        if (disposed) return
        sprite.src = frames[Math.min(i, frames.length - 1)].src
        sprite.style.opacity = '1'
        i += 1
        if (i < frames.length) {
          spriteTimer = window.setTimeout(step, 80)
        } else {
          spriteTimer = window.setTimeout(() => {
            sprite.style.opacity = '0'
            canvas.style.opacity = '1'
          }, 90)
        }
      }
      step()
    }

    const onClick = (event: MouseEvent): void => {
      if (!player || event.button !== 0) return
      // 命中部位：头 → 点头；其它 → 摇一摇，权当反馈（按名字解析，见 pickClip）
      const hit = player.hitTest(event.clientX, event.clientY)
      // 点头部播精灵序列帧（整图，不会撕裂）；点其它部位仍用模型动作
      if (hit === 'Head') {
        playSprite(NOD_FRAMES)
        return
      }
      const clip = pickClip(player, 'Shake')
      if (clip !== null) player.play(clip)
    }
    // 视线跟随（lookAt）已停用：当前模型的头部形变在转动时会把头发/裙摆撕开
    // （实测：鼠标一移动到模型上，头转 → 网格撕裂出白色缺口）。等绑定权重修好再开。
    // const onMove = (event: PointerEvent): void => { ... player.lookAt(...) }

    el.addEventListener('click', onClick)

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
        const idle = pickClip(player, 'Idle')
        if (idle !== null) player.play(idle)
        // 供外部（tts 驱动）使用
        ;(window as unknown as { __petWhaleP2L?: unknown }).__petWhaleP2L = {
          player,
          setMouth: (v: number) => {
            mouthTarget = Math.max(0, Math.min(1, Number(v) || 0))
          },
          play: (id: string) => {
            const clip = pickClip(player as P2LPlayerLike, id)
            if (clip !== null) player?.play(clip)
          },
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
      // 视线跟随已停用（见下方说明），对应监听器也一并移除；这里不能再解绑 onMove/onLeave
      delete (window as unknown as { __petWhaleP2L?: unknown }).__petWhaleP2L
      canvas.remove()
      player = null
    }
  },
}
