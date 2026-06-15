/**
 * @print-design/vue/compiler — 纯函数编译器入口
 *
 * 仅导出编译器相关纯函数和类型定义，不依赖 Vue 或 naive-ui。
 * 可在 Node.js、任意前端框架中独立使用。
 *
 * 用法：
 *   import { generateHTML, type TemplateSchema } from '@print-design/vue/compiler'
 *   const html = generateHTML(schema, dataSource)
 */

/* ─── 编译器（纯函数） ─── */
export { generateHTML } from './designer/compiler/generateHTML'
export { renderElement } from './designer/compiler/renderElement'
export { styleToString, mergeStyles } from './designer/compiler/styleToString'
export { resolvePath } from './designer/compiler/resolvePath'

/* ─── 工具函数 ─── */
export { mmToPx, pxToMm, PX_PER_MM } from './designer/utils/units'

/* ─── 类型定义（全量重导出） ─── */
export * from './designer/types'
