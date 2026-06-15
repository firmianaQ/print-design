<script setup lang="ts">
/**
 * 中间：核心画布编辑区（布局表格模型）
 *
 * - 纸张适配：根据 schema.paper 动态改变容器宽度（高度由内容流式决定）
 * - 行分组渲染：按 row 分组，同 row 元素并排；行高由内容决定
 * - 行标记：每行画「行 N」标签 + 分隔，用户直观看到行结构
 * - 拖入物料：落到行间隙 = 在此插入新行；落到画布末尾 = 追加新行
 * - 元素操作：点击选中；选中后右栏编辑；行内/行间可通过右栏调整 row/col
 *
 * 注意：已移除 vue3-draggable-resizable（布局表格模型不需要绝对定位 + 缩放手柄）。
 */
import { ref } from 'vue'
import { injectDesigner } from '../inject'
import ElementPreview from './elements/ElementPreview.vue'
import type { MaterialItem, TemplateElement } from '../types'
import { GRID_COLUMNS } from '../types'

const designer = injectDesigner()
const schema = designer.schema
const rows = designer.rows

const canvasRef = ref<HTMLElement | null>(null)

const dragOverGap = ref<number | null>(null)

/** 行间隙 drop 区：在此处插入新行（接受物料拖拽 + 现有元素拖拽两种来源） */
function onGapDragOver(event: DragEvent, beforeRow: number | null): void {
  event.preventDefault()
  event.stopPropagation()
  // 物料=copy，元素换位=move
  const isElement = !!draggingElId.value
  if (event.dataTransfer) event.dataTransfer.dropEffect = isElement ? 'move' : 'copy'
  dragOverGap.value = beforeRow
}

function onGapDrop(event: DragEvent, beforeRow: number | null): void {
  event.preventDefault()
  event.stopPropagation()
  dragOverGap.value = null

  // 情况一：拖现有元素到间隙 → 抽出成新行
  if (draggingElId.value) {
    const id = draggingElId.value
    draggingElId.value = null
    if (beforeRow == null) {
      // 末尾追加：直接放到最大行 +1
      designer.moveElementToNewRow(id, designer.maxRow.value + 1)
    } else {
      designer.moveElementToNewRow(id, beforeRow)
    }
    return
  }

  // 情况二：拖物料到间隙 → 新建元素成新行
  const raw = event.dataTransfer?.getData('application/x-print-material')
  if (!raw) return
  let material: MaterialItem
  try {
    material = JSON.parse(raw)
  } catch {
    return
  }
  if (beforeRow != null) designer.insertRow(beforeRow)
  const el = designer.addFromMaterial(material)
  if (beforeRow != null) {
    el.row = beforeRow
    el.col = 0
  }
}

/** 选中元素 */
function onSelectElement(el: TemplateElement, event: MouseEvent): void {
  event.stopPropagation()
  designer.selectElement(el.id)
}

/** 点击画布空白处取消选中 */
function onCanvasClick(): void {
  designer.selectElement(null)
}

/** 整行上移/下移（交换两行的 row 值） */
function moveRow(row: number, delta: -1 | 1): void {
  const rowNumbers = rows.value.map((r) => r[0])
  const idx = rowNumbers.indexOf(row)
  const targetIdx = idx + delta
  if (targetIdx < 0 || targetIdx >= rowNumbers.length) return
  const targetRow = rowNumbers[targetIdx]
  // 交换两行所有元素的 row 值（用临时值避免冲突）
  const elsA = schema.elements.filter((e) => e.row === row)
  const elsB = schema.elements.filter((e) => e.row === targetRow)
  const TMP = -9999
  elsA.forEach((e) => (e.row = TMP))
  elsB.forEach((e) => (e.row = row))
  elsA.forEach((e) => (e.row = targetRow))
}

/** 删除元素 */
function deleteElement(el: TemplateElement): void {
  designer.removeElement(el.id)
}

/** 删除整行（该行所有元素），removeElement 会处理行号空洞 */
function deleteRow(row: number): void {
  const ids = schema.elements.filter((e) => e.row === row).map((e) => e.id)
  // 逐个删除；removeElement 在行变空时会上移后续行补齐
  ids.forEach((id) => designer.removeElement(id))
}

/** 拖入元素到指定行/列（HTML5 DnD 换位） */
const draggingElId = ref<string | null>(null)
function onElDragStart(event: DragEvent, el: TemplateElement): void {
  draggingElId.value = el.id
  event.stopPropagation() // 避免冒泡触发物料 drop
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', el.id)
  }
}
/** 拖拽结束（无论是否 drop 成功）兜底清理 draggingElId，避免状态残留 */
function onElDragEnd(): void {
  draggingElId.value = null
  dragOverGap.value = null
}
function onElDragOver(event: DragEvent, _el: TemplateElement): void {
  // 仅响应「元素换位」（dataTransfer 含元素 id），不响应物料拖入
  void _el
  if (!draggingElId.value) return
  event.preventDefault()
  event.stopPropagation()
}
function onElDrop(event: DragEvent, target: TemplateElement): void {
  if (!draggingElId.value) return
  event.preventDefault()
  event.stopPropagation()
  const sourceId = draggingElId.value
  draggingElId.value = null
  if (sourceId === target.id) return
  // 换到目标元素的行/列位置（同元素之间换 col）
  designer.moveElement(sourceId, target.row, target.col)
}

const activeId = designer.activeId

/**
 * 单元格样式 —— 与编译器 generateHTML 的 renderCell 同构，保证所见即所得。
 * vertical-align:top + text-align(来自 el.align) + widthPct（若指定）。
 */
function cellStyle(el: TemplateElement): Record<string, string | number> {
  const s: Record<string, string | number> = {
    verticalAlign: 'top',
    textAlign: el.align ?? 'left',
  }
  if (el.widthPct != null) s.width = `${el.widthPct}%`
  return s
}
</script>

<template>
  <main class="canvas-area">
    <div class="canvas-scroll">
      <div class="paper-meta">
        {{ schema.paper.widthMM }}mm
        <template v-if="schema.paper.heightMM">× {{ schema.paper.heightMM }}mm</template>
        <template v-else>连续纸</template>
        · 宽 {{ Math.round(designer.canvasWidthPx.value) }}px · 布局表 {{ GRID_COLUMNS }} 列
      </div>

      <div
        ref="canvasRef"
        class="designer-paper"
        :style="{ width: designer.canvasWidthPx.value + 'px', minHeight: designer.canvasHeightPx.value + 'px' }"
        @click="onCanvasClick"
      >
        <!-- 顶部行间隙 drop 区：插入到第 0 行之前 -->
        <div
          class="row-gap"
          :class="{ active: dragOverGap === 0 }"
          @dragover="onGapDragOver($event, 0)"
          @dragleave="dragOverGap = null"
          @drop="onGapDrop($event, 0)"
        >
          <span class="gap-hint">＋ 拖到此处插入新行</span>
        </div>

        <!--
          所见即所得：每行渲染为真实 <table>（与编译输出 generateHTML 同构）。
          - table 宽度=纸宽、border-collapse、12 列 colgroup、table-layout:fixed
          - 元素渲染为 <td colspan>，内容复用编译器 renderElement
          这样画布上的列宽、并排、行高、对齐都与打印输出完全一致。
          设计期交互（行标记/选中/按钮）放在表格外部的控件条与单元格覆盖层，不污染 table 结构。
          每行下方紧跟一个行间隙 drop 区，支持把现有元素拖到两行之间抽出成新行。
        -->
        <template v-for="([row, els]) in rows" :key="'row-' + row">
        <div
          class="layout-row"
          :class="{ 'has-selected': els.some((e) => e.id === activeId) }"
        >
          <div class="row-header" @click.stop>
            <span class="row-label">行 {{ row }}</span>
            <span class="row-count">{{ els.length }} 个元素</span>
          </div>

          <!-- 行操作：浮在纸张右外侧（上移/下移/删除），与行顶部对齐 -->
          <div class="row-actions-right" @click.stop>
            <n-button size="tiny" quaternary :disabled="rows[0]?.[0] === row" title="整行上移" @click.stop="moveRow(row, -1)">↑</n-button>
            <n-button size="tiny" quaternary :disabled="rows[rows.length - 1]?.[0] === row" title="整行下移" @click.stop="moveRow(row, 1)">↓</n-button>
            <n-button size="tiny" quaternary type="error" ghost title="删除该行所有元素" @click.stop="deleteRow(row)">删行</n-button>
          </div>

          <table class="row-table">
            <colgroup>
              <col v-for="i in GRID_COLUMNS" :key="i" />
            </colgroup>
            <tbody>
              <tr>
                <td
                  v-for="el in els"
                  :key="el.id"
                  :colspan="el.colSpan"
                  class="cell"
                  :class="{ 'is-selected': activeId === el.id }"
                  :style="cellStyle(el)"
                  draggable="true"
                  @click="onSelectElement(el, $event)"
                  @dragstart="onElDragStart($event, el)"
                  @dragend="onElDragEnd"
                  @dragover="onElDragOver($event, el)"
                  @drop="onElDrop($event, el)"
                >
                  <span class="cell-tag">{{ el.name }}</span>
                  <div class="cell-content">
                    <ElementPreview :element="el" :data-source="designer.dataSource.value" />
                  </div>
                  <!-- 选中时右上角浮删除按钮；左右换列移到右侧行操作区 -->
                  <div class="cell-delete" v-if="activeId === el.id" @click.stop>
                    <n-button size="tiny" quaternary type="error" title="删除元素" @click.stop="deleteElement(el)">删除</n-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 行间隙 drop 区：插入到下一行之前（接受物料 + 现有元素拖拽）。
             末尾行（最后一项）的间隙即「追加新行」入口，无需单独的末尾区。 -->
        <div
          class="row-gap"
          :class="{ active: dragOverGap === row + 1 }"
          @dragover="onGapDragOver($event, row + 1)"
          @dragleave="dragOverGap = null"
          @drop="onGapDrop($event, row + 1)"
        >
          <span class="gap-hint">＋ 拖到此处插入新行</span>
        </div>
        </template>

        <div v-if="schema.elements.length === 0" class="canvas-empty">
          从左侧拖入物料到行间隙开始设计
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 工作区：深灰背景，比纸张大，突出纸张边界 */
.canvas-area {
  flex: 1;
  background: var(--pd-bg-page);
  overflow: auto;
  background-image:
    linear-gradient(var(--pd-border-gridline) 1px, transparent 1px),
    linear-gradient(90deg, var(--pd-border-gridline) 1px, transparent 1px);
  background-size: 20px 20px;
}
.canvas-scroll {
  min-height: 100%;
  /* 左右留足空间：左侧行信息(56px) + 右侧行操作(120px)，用不对称 padding */
  padding: var(--pd-space-20) 130px var(--pd-space-20) 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pd-space-6);
}
.paper-meta {
  font-size: var(--pd-font-base);
  color: var(--pd-text-secondary);
  font-family: monospace;
  background: var(--pd-bg-white);
  padding: var(--pd-space-2) var(--pd-space-5);
  border-radius: var(--pd-radius-base);
  box-shadow: var(--pd-shadow-base);
}
/* 纸张：白底 + 明确边界（边框+阴影），不设 padding（避免 border-box 吃掉内容宽度）。
   宽度 = 纸宽 px；row-table width:100% = 纸宽，与编译输出根表(满纸宽)一致。
   注意：不设 overflow:hidden，否则会裁剪行操作按钮（浮在纸张右外侧），
   溢出裁剪下沉到 td.cell 级别处理。 */
.designer-paper {
  position: relative;
  background: var(--pd-bg-white);
  border: 1px solid var(--pd-border-paper);
  box-shadow: var(--pd-shadow-paper);
  padding: 0;
  /* overflow 改为单元格级裁剪，避免裁剪行操作按钮 */
}
/* 行间隙 drop 区：默认发丝细线（近乎不可见，不占视觉空间），
   鼠标接近(:hover)或拖入(.active)时展开显示。避免常驻一堆提示让画布杂乱。 */
.row-gap {
  height: 2px;
  margin: var(--pd-space-1) 0;
  border-radius: var(--pd-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--pd-transition-fast);
  background: transparent;
}
.row-gap:hover {
  height: 12px;
  background: var(--pd-color-primary-light);
}
.row-gap.active {
  height: 36px;
  border: 1px dashed var(--pd-color-primary);
  background: var(--pd-color-primary-bg);
}
.gap-hint {
  font-size: var(--pd-font-sm);
  color: var(--pd-text-faint);
  display: none;
}
.row-gap.active .gap-hint {
  display: inline;
  color: var(--pd-color-primary);
}
.layout-row {
  position: relative;
  margin-bottom: var(--pd-space-3);
  background: var(--pd-bg-white);
  overflow: visible;
  border-radius: var(--pd-radius-base);
  box-shadow: var(--pd-shadow-sm);
}
.layout-row.has-selected {
  box-shadow: var(--pd-shadow-selected);
}
/* 行标签：绝对定位到纸张左外侧，横向一行（行 N · N 个元素），右端贴近纸张左边缘。
   默认隐藏，仅在该行被选中（.has-selected）时显示。 */
.row-header {
  position: absolute;
  right: 100%;
  top: 0;
  margin-right: var(--pd-space-3);
  display: none;
  flex-direction: row;
  align-items: center;
  gap: var(--pd-space-3);
  padding: var(--pd-space-2) var(--pd-space-3);
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--pd-radius-base);
  box-shadow: var(--pd-shadow-md);
  height: 32px;
}
.layout-row.has-selected .row-header {
  display: flex;
}
.row-label {
  font-size: var(--pd-font-sm);
  font-weight: var(--pd-weight-semibold);
  color: var(--pd-text-secondary);
  white-space: nowrap;
}
.row-count {
  font-size: var(--pd-font-xs);
  color: var(--pd-text-faint);
}
/* 行操作：浮在纸张右外侧，横向一行（↑ ↓ 删行），左端贴近纸张右边缘。
   默认隐藏，仅在该行被选中（.has-selected）时显示。 */
.row-actions-right {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: var(--pd-space-3);
  display: none;
  flex-direction: row;
  align-items: center;
  gap: var(--pd-space-3);
  padding: var(--pd-space-2) var(--pd-space-3);
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--pd-radius-base);
  box-shadow: var(--pd-shadow-md);
  height: 32px;
}
.layout-row.has-selected .row-actions-right {
  display: flex;
}
/* 行表格：与编译输出同构 —— 纸宽、border-collapse、12 列、table-layout:fixed。
   关键：cell 的 padding 必须为 0 —— 编译输出的 <td> 无 padding，
   若画布 cell 有 padding，内层 width:100% 的表格会被挤窄、列被裁，导致与预览不一致。 */
.row-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.row-table td.cell {
  border: 1px dashed transparent;
  vertical-align: top;
  padding: 0;
  cursor: pointer;
  position: relative;
  overflow: hidden; /* 裁剪单元格内溢出内容，替代 paper 级 overflow */
}
.row-table td.cell:hover {
  border-color: var(--pd-border-muted);
}
.row-table td.cell.is-selected {
  border-color: var(--pd-color-primary);
  background: var(--pd-color-primary-hover);
}
/* 选中时的内边距：给顶部标签留位置，避免内容跳动 */
.cell-tag {
  display: block;
  font-size: var(--pd-font-xs);
  color: var(--pd-text-placeholder);
  margin-bottom: var(--pd-space-1);
}
.row-table td.cell:not(.is-selected) .cell-tag {
  display: none;
}
.cell-content {
  /* 不设 overflow/height：内容（含嵌套表格）需完整展开，所见即所得 */
  min-height: 16px;
}
/* 选中时右上角浮删除按钮（绝对定位到单元格右上角，不占内容空间） */
.cell-delete {
  position: absolute;
  top: 0;
  right: 0;
  z-index: var(--pd-z-overlay);
}
.canvas-empty {
  color: var(--pd-text-faint);
  font-size: var(--pd-font-md);
  text-align: center;
  padding: var(--pd-space-20) 0;
}
</style>
