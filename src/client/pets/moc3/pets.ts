/**
 * 具体的 moc3 宠物登记处：加一只 = 往 ~/.dsh/dsh-pet/moc3/<pack>/ 丢模型，再在这里加一项。
 *
 * 授权提醒：
 * - 大肥鱼·团子（Q肥鱼）CC BY-NC-SA 4.0：非商用、署名 @氵六青
 * - 大肥鱼·鲸娘（免费公皮）：作者《使用须知》允许个人直播/创作收益，禁止再分发模型文件
 *   ⇒ 模型体量大且不允许重新分发，**不随仓库分发**，由用户自己放进素材目录
 *
 * @module dsh-pet/src/client/pets/moc3/pets
 */
import { createMoc3Pet } from './index'

/** Q肥鱼：手工绑骨，动作组 Idling/Touch/Action/FirstImpression；模型随仓库内置（3.9MB）。 */
export const moc3QfishPet = createMoc3Pet({
  id: 'moc3-qfish',
  name: { zh: '大肥鱼·团子', en: 'Dafeiyu Dumpling' },
  icon: '🍡',
  pack: 'dafeiyu-dumpling',
  model: 'c_0120.model3.json',
  size: { w: 240, h: 240 },
})

/** 免费公皮：VTS 模型，需自行放入 ~/.dsh/dsh-pet/moc3/free/。 */
export const moc3FreePet = createMoc3Pet({
  id: 'moc3-free',
  name: { zh: '大肥鱼·鲸娘', en: 'Dafeiyu Whalemaid' },
  icon: '🐳',
  pack: 'dafeiyu-whalemaid',
  model: '大肥鱼.model3.json',
  motionsPatch: 'motions.patch.json',
  size: { w: 200, h: 260 },
})
