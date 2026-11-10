// 宠物注册表：加宠物只需在这个文件 import 一行、数组里加一项。
import type { PetModule } from './types'
import { catPet } from './cat'
import { lingerPet } from './linger'
import { live2dPet } from './live2d'
import { live2dOwnPet } from './live2d/own'
import { whalePet } from './whale'

export type { PetModule } from './types'

/** 可切换的宠物列表，顺序即右键菜单里的顺序；第一只只作兜底，默认看 DEFAULT_PET_ID */
export const PETS: readonly PetModule[] = [whalePet, catPet, lingerPet, live2dPet, live2dOwnPet]

/** 首次运行（或存储里的 id 失效）时用哪只 */
export const DEFAULT_PET_ID = 'whale'

const PET_KEY = 'pet-whale:pet'

/** 按 id 取宠物；id 不认识时回落到默认宠物，绝不返回 undefined */
export function petOf(id: string): PetModule {
  return PETS.find((p) => p.id === id) ?? PETS.find((p) => p.id === DEFAULT_PET_ID) ?? PETS[0]
}

export function loadPetId(): string {
  try {
    const raw = localStorage.getItem(PET_KEY)
    // 只认注册表里有的 id：别人往存储里塞个野 id 也不会把桌宠弄没
    if (raw !== null && PETS.some((p) => p.id === raw)) return raw
  } catch {
    // 忽略存储异常
  }
  return DEFAULT_PET_ID
}

export function savePetId(id: string): void {
  try {
    localStorage.setItem(PET_KEY, id)
  } catch {
    // 忽略存储异常
  }
}
