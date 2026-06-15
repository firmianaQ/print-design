/**
 * 单位换算工具
 *
 * 设计决策：
 *   - 画布坐标/尺寸用 px 存储（vue3-draggable-resizable 原生 px，避免浮点换算漂移）
 *   - 纸张物理尺寸用 mm 存储（直接用于 @page size）
 *   - 浏览器默认 96dpi，1in = 25.4mm = 96px → 1mm = 96/25.4 px
 *   - 打印时 96dpi 下 px↔mm 物理一致，故编译输出仍用 px 也能保证打印尺寸准确
 */

/** 每毫米对应的像素数 (96dpi) */
export const PX_PER_MM = 96 / 25.4

/** 四舍五入到 2 位小数，避免长浮点尾数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 毫米 → 像素 */
export function mmToPx(mm: number): number {
  return round2(mm * PX_PER_MM)
}

/** 像素 → 毫米 */
export function pxToMm(px: number): number {
  return round2(px / PX_PER_MM)
}
