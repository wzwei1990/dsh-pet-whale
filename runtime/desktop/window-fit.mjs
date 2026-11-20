/**
 * 桌面窗口几何：纯函数（纯 JS，Electron 主进程与 Node 测试都能直接 import）。
 *
 * @param {{ w: number, h: number }} sprite 精灵画布尺寸（通常 640×360）
 * @param {{ x: number, y: number, width: number, height: number }} workArea 目标显示器工作区
 * @param {number} scale 显示倍率（1 = 精灵画布像素直接当窗口像素）
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function computeWindowRect(sprite, workArea, scale = 0.5) {
  const margin = 48
  const maxW = Math.floor(workArea.width * 0.5)
  const maxH = Math.floor(workArea.height * 0.8)
  const width = Math.max(160, Math.min(maxW, Math.ceil(sprite.w * scale) + margin * 2))
  const height = Math.max(160, Math.min(maxH, Math.ceil(sprite.h * scale) + margin * 2))
  // 默认贴右下角，留 24px 边距（任务栏在工作区之外）
  return {
    x: Math.round(workArea.x + workArea.width - width - 24),
    y: Math.round(workArea.y + workArea.height - height - 24),
    width,
    height,
  }
}

/** 把窗口位置钳进工作区，避免换分辨率/拔显示器后跑到屏幕外 */
export function clampToWorkArea(rect, workArea) {
  const width = Math.min(rect.width, workArea.width)
  const height = Math.min(rect.height, workArea.height)
  return {
    x: Math.min(Math.max(rect.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(rect.y, workArea.y), workArea.y + workArea.height - height),
    width,
    height,
  }
}
