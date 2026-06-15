/**
 * @print-design/vue — 打印模板设计器库主入口
 *
 * 导出全部公共 API：Vue 组件、Composable、编译器、预设、工具函数、类型。
 *
 * 用法：
 *   import { Designer, useDesigner, generateHTML } from '@print-design/vue'
 *
 * 如果只需要纯函数编译器（无 Vue 依赖），请使用：
 *   import { generateHTML } from '@print-design/vue/compiler'
 */

/* ─── Vue 组件 ─── */
export { default as Designer } from './designer/components/Designer.vue'

/* ─── Composable ─── */
export { useDesigner, type DesignerInstance } from './designer/useDesigner'
export { provideDesigner, injectDesigner, DESIGNER_KEY } from './designer/inject'

/* ─── 编译器（纯函数） ─── */
export { generateHTML } from './designer/compiler/generateHTML'
export { renderElement } from './designer/compiler/renderElement'
export { styleToString, mergeStyles } from './designer/compiler/styleToString'
export { resolvePath } from './designer/compiler/resolvePath'

/* ─── 纸张预设 ─── */
export { PAPER_PRESETS, PAPER_OPTIONS } from './designer/paperPresets'

/* ─── 物料注册机制 ─── */
export {
  ALL_MATERIALS,
  registerMaterials,
  filterMaterialsByDocumentType,
  listDocumentTypes,
} from './designer/materials'

/* ─── 工具函数 ─── */
export { mmToPx, pxToMm, PX_PER_MM } from './designer/utils/units'

/* ─── 类型定义（全量重导出） ─── */
export * from './designer/types'
