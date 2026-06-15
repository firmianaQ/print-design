<script setup lang="ts">
/**
 * 左侧：动态物料面板
 *
 * - 数据注入：列表从 useDesigner.materials 读取（按当前 documentType 过滤），不写死
 * - 交互逻辑：点击添加 / 再点删除。每个物料在一套模板里只允许一个实例
 *   （已添加的物料高亮显示「已添加」，再点即从画布移除）
 */
import { injectDesigner } from '../inject'
import type { MaterialItem } from '../types'

const designer = injectDesigner()
const materials = designer.materials

const TYPE_LABEL: Record<MaterialItem['type'], string> = {
  value: '单值',
  'label-value': '键值对',
  image: '图片',
  table: '表格',
}

/** 该物料是否已添加到画布（按 name 去重，同 documentType 内 name 唯一） */
function isAdded(m: MaterialItem): boolean {
  return !!designer.findElementByMaterialName(m.name)
}

/** 点击物料：已添加则删除，未添加则添加 */
function onClickMaterial(m: MaterialItem): void {
  designer.toggleMaterial(m)
}
</script>

<template>
  <aside class="left-panel">
    <header class="panel-header">
      <span class="panel-title">物料库</span>
      <n-tag size="small" type="info" round>{{ designer.schema.documentType }}</n-tag>
    </header>

    <div class="hint">点击添加，再次点击移除</div>

    <div class="material-list">
      <div
        v-for="m in materials"
        :key="m.name"
        class="material-card"
        :class="{ 'is-added': isAdded(m) }"
        @click="onClickMaterial(m)"
        :title="isAdded(m) ? `${m.name}（已添加）— 点击移除` : `${m.name}（${TYPE_LABEL[m.type]}）— 点击添加`"
      >
        <span class="material-icon">{{ m.icon }}</span>
        <span class="material-name">{{ m.name }}</span>
        <n-tag v-if="isAdded(m)" size="tiny" type="success" :bordered="false" round>已添加</n-tag>
        <n-tag v-else size="tiny" :bordered="false">{{ TYPE_LABEL[m.type] }}</n-tag>
      </div>

      <div v-if="materials.length === 0" class="empty-tip">
        当前单据类型无可用物料
      </div>
    </div>
  </aside>
</template>

<style scoped>
.left-panel {
  width: 220px;
  flex-shrink: 0;
  background: var(--pd-bg-panel);
  border-right: 1px solid var(--pd-border-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: var(--pd-space-6) var(--pd-space-7);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--pd-border-light);
}
.panel-title {
  font-size: var(--pd-font-lg);
  font-weight: var(--pd-weight-semibold);
  color: var(--pd-text-primary);
}
.hint {
  padding: var(--pd-space-3) var(--pd-space-7);
  font-size: var(--pd-font-sm);
  color: var(--pd-text-disabled);
  border-bottom: 1px solid var(--pd-border-light);
}
.material-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--pd-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--pd-space-4);
}
.material-card {
  display: flex;
  align-items: center;
  gap: var(--pd-space-4);
  padding: var(--pd-space-5) var(--pd-space-6);
  background: var(--pd-bg-white);
  border: 1px solid var(--pd-border-card);
  border-radius: var(--pd-radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--pd-transition-fast);
}
.material-card:hover {
  border-color: var(--pd-color-primary);
  box-shadow: 0 2px 6px var(--pd-color-primary-shadow);
  transform: translateY(-1px);
}
/* 已添加：绿色高亮，提示再点即删除 */
.material-card.is-added {
  border-color: var(--pd-color-primary);
  background: var(--pd-color-primary-hover);
}
.material-card.is-added:hover {
  border-color: var(--pd-color-danger);
  background: var(--pd-color-danger-light);
  box-shadow: 0 2px 6px var(--pd-color-danger-shadow);
}
.material-card.is-added:hover .material-name {
  color: var(--pd-color-danger);
}
.material-icon {
  font-size: var(--pd-font-display);
  line-height: 1;
}
.material-name {
  flex: 1;
  font-size: var(--pd-font-md);
  color: var(--pd-text-primary);
}
.empty-tip {
  padding: var(--pd-space-12) var(--pd-space-6);
  text-align: center;
  color: var(--pd-text-disabled);
  font-size: var(--pd-font-base);
}
</style>
