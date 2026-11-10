// Live2D 宠物（Haru 占位模型）。
//
// 现状：这是把「桌宠本体」接上 Live2D 渲染的第一只——渲染由 runtime.ts 负责，
// 这个文件只声明盒子多大、资产在哪、点一下播什么动作。
//
// 资产来源（base）默认走插件自己的路由 /pet-whale/live2d/；
// 本地联调时可用 localStorage['pet-whale:live2d-base'] 指到临时静态服务，
// 这样不用重装插件也能先看效果。
import type { PetModule } from '../types'
import { mountLive2D } from './runtime'

const BASE_KEY = 'pet-whale:live2d-base'

/** 资产根，末尾补斜杠 */
function assetBase(): string {
  try {
    const raw = localStorage.getItem(BASE_KEY)
    if (raw) return raw.endsWith('/') ? raw : `${raw}/`
  } catch {
    // 忽略存储异常
  }
  return '/pet-whale/live2d/'
}

export const live2dPet: PetModule = {
  id: 'live2d',
  name: { zh: '小春', en: 'Haru' },
  icon: '🎀',
  // 画布由 mount 自己建，这里不放内联 SVG
  html: '',
  css: `
    /* Live2D 画布铺满宠物盒子；容器本身的位置/缩放仍由插件逻辑负责 */
    .pwh-l2d-canvas { outline: none; }
    [data-dsh-whale] .pet-official[role='img'] { cursor: pointer; }
  `,
  /** 站立型人物：给一个竖长的盒子（Haru 画布是 2400×4500 的竖图） */
  size: { w: 220, h: 340 },
  /** 站立型人物不要随机平移（没有走路动作，看着就是无缘无故到处飘） */
  idleDrift: false,
  mount: (el) =>
    mountLive2D(el, {
      base: assetBase(),
      model: 'models/haru/haru_greeter_t03.model3.json',
      // Haru 画布里人物上下都有留白：zoom 1.15 + 轻微下移刚好「头顶到脚」塞满 220×340 的盒子。
      // 换模型时按同一套办法调（联调页支持 ?zoom=&offy= 直接试）。
      zoom: 1.15,
      offsetY: 0.02,
      tapGroup: 'Tap',
    }),
}
