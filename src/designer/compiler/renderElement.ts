import type { DataSource, StyleObject, TableColumn, TemplateElement, TableRow } from '../types'
import { resolvePath } from './resolvePath'
import { styleToString } from './styleToString'

/** HTML 文本转义，防止数据注入破坏结构 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 把任意值转为字符串显示；对象/数组退化为空串避免渲染 [object Object] */
function stringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/**
 * value：单值文本
 * 优先 staticText，否则按 dataField 取动态值。
 * 输出单元格内联 HTML（无定位包装，由 generateHTML 包进 <td>）。
 */
function renderValue(el: TemplateElement, dataSource: DataSource): string {
  let text = ''
  if (el.staticText !== undefined && el.staticText !== '') {
    text = el.staticText
  } else if (el.dataField) {
    text = stringify(resolvePath(dataSource, el.dataField))
  }
  return `<span style="${styleToString(el.style)}">${escapeHtml(text)}</span>`
}

/**
 * label-value：静态标签 + 动态变量，如 "收件人：[张三]"
 */
function renderLabelValue(el: TemplateElement, dataSource: DataSource): string {
  const label = el.label ?? ''
  const sep = el.separator ?? ' '
  const value = el.dataField ? stringify(resolvePath(dataSource, el.dataField)) : ''
  return `<span style="${styleToString(el.style)}">${escapeHtml(label)}${sep}${escapeHtml(value)}</span>`
}

/**
 * image：渲染 <img>，优先 staticSrc，否则按 srcField 取 URL
 */
function renderImage(el: TemplateElement, dataSource: DataSource): string {
  let src = ''
  if (el.staticSrc) {
    src = el.staticSrc
  } else if (el.srcField) {
    src = stringify(resolvePath(dataSource, el.srcField))
  }
  const fit = el.fit ?? 'contain'
  const imgStyle: StyleObject = {
    maxWidth: '100%',
    objectFit: fit,
    display: 'inline-block',
    ...el.style,
  }
  return `<img src="${escapeHtml(src)}" style="${styleToString(imgStyle)}" />`
}

/** 计算表格列宽 style 片段（mm → 直接输出 mm，保持打印物理一致） */
function colWidthStyle(col: TableColumn, fallbackMm: number | undefined): string {
  const w = col.widthMM ?? fallbackMm
  return w ? `width:${w}mm;` : ''
}

/**
 * 渲染单行 <tr>，含行级样式覆写 _rowStyle + 树形子行递归
 *
 * @param depth 递归深度，用于子行缩进展示
 * @param cellBorder 应用到每个 td 的边框 style 片段（含末尾分号），为空则无边框
 * @param cellPadding 单元格内边距 (px)；undefined 则不加 padding 声明
 * @param bodyAlign 内容单元格默认对齐；被列级 col.align 覆写
 */
function renderRow(
  row: TableRow,
  columns: TableColumn[],
  cellBorder: string,
  cellPadding: number | undefined,
  bodyAlign: 'left' | 'center' | 'right' | undefined,
  depth: number,
): string {
  // 行基础样式：子行缩进
  const rowBase: StyleObject = depth > 0 ? { paddingLeft: `${depth * 12}px` } : {}
  const rowStyle = { ...rowBase, ...row._rowStyle }

  const cells = columns
    .map((col) => {
      const cellText = stringify(resolvePath(row, col.dataField))
      const colW = colWidthStyle(col, undefined)
      const indent: string = depth > 0 ? 'padding-left:12px;' : ''
      // 列级对齐覆写内容级对齐：col.align ?? bodyAlign ?? 'left'
      const align = `text-align:${col.align ?? bodyAlign ?? 'left'};`
      const pad = cellPadding != null ? `padding:${cellPadding}px;` : ''
      return `<td style="${indent}${pad}${align}${colW}${cellBorder}">${escapeHtml(cellText)}</td>`
    })
    .join('')

  const rowAttr = depth > 0 ? ' data-child="1"' : ''
  let html = `<tr${rowAttr} style="${styleToString(rowStyle)}">${cells}</tr>`

  // 递归渲染子行（套餐明细、加料做法等）
  if (row.children && row.children.length > 0) {
    for (const child of row.children) {
      html += renderRow(child, columns, cellBorder, cellPadding, bodyAlign, depth + 1)
    }
  }
  return html
}

/**
 * table：表格渲染（嵌套表格，整体作为单元格内容）
 * - 行级样式覆写：读取行数据 _rowStyle 字段
 * - 树形递归渲染：读取行数据 children 数组递归生成子行
 * - 列显隐：hidden=true 的列不参与渲染
 * - 表格线：bordered=true 时按 borderWidth/borderColor 渲染单元格边框
 * 嵌套表格高度由内容决定，撑高时父布局表的该 <tr> 自动变高、后续行下移。
 */
function renderTable(el: TemplateElement, dataSource: DataSource): string {
  // 过滤隐藏列（实例配置决定可见列，不影响行数据）
  const columns = (el.columns ?? []).filter((c) => !c.hidden)
  const rowsPath = el.rowField ?? el.dataField
  const rows = (rowsPath ? resolvePath<TableRow[]>(dataSource, rowsPath) : undefined) ?? []

  const bordered = el.bordered ?? false
  const borderWidth = el.borderWidth ?? 1
  const borderColor = el.borderColor ?? '#000'
  // 单元格边框 style 片段；border-collapse 下相邻边框合并，效果为标准表格线
  const cellBorder = bordered ? `border:${borderWidth}px solid ${borderColor};` : ''
  const cellPadding = el.cellPadding
  const padStr = cellPadding != null ? `padding:${cellPadding}px;` : ''

  const tableStyle: StyleObject = {
    width: '100%',
    borderCollapse: bordered ? 'collapse' : 'separate',
    tableLayout: 'fixed',
    ...el.style,
  }

  // 表头样式（独立于内容）：加粗/字号/颜色/背景/对齐
  const headerAlign = el.headerAlign ?? 'left'
  const thStyle: StyleObject = {
    textAlign: headerAlign,
    fontWeight: el.headerBold === false ? 'normal' : 'bold',
  }
  if (el.headerFontSize != null) thStyle.fontSize = el.headerFontSize
  if (el.headerColor != null) thStyle.color = el.headerColor
  const headerBg = el.headerBgColor ? `background:${el.headerBgColor};` : ''

  // 数据行：三层对齐（col.align 覆写 bodyAlign）
  const bodyAlign = el.bodyAlign
  const tbody = rows
    .map((row) => renderRow(row, columns, cellBorder, cellPadding, bodyAlign, 0))
    .join('')

  // 表头：showHeader 默认 true；显式 false 时省略 thead
  const showHeader = el.showHeader !== false
  const theadHtml = showHeader
    ? `<thead><tr>${columns
        .map((col) => {
          const colW = colWidthStyle(col, undefined)
          return `<th style="${styleToString(thStyle)}${headerBg}${padStr}${colW}${cellBorder}">${escapeHtml(col.label)}</th>`
        })
        .join('')}</tr></thead>`
    : ''

  return `<table style="${styleToString(tableStyle)}">${theadHtml}<tbody>${tbody}</tbody></table>`
}

/**
 * 元素 → 单元格内联 HTML 分发器
 * 按基础渲染器类型路由到具体渲染函数。
 * 注意：本函数只输出单元格「内容」，外层 <td>（含 colspan/对齐）由 generateHTML 包裹。
 *
 * @param designMode 设计模式（画布预览用）：当前实现下内容渲染一致，
 *                   区别仅在 generateHTML 是否包 <td>，此处保留参数以备扩展
 */
export function renderElement(
  el: TemplateElement,
  dataSource: DataSource,
  _designMode = false,
): string {
  switch (el.type) {
    case 'value':
      return renderValue(el, dataSource)
    case 'label-value':
      return renderLabelValue(el, dataSource)
    case 'image':
      return renderImage(el, dataSource)
    case 'table':
      return renderTable(el, dataSource)
    default:
      return ''
  }
}
