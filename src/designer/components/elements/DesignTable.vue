<script setup lang="ts">
/**
 * 画布内表格设计器（仅设计期使用，不参与编译输出）
 *
 * 在画布表格元素内部提供两种交互：
 *   1. 表头拖拽换序 —— 拖动表头单元格到其它列位置，重排 el.columns 数组
 *   2. 列宽拖拽调整 —— 拖动列右边界，改 col.widthMM（px → mm 换算）
 *
 * 编译输出仍由 renderTable 生成（绝对定位 + 真实列序/列宽），本组件仅负责画布交互。
 * 行渲染（_rowStyle / children 树形）复用编译器同款逻辑，保证所见即所得。
 */
import { computed, ref } from 'vue'
import { resolvePath } from '../../compiler/resolvePath'
import { mmToPx, pxToMm } from '../../utils/units'
import type { DataSource, StyleObject, TableColumn, TemplateElement, TableRow } from '../../types'

const props = defineProps<{
  element: TemplateElement
  dataSource?: DataSource
}>()

const el = computed(() => props.element)

/** 可见列（隐藏列不参与设计期渲染） */
const visibleColumns = computed<TableColumn[]>(() =>
  (el.value.columns ?? []).filter((c) => !c.hidden),
)

/** 表格行数据（按 rowField/dataField 从 dataSource 取） */
const rows = computed<TableRow[]>(() => {
  const path = el.value.rowField ?? el.value.dataField
  return (path ? resolvePath<TableRow[]>(props.dataSource, path) : undefined) ?? []
})

/** 表格容器样式：与编译器输出保持一致（designMode 下 100% 填充 wrapper） */
const tableStyle = computed<StyleObject>(() => {
  const bordered = el.value.bordered ?? false
  return {
    width: '100%',
    borderCollapse: bordered ? 'collapse' : 'separate',
    tableLayout: 'fixed',
    ...el.value.style,
  }
})

const bordered = computed(() => el.value.bordered ?? false)
const borderWidth = computed(() => el.value.borderWidth ?? 1)
const borderColor = computed(() => el.value.borderColor ?? '#000')
const cellBorderStyle = computed(
  () => (bordered.value ? `${borderWidth.value}px solid ${borderColor.value}` : undefined),
)

/**
 * 列宽样式片段 —— 与编译器 colWidthStyle 同构：直接输出 mm（不转 px）。
 * 这样画布表格的列宽规则与编译输出完全一致（th/td 内联 width:mm），
 * 避免 colgroup+px 与 编译期 th/td+mm 因 table-layout:fixed 取宽规则不同导致的列比例偏差。
 */
function colWidthMm(col: TableColumn): string {
  return col.widthMM != null ? `width:${col.widthMM}mm;` : ''
}

/** th 内联样式串：与编译器 renderTable 的 thStyle 完全一致（加粗/字号/颜色/背景/对齐 + 列宽 + 内边距 + 表格线） */
function thStyleStr(col: TableColumn): string {
  const e = el.value
  const border = cellBorderStyle.value ? `border:${cellBorderStyle.value};` : ''
  const pad = e.cellPadding != null ? `padding:${e.cellPadding}px;` : ''
  const bg = e.headerBgColor ? `background:${e.headerBgColor};` : ''
  const bold = e.headerBold === false ? 'font-weight:normal;' : 'font-weight:bold;'
  const fs = e.headerFontSize != null ? `font-size:${e.headerFontSize}px;` : ''
  const color = e.headerColor != null ? `color:${e.headerColor};` : ''
  const align = `text-align:${e.headerAlign ?? 'left'};`
  return `${bold}${align}${fs}${color}${bg}${pad}${colWidthMm(col)}${border}`
}

/** td 内联样式串：与编译器 renderRow 的 td 完全一致（三层对齐 + 列宽 + 内边距 + 表格线 + 子行缩进） */
function tdStyleStr(col: TableColumn, depth: number): string {
  const e = el.value
  const border = cellBorderStyle.value ? `border:${cellBorderStyle.value};` : ''
  const pad = e.cellPadding != null ? `padding:${e.cellPadding}px;` : ''
  const indent = depth > 0 ? 'padding-left:12px;' : ''
  // 列级对齐覆写内容级对齐
  const align = `text-align:${col.align ?? e.bodyAlign ?? 'left'};`
  return `${indent}${pad}${align}${colWidthMm(col)}${border}`
}

/** 把任意值转为可显示字符串 */
function stringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/** 扁平化行（含递归 children），保留 depth 用于缩进 */
interface FlatRow {
  row: TableRow
  depth: number
}
function flatten(rows: TableRow[], depth = 0): FlatRow[] {
  const out: FlatRow[] = []
  for (const r of rows) {
    out.push({ row: r, depth })
    if (r.children && r.children.length) out.push(...flatten(r.children, depth + 1))
  }
  return out
}
const flatRows = computed<FlatRow[]>(() => flatten(rows.value))

/** 单元格内容 */
function cellText(row: TableRow, col: TableColumn): string {
  return stringify(resolvePath(row, col.dataField))
}

// ---- 列宽拖拽调整 ----
const resizingIndex = ref<number | null>(null)
const resizeStartX = ref(0)
const resizeStartWidthPx = ref(0)

function onResizeDown(event: MouseEvent, index: number): void {
  event.preventDefault()
  event.stopPropagation()
  resizingIndex.value = index
  const col = visibleColumns.value[index]
  resizeStartX.value = event.clientX
  resizeStartWidthPx.value = col && col.widthMM != null ? mmToPx(col.widthMM) : 60
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeUp)
}

function onResizeMove(event: MouseEvent): void {
  if (resizingIndex.value == null) return
  const col = visibleColumns.value[resizingIndex.value]
  if (!col) return
  const deltaPx = event.clientX - resizeStartX.value
  const newPx = Math.max(20, resizeStartWidthPx.value + deltaPx)
  col.widthMM = pxToMm(newPx)
}

function onResizeUp(): void {
  resizingIndex.value = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeUp)
}

// ---- 表头拖拽换序（HTML5 DnD） ----
const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onHeaderDragStart(event: DragEvent, index: number): void {
  dragFromIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox 需要 setData 才会触发 drag
    event.dataTransfer.setData('text/plain', String(index))
  }
}
function onHeaderDragOver(event: DragEvent, index: number): void {
  // 必须 preventDefault 才能触发 drop；stopPropagation 避免冒泡到画布的 drop（误触发添加物料）
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}
function onHeaderDragLeave(index: number): void {
  if (dragOverIndex.value === index) dragOverIndex.value = null
}
function onHeaderDrop(event: DragEvent, index: number): void {
  event.preventDefault()
  event.stopPropagation()
  const from = dragFromIndex.value
  dragFromIndex.value = null
  dragOverIndex.value = null
  if (from == null || from === index) return
  // 在 el.columns（含隐藏列）中找到对应的两个可见列对象并重排
  const list = el.value.columns
  if (!list) return
  const fromCol = visibleColumns.value[from]
  const toCol = visibleColumns.value[index]
  const fromIdx = list.indexOf(fromCol)
  const toIdx = list.indexOf(toCol)
  if (fromIdx < 0 || toIdx < 0) return
  const [moved] = list.splice(fromIdx, 1)
  list.splice(toIdx, 0, moved)
}
</script>

<template>
  <div class="design-table">
    <table :style="tableStyle">
      <thead v-if="el.showHeader !== false">
        <tr>
          <th
            v-for="(col, index) in visibleColumns"
            :key="col.key"
            class="th-cell"
            :class="{
              'drag-source': dragFromIndex === index,
              'drag-over': dragOverIndex === index && dragFromIndex !== index,
              'is-resizing': resizingIndex === index,
            }"
            :style="thStyleStr(col)"
            draggable="true"
            @dragstart="onHeaderDragStart($event, index)"
            @dragover="onHeaderDragOver($event, index)"
            @dragleave="onHeaderDragLeave(index)"
            @drop="onHeaderDrop($event, index)"
          >
            <span class="th-label">{{ col.label }}</span>
            <!-- 列右边界：拖拽改宽 -->
            <span
              class="resize-handle"
              title="拖动调整列宽"
              @mousedown="onResizeDown($event, index)"
            ><i></i></span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(fr, ri) in flatRows"
          :key="ri"
          :style="{
            ...(fr.depth > 0 ? { paddingLeft: fr.depth * 12 + 'px' } : {}),
            ...fr.row._rowStyle,
          }"
        >
          <td
            v-for="col in visibleColumns"
            :key="col.key"
            :style="tdStyleStr(col, fr.depth)"
          >
            {{ cellText(fr.row, col) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.design-table {
  width: 100%;
  /* 不锁高度、不隐藏溢出：表格按数据行数自然撑开，完整展示（所见即所得） */
  pointer-events: auto;
}
table {
  table-layout: fixed;
}
/* th-cell：仅保留设计期交互/视觉样式（cursor/位置/分隔线），
   加粗/对齐/背景/内边距等「打印相关」样式由 thStyleStr 内联输出（与编译器同构）。 */
.th-cell {
  position: relative;
  cursor: grab;
  user-select: none;
  border-right: 1px dashed var(--pd-border-grid);
  white-space: nowrap;
  overflow: hidden;
}
.th-cell:active {
  cursor: grabbing;
}
.th-cell.drag-source {
  opacity: 0.4;
  background: var(--pd-color-primary-bg);
}
.th-cell.drag-over {
  background: #fff3e0;
  box-shadow: inset -2px 0 0 var(--pd-color-primary);
}
.th-label {
  display: inline-block;
  pointer-events: none;
}
/* 列右边界 resize 手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: var(--pd-z-resize);
  display: flex;
  align-items: center;
  justify-content: center;
}
.resize-handle i {
  width: 2px;
  height: 60%;
  background: var(--pd-border-muted);
  border-radius: 1px;
  transition: background var(--pd-transition-fast);
}
.resize-handle:hover i,
.is-resizing .resize-handle i {
  background: var(--pd-color-primary);
}
td {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
