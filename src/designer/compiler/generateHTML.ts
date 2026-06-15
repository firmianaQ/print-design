import type { DataSource, PaperConfig, TemplateElement, TemplateSchema } from '../types'
import { GRID_COLUMNS } from '../types'
import { renderElement } from './renderElement'
import { styleToString } from './styleToString'

/**
 * 根据 PaperConfig 拼装 @page 打印媒体查询
 *
 * 固定纸张：`@page { size: {w}mm {h}mm; margin: 0; }`
 * 连续纸张：`@page { size: {w}mm auto; margin: 0; }`（仅约束宽度，高度自适应）
 */
function buildPageRule(paper: PaperConfig): string {
  if (paper.heightMM == null) {
    return `@page { size: ${paper.widthMM}mm auto; margin: 0; }`
  }
  return `@page { size: ${paper.widthMM}mm ${paper.heightMM}mm; margin: 0; }`
}

/**
 * 把单个元素渲染为布局表的一个 <td>
 * - colSpan 决定横向占列数
 * - align 决定单元格内容水平对齐（编译为 td 的 text-align）
 * - widthPct 若指定则覆盖列宽（否则由 colSpan 在 GRID_COLUMNS 中按比例均分）
 */
function renderCell(el: TemplateElement, dataSource: DataSource): string {
  const inner = renderElement(el, dataSource, false)
  const align = el.align ?? 'left'
  const cellStyle: Record<string, string | number> = {
    verticalAlign: 'top',
    textAlign: align,
  }
  if (el.widthPct != null) {
    cellStyle.width = `${el.widthPct}%`
  }
  const colspanAttr = el.colSpan > 1 ? ` colspan="${el.colSpan}"` : ''
  return `<td${colspanAttr} style="${styleToString(cellStyle)}">${inner}</td>`
}

/**
 * 把元素按 row 分组，每组渲染为一个 <tr>（行内按 col 升序）
 *
 * 「行」是隐式推断：同 row 值的元素归一行。行高由内容自然决定，
 * 表格类元素撑高时该 <tr> 自动变高，后续 <tr> 自动下移——撞车根治。
 */
function renderRows(elements: TemplateElement[], dataSource: DataSource): string {
  // 按 row 分组（保留 row 数值，缺失视为 0）
  const rowMap = new Map<number, TemplateElement[]>()
  for (const el of elements) {
    const r = el.row ?? 0
    if (!rowMap.has(r)) rowMap.set(r, [])
    rowMap.get(r)!.push(el)
  }
  // row 升序；行内按 col 升序
  const sortedRows = [...rowMap.keys()].sort((a, b) => a - b)
  return sortedRows
    .map((rowKey) => {
      const cells = rowMap
        .get(rowKey)!
        .slice()
        .sort((a, b) => (a.col ?? 0) - (b.col ?? 0))
        .map((el) => renderCell(el, dataSource))
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('\n      ')
}

/**
 * 纯前端渲染引擎 —— 编译入口
 *
 * 编译流程：
 *   1. 顶部注入 <style>@page</style> 控制物理打印尺寸 + 消除默认边距
 *   2. 外层布局 <table>（宽度=纸宽，border-collapse，无表格线）作为模板骨架
 *   3. 元素按 row 分组为 <tr>，每个元素包进 <td>（colspan/对齐/宽度）
 *   4. 表格类元素渲染为嵌套 <table> 放进 <td>
 *
 * 输出仅用 table/tr/td + 内联样式，Lodop（IE 内核）完全支持，
 * 且 <table> 自动分页、行高自适应，无需 flex/grid。
 *
 * @param schema     模板实例 JSON（画布核心状态）
 * @param dataSource 业务数据源（按点路径取值）
 * @returns 纯 HTML 字符串，可直接用于打印或注入 iframe
 */
export function generateHTML(schema: TemplateSchema, dataSource: DataSource = {}): string {
  const pageRule = buildPageRule(schema.paper)
  // 外层布局表：宽度=纸宽 mm（与 @page size、列宽单位统一，避免 px/mm 换算误差；
  // 96dpi 下 1mm≈3.78px，mm 在浏览器屏幕与 Lodop 打印渲染下物理尺寸一致）
  const rootStyle: Record<string, string | number> = {
    width: `${schema.paper.widthMM}mm`,
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    background: '#fff',
  }

  const rowsHtml = renderRows(schema.elements, dataSource)

  // colgroup：12 等分基准列，保证 colspan 比例一致
  const colgroup = `<colgroup>${Array.from({ length: GRID_COLUMNS }, () => '<col />').join('')}</colgroup>`

  return `<style>
  ${pageRule}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; }
  img { max-width: 100%; }
</style>
<table class="print-root" style="${styleToString(rootStyle)}">${colgroup}
      ${rowsHtml}
    </table>`
}
