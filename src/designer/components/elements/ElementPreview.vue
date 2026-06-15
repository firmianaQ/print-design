<script setup lang="ts">
/**
 * 设计期元素预览渲染器（所见即所得）
 *
 * - 非 table 类型：复用编译器 renderElement，输出与打印完全一致的单元格内容
 * - table 类型：交给 DesignTable，提供画布内表头拖拽换序 + 列边界拖拽改宽
 *   编译输出仍由 renderTable 生成（嵌套 table），DesignTable 仅负责设计期交互
 *
 * 布局表格模型下，元素内容不再含定位（position/left/top 已移除），
 * 外层 <td> 由 Canvas 渲染（与 generateHTML 同构），此处只输出单元格内容。
 */
import { computed } from 'vue'
import { renderElement } from '../../compiler/renderElement'
import DesignTable from './DesignTable.vue'
import type { DataSource, TemplateElement } from '../../types'

const props = defineProps<{
  element: TemplateElement
  dataSource?: DataSource
}>()

const isTable = computed(() => props.element.type === 'table')

const html = computed(() => renderElement(props.element, props.dataSource ?? {}))
</script>

<template>
  <div class="element-preview">
    <DesignTable v-if="isTable" :element="element" :data-source="dataSource" />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-else class="element-preview-static" v-html="html"></div>
  </div>
</template>

<style scoped>
.element-preview {
  width: 100%;
}
/* 非交互元素 pointer-events:none，让点击/拖拽落到外层 td（设计期交互层） */
.element-preview-static {
  width: 100%;
  pointer-events: none;
}
</style>
