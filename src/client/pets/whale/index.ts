// 鲸鱼（插件原来的唯一宠物）：内联 SVG 由 scripts/extract-whale.mjs 从 preview.html 生成，
// 私有样式从 styles.ts 的宠物段切分而来，见同目录 styles.ts。
import { WHALE_HTML } from '../../whale'
import type { PetModule } from '../types'
import { WHALE_PET_CSS } from './styles'

export const whalePet: PetModule = {
  // 水生：水花/涟漪/气泡/拖拽滴水只对它生效（见 types.ts 的 aquatic）
  aquatic: true,
  id: 'whale',
  name: { zh: '小鲸鱼', en: 'Whale' },
  icon: '🐳',
  html: WHALE_HTML,
  css: WHALE_PET_CSS,
}
