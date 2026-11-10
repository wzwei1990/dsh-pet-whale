// 宠物模块接口：加一只新宠物 = 新建 pets/<id>/ 目录，导出一个 PetModule，
// 然后在 pets/index.ts 的 PETS 里加一行 import + 一行数组项。
//
// 运行时契约（详见 docs/MULTI-PET.md）：
// 1) html 是一段内联 SVG，塞进已有的 <div class="pet-official"> 里；容器的状态 class
//    （idle/think/working/celebrate/error/wait/disappointed + joy/dizzy/… 、根上的
//    sleeping/dragging/edge-*/swimming）由插件逻辑负责切换，宠物只要用 CSS 响应它们。
// 2) css 是该宠物独占的样式表，只有它处于选中状态时才会挂上；因此表内选择器不需要
//    再加宠物前缀，但 @keyframes 必须用自己的前缀（鲸鱼是 pw-，它已在 BASE_CSS 里）。
// 3) 上色只走 CSS 变量 --pw-body / --pw-body-light / --pw-body-dark / --pw-blush /
//    --pw-eye / --pw-pupil，这样 palettes.ts 的色板对所有宠物自动生效。
import type { PetTextOverrides } from '../i18n'

export interface PetModule {
  /** 稳定 id：i18n 文案键、localStorage（pet-whale:pet）、菜单去重都用它 */
  id: string
  /** 兜底名字：i18n 的 pet[id] 缺失时按当前语言取这里 */
  name: { zh: string; en: string }
  /** 右键菜单里的图标 */
  icon: string
  /** 内联 SVG 字符串 */
  html: string
  /** 宠物独占样式：部件外观 + 各状态动画 + 自己的 keyframes */
  css: string
  /**
   * 可选：这只宠物专属的文案覆盖。
   * i18n.ts 的基准文案是鲸鱼口吻（"正在深潜检索知识库""游一游"）——换了宠物就该换说法，
   * 猫不会深潜。只写要改的条目，台词池（string[]）必须整组替换。见 pets/cat/text.ts。
   */
  text?: { zh?: PetTextOverrides; en?: PetTextOverrides }
  /**
   * 可选：容器尺寸（未缩放的 CSS px），默认 137×101（鲸鱼的盒子）。
   * viewBox 长宽比与默认盒差异较大时用它校正，避免留白影响贴边/水花位置。
   */
  size?: { w: number; h: number }
  /** 可选：鼠标追光的瞳孔选择器，默认 '.pupil-highlight' */
  pupilSelector?: string
  /**
   * 可选：idle 时是否允许"随机小挪动"（默认 true）。
   * 鲸鱼、猫这类会游走/溜达的宠物保持默认；**站立型人物请设 false** ——
   * 平移时没有对应动作（不像在飞、也不像在走），看着就是"无缘无故到处飘"。
   * 关掉后 idle 的小动作只剩看四周、冒泡泡这类原地动作。
   */
  idleDrift?: boolean
  /**
   * 可选：idle 时能演的**原地动作**清单（声明式，插件逻辑不用为每只宠物改代码）。
   *
   * 约定（照做就不会踩坑）：
   * - 触发器是加在 `.pet-official` 上的临时 class：`.micro-<id>`，播完由插件移除
   * - 样式表写 `[data-dsh-whale] .pet-official.micro-<id> <部件> { animation: <一次性> }`
   * - 动画**必须一次性**（别 infinite），时长 ≤ 2.2s，且 **0% 与 100% 都是中性姿态**
   *   —— class 移除是硬切，首尾回到中性才看不出跳变
   * - 台词池走 i18n 的 `micro[id]`（可选；配一句话才像"她在做事"）
   * - 只在「御剑/游泳」关闭、状态为 idle 时播；洗牌袋保证短周期内不重复
   *
   * 不声明（或空数组）＝不做原地动作，调度器退回"看四周 / 吐泡泡"的老行为。
   * 灵儿的 4 个：spin(原地转圈·绕竖轴) spell(放法术) fan(扇扇子) gaze(远眺)
   */
  micro?: string[]
  /**
   * 可选：把宠物挂到「脚本化渲染」上（Live2D canvas 这类）。html/css 表达不了的东西走这里。
   *
   * 契约：
   * - el 就是 `.pet-official` 容器；mount 自己在里面建 canvas / 起渲染循环
   * - 返回卸载函数：切宠物时插件会调用它（**必须释放渲染循环**，否则切走之后还在跑）
   * - el 的尺寸（CSS 变量 --pw-pet-w/h）已经按 size 设好，mount 直接量 el.clientWidth/Height
   * - 容器上的状态 class（idle/working/celebrate/…）照旧会切；需要的话监听 el 的 class 变化
   */
  mount?: (el: HTMLElement) => void | (() => void)
}
