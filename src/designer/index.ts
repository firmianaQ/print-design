/**
 * 打印模板设计器 —— 对外公开 API
 *
 * 用法：
 *   import { Designer, generateHTML, useDesigner } from '@/designer'
 *
 * 核心导出：
 *   - 组件：Designer（三栏布局容器）
 *   - 编译器：generateHTML（纯函数，schema + dataSource → HTML 字符串）
 *   - Composable：useDesigner / provideDesigner / injectDesigner
 *   - 类型：TemplateSchema / TemplateElement / MaterialItem / DataSource 等
 */
export { default as Designer } from './components/Designer.vue'
export { useDesigner, type DesignerInstance } from './useDesigner'
export { provideDesigner, injectDesigner, DESIGNER_KEY } from './inject'
export { generateHTML } from './compiler/generateHTML'
export { renderElement } from './compiler/renderElement'
export { styleToString, mergeStyles } from './compiler/styleToString'
export { resolvePath } from './compiler/resolvePath'
export { PAPER_PRESETS, PAPER_OPTIONS } from './paperPresets'
export {
  ALL_MATERIALS,
  registerMaterials,
  filterMaterialsByDocumentType,
  listDocumentTypes,
} from './materials'
export { mmToPx, pxToMm, PX_PER_MM } from './utils/units'
export * from './types'
