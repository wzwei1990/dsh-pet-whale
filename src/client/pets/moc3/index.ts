/**
 * Cubism（.moc3）宠物：Q肥鱼 / 免费公皮这类现成模型。
 *
 * 为什么不走 p2l：p2l 只认 .p2lrt（PSD2Live 自家容器），读不了 moc3；
 * 现成模型必须用 Cubism 运行时。这里用 PixiJS 8 + untitled-pixi-live2d-engine 1.4.0：
 * 老版 pixi-live2d-display 0.4 的遮罩缓冲固定 256，对 700+ drawable 的 VTS 模型会在
 * 嘴部/服饰边缘画出遮罩块（实测过），新引擎自带高精度遮罩自适应。
 *
 * 运行时文件由插件路由提供（/pet-whale/moc3/runtime/*.js），不打包进 client bundle；
 * 模型放 ~/.dsh/dsh-pet/moc3/<pack>/（体量大，不入库）。
 *
 * @module dsh-pet/src/client/pets/moc3
 */
import type { PetModule } from '../types'

interface Moc3PetOptions {
  /** 稳定 id（localStorage / 菜单去重） */
  id: string
  name: { zh: string; en: string }
  icon: string
  /** 模型包目录名（/pet-whale/moc3/<pack>/） */
  pack: string
  /** model3.json 文件名 */
  model: string
  /** 容器宽高比（CSS px） */
  size: { w: number; h: number }
  /** 可选：宠物专属台词覆盖（大肥鱼口吻，见 ../dafeiyu/text.ts） */
  text?: PetModule['text']
  /**
   * 可选：动作补丁（相对素材根）。有些模型（VTube Studio 导出的公皮）model3.json 里
   * Motions/Expressions 是空的，动作靠 VTS 自己的配置注册——补丁就是把那两段补回去。
   */
  motionsPatch?: string
}

const RUNTIME = '/pet-whale/moc3/runtime/'

/** 三个运行时脚本只注入一次（多只 moc3 宠物共用）。 */
let runtimePromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-pwh-moc3="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = src
    tag.async = false
    tag.dataset.pwhMoc3 = src
    tag.onload = () => resolve()
    tag.onerror = () => reject(new Error('脚本加载失败: ' + src))
    document.head.appendChild(tag)
  })
}

/** 顺序加载：PixiJS → Cubism Core → 高精度遮罩引擎（后者依赖前两者）。 */
function ensureRuntime(): Promise<void> {
  if (runtimePromise === null) {
    runtimePromise = (async () => {
      await loadScript(RUNTIME + 'pixi.min.js')
      await loadScript(RUNTIME + 'live2dcubismcore.min.js')
      await loadScript(RUNTIME + 'cubism-engine.min.js')
      const pixi = (window as unknown as { PIXI?: { live2d?: unknown } }).PIXI
      if (!pixi?.live2d) throw new Error('Cubism 引擎未就绪')
    })()
  }
  return runtimePromise
}

/** 相对路径改成绝对地址（模型放在子目录时，model3.json 里的相对引用要补前缀）。 */
function absolutize(model3: any, baseUrl: string): any {
  const abs = (raw: string): string => {
    if (/^(https?:|data:|blob:)/.test(raw)) return raw
    return baseUrl + raw.split('/').map(encodeURIComponent).join('/')
  }
  const fr = (model3.FileReferences ??= {})
  for (const key of ['Moc', 'Physics', 'Pose', 'DisplayInfo', 'UserData', 'Photo']) {
    if (typeof fr[key] === 'string') fr[key] = abs(fr[key])
  }
  if (Array.isArray(fr.Textures)) fr.Textures = fr.Textures.map(abs)
  if (fr.Motions && typeof fr.Motions === 'object') {
    for (const group of Object.keys(fr.Motions)) {
      for (const motion of fr.Motions[group] ?? []) {
        if (typeof motion.File === 'string') motion.File = abs(motion.File)
        if (typeof motion.Sound === 'string') motion.Sound = abs(motion.Sound)
      }
    }
  }
  if (Array.isArray(fr.Expressions)) {
    for (const exp of fr.Expressions) if (typeof exp.File === 'string') exp.File = abs(exp.File)
  }
  return model3
}

/**
 * 取模型：读 model3.json → 补动作补丁 → 相对路径改绝对 → 用 blob URL 交给引擎。
 * 用 blob 是为了支持「原模型 + 外部补丁」而不必改动用户磁盘上的文件。
 */
async function loadModel(PIXI: any, modelUrl: string, patchUrl?: string): Promise<any> {
  const baseUrl = modelUrl.slice(0, modelUrl.lastIndexOf('/') + 1)
  const res = await fetch(modelUrl, { cache: 'no-cache' })
  if (!res.ok) throw new Error('model3.json ' + res.status + '（模型没放进素材目录？）')
  const model3 = await res.json()
  if (patchUrl) {
    const patchRes = await fetch(patchUrl, { cache: 'no-cache' })
    if (patchRes.ok) {
      const patch = await patchRes.json()
      const fr = (model3.FileReferences ??= {})
      if (patch.Motions) fr.Motions = patch.Motions
      if (patch.Expressions) fr.Expressions = patch.Expressions
    }
  }
  absolutize(model3, baseUrl)
  const blob = new Blob([JSON.stringify(model3)], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  try {
    return await PIXI.live2d.Live2DModel.from(objectUrl, { autoInteract: false })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function createMoc3Pet(options: Moc3PetOptions): PetModule {
  const modelUrl = '/pet-whale/moc3/' + options.pack + '/' + options.model
  const patchUrl = options.motionsPatch ? '/pet-whale/moc3/' + options.pack + '/' + options.motionsPatch : undefined
  return {
    id: options.id,
    name: options.name,
    icon: options.icon,
    ...(options.text ? { text: options.text } : {}),
    html: '<div class="pwh-moc3-box"></div>',
    css: `
      .pwh-moc3-box { position: absolute; inset: 0; }
      .pwh-moc3-box canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    `,
    size: options.size,
    idleDrift: false,

    mount: (el: HTMLElement): (() => void) => {
      const box = el.querySelector('.pwh-moc3-box')
      if (!(box instanceof HTMLElement)) return () => {}

      let disposed = false
      let app: { destroy: (a?: boolean, b?: boolean) => void; stage: { removeChildren: () => void }; canvas: HTMLCanvasElement } | null = null
      let model: {
        destroy: () => void
        motion: (group: string, index?: number) => unknown
        internalModel: { motionManager: { definitions?: Record<string, unknown>; startMotion?: (g: string, i: number, p: number) => boolean; state?: { currentGroup?: string } } }
      } | null = null
      let onClick: (() => void) | null = null

      void (async () => {
        try {
          await ensureRuntime()
          if (disposed) return
          const PIXI = (window as unknown as { PIXI: any }).PIXI
          const canvas = document.createElement('canvas')
          box.appendChild(canvas)

          const width = Math.max(1, Math.round(el.clientWidth || options.size.w))
          const height = Math.max(1, Math.round(el.clientHeight || options.size.h))
          const application = new PIXI.Application()
          await application.init({
            view: canvas,
            width,
            height,
            backgroundAlpha: 0,
            antialias: true,
            preference: 'webgl',
          })
          if (disposed) {
            application.destroy(true, true)
            return
          }
          app = application as unknown as typeof app

          const loaded = await loadModel(PIXI, modelUrl, patchUrl)
          if (disposed) {
            loaded.destroy()
            application.destroy(true, true)
            return
          }
          model = loaded
          application.stage.addChild(loaded)
          loaded.anchor.set(0.5, 0.5)
          loaded.x = width / 2
          loaded.y = height / 2
          loaded.scale.set(Math.min(width / loaded.width, height / loaded.height) * 0.98)

          const groups = Object.keys(loaded.internalModel.motionManager.definitions ?? {})
          const idle = groups.find((g) => /idle/i.test(g)) ?? groups[0]
          if (idle) {
            try {
              await loaded.motion(idle, 0)
            } catch {
              /* 没有 idle 动作就保持静止 */
            }
          }

          onClick = () => {
            if (!model) return
            const pool = groups.filter((g) => g !== idle)
            if (pool.length === 0) return
            const pick = pool[Math.floor(Math.random() * pool.length)] as string
            const mm = model.internalModel.motionManager
            // 引擎 1.4.0：普通优先级会被循环 idle 盖住，必须 3（Force）才抢得到
            if (mm.startMotion) mm.startMotion(pick, 0, 3)
            else void model.motion(pick, 0)
          }
          el.addEventListener('click', onClick)
        } catch (error) {
          console.log('[pet-whale][warn] moc3 宠物加载失败：', error)
          const tip = document.createElement('div')
          tip.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;font-size:11px;color:#889;'
          tip.textContent = '模型未就绪'
          box.appendChild(tip)
        }
      })()

      return () => {
        disposed = true
        if (onClick) el.removeEventListener('click', onClick)
        onClick = null
        try {
          model?.destroy()
        } catch {
          /* 忽略 */
        }
        model = null
        try {
          app?.destroy(true, true)
        } catch {
          /* 忽略 */
        }
        app = null
        box.replaceChildren()
      }
    },
  }
}
