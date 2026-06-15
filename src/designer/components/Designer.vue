<script setup lang="ts">
/**
 * Designer —— 三栏布局容器
 *
 * 标准的"左-中-右"三栏布局。在顶层实例化 useDesigner 并 provide 下发，
 * 三个子面板 inject 拿同一实例（严格禁用 Pinia/Vuex）。
 * 右侧面板支持拖拽调整宽度（240px ~ 480px）。
 */
import { ref } from 'vue'
import { useDesigner } from '../useDesigner'
import { provideDesigner } from '../inject'
import type { TemplateSchema } from '../types'
import LeftPanel from './LeftPanel.vue'
import Canvas from './Canvas.vue'
import RightPanel from './RightPanel.vue'

const props = defineProps<{
  /** 初始 schema（可选）；不传则用默认空画布 */
  initial?: Partial<TemplateSchema>
  /** 初始数据源（可选）；传入后 ElementPreview 可渲染动态数据 */
  initialDataSource?: Record<string, unknown>
}>()

const designer = useDesigner(props.initial)
if (props.initialDataSource) designer.setDataSource(props.initialDataSource)
provideDesigner(designer)

// ---- 右侧面板拖拽调宽 ----

/** 右侧面板宽度（px） */
const rightWidth = ref(280)
/** 最小 / 最大宽度约束 */
const RIGHT_MIN = 240
const RIGHT_MAX = 480

/** 拖拽状态：记录起始鼠标 X 和起始面板宽度 */
let dragStartX = 0
let dragStartW = 0

/** 鼠标按下 resize handle → 开始拖拽 */
function onResizeStart(e: MouseEvent): void {
  e.preventDefault()
  dragStartX = e.clientX
  dragStartW = rightWidth.value
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

/** 鼠标移动 → 实时更新面板宽度 */
function onResizeMove(e: MouseEvent): void {
  const delta = dragStartX - e.clientX // 向左拖动 → delta 正值 → 面板变宽
  rightWidth.value = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, dragStartW + delta))
}

/** 鼠标松开 → 结束拖拽 */
function onResizeEnd(): void {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 暴露 designer 实例与 schema 给父组件（预览、导出等）
defineExpose({
  designer,
  schema: designer.schema,
  exportSchema: designer.exportSchema,
  loadSchema: designer.loadSchema,
})
</script>

<template>
  <div class="designer-layout">
    <LeftPanel />
    <Canvas />
    <div class="resize-handle" @mousedown="onResizeStart" />
    <RightPanel :width="rightWidth" />
  </div>
</template>

<style scoped>
.designer-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--pd-bg-white);
  overflow: hidden;
}
.resize-handle {
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background var(--pd-transition-fast);
  position: relative;
}
.resize-handle::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--pd-border-base);
}
.resize-handle:hover {
  background: var(--pd-color-primary);
}
.resize-handle:hover::after {
  background: transparent;
}
</style>
