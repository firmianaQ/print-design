<script setup lang="ts">
/**
 * 右侧：属性配置面板
 *
 * - 可折叠分组，减少滚动
 * - 网格布局紧凑排列同类字段
 * - 按钮组替代下拉框（加粗/斜体/对齐）
 * - 无数据绑定时自动隐藏对应区域
 */
import { computed } from 'vue'
import { injectDesigner } from '../inject'
import type { TableColumn } from '../types'

const props = withDefaults(defineProps<{
  /** 面板宽度（px），由 Designer.vue 拖拽控制 */
  width?: number
}>(), { width: 280 })

const designer = injectDesigner()
const activeElement = designer.activeElement

/** 类型中文标签 + 图标 */
const TYPE_META = {
  value:         { label: '单值',  icon: '📝' },
  'label-value': { label: '键值对', icon: '🏷️' },
  image:         { label: '图片',  icon: '🖼️' },
  table:         { label: '表格',  icon: '📊' },
} as const

/** 对齐选项 */
const ALIGN_OPTIONS = [
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' },
]

/** 列级对齐选项（含"继承"） */
const COL_ALIGN_OPTIONS = [
  { label: '继承', value: 'inherit' },
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' },
]

/** 列跨度选项 */
const COLSPAN_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const v = i + 1
  const tips: Record<number, string> = { 3: '¼', 4: '⅓', 6: '½', 12: '全' }
  return { label: tips[v] ? `${v}（${tips[v]}）` : `${v}`, value: v }
})

/** object-fit 选项 */
const FIT_OPTIONS = [
  { label: '包含', value: 'contain' },
  { label: '覆盖', value: 'cover' },
  { label: '填充', value: 'fill' },
  { label: '原始', value: 'none' },
]

/** 预设色板 */
const SWATCHES = ['#000', '#333', '#666', '#999', '#d00', '#18a058', '#2080f0', '#fff']

const el = computed(() => activeElement.value)

/** 当前元素是否有数据绑定 */
const hasBinding = computed(() => {
  if (!el.value) return false
  return !!(el.value.dataField || el.value.srcField || el.value.rowField || el.value.label !== undefined)
})

/** 表格列 */
const columns = computed<TableColumn[]>(() => el.value?.columns ?? [])

function removeActive(): void { designer.removeActive() }
function setStyle(key: string, value: string): void {
  const t = activeElement.value
  if (t) t.style[key] = value
}
function setFit(value: string): void {
  const t = activeElement.value
  if (t) t.fit = value as typeof t.fit
}
function toggleColumnHidden(col: TableColumn): void { col.hidden = !col.hidden }
function moveColumn(index: number, delta: -1 | 1): void {
  const list = el.value?.columns
  if (!list) return
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const tmp = list[index]
  list[index] = list[target]
  list[target] = tmp
}
</script>

<template>
  <aside class="right-panel" :style="{ width: props.width + 'px' }">
    <!-- 空状态 -->
    <div v-if="!el" class="empty">
      <div class="empty-icon">🎯</div>
      <div class="empty-text">点击画布元素<br>查看属性</div>
    </div>

    <template v-else>
      <!-- 顶部：元素类型 + 名称 + 删除 -->
      <header class="el-header">
        <span class="el-icon">{{ TYPE_META[el.type].icon }}</span>
        <span class="el-name">{{ el.name }}</span>
        <n-tag size="tiny" :bordered="false" type="info">{{ TYPE_META[el.type].label }}</n-tag>
        <n-button size="tiny" quaternary type="error" class="btn-delete" @click="removeActive">
          ✕
        </n-button>
      </header>

      <div class="panel-body">
        <!-- 布局 -->
        <details class="section" open>
          <summary class="section-title">布局</summary>
          <div class="section-content">
            <!-- 行 / 列 / 跨度 一行三列 -->
            <div class="grid-3">
              <div class="field">
                <label class="label">行</label>
                <n-input-number v-model:value="el.row" :min="0" :step="1" :precision="0" size="tiny" />
              </div>
              <div class="field">
                <label class="label">列</label>
                <n-input-number v-model:value="el.col" :min="0" :step="1" :precision="0" size="tiny" />
              </div>
              <div class="field">
                <label class="label">跨度</label>
                <n-select
                  :value="el.colSpan"
                  :options="COLSPAN_OPTIONS"
                  size="tiny"
                  @update:value="(v: number) => { if (el) el.colSpan = v }"
                />
              </div>
            </div>
            <!-- 对齐 / 宽度 一行两列 -->
            <div class="grid-2">
              <div class="field">
                <label class="label">对齐</label>
                <n-select
                  :value="el.align ?? 'left'"
                  :options="ALIGN_OPTIONS"
                  size="tiny"
                  @update:value="(v: 'left' | 'center' | 'right') => { if (el) el.align = v }"
                />
              </div>
              <div class="field">
                <label class="label">宽度</label>
                <n-input-number
                  :value="el.widthPct ?? null"
                  :min="1" :max="100" :step="1" :precision="0"
                  placeholder="自动"
                  size="tiny"
                  @update:value="(v: number | null) => { if (el) el.widthPct = v ?? undefined }"
                >
                  <template #suffix>%</template>
                </n-input-number>
              </div>
            </div>
          </div>
        </details>

        <!-- 文本样式（非图片） -->
        <details v-if="el.type !== 'image'" class="section" open>
          <summary class="section-title">文本样式</summary>
          <div class="section-content">
            <!-- 字号 / 加粗 / 斜体 一行 -->
            <div class="grid-3">
              <div class="field span-1">
                <label class="label">字号</label>
                <n-input-number v-model:value="el.style.fontSize" :min="6" :max="120" :step="1" size="tiny" />
              </div>
              <div class="field">
                <label class="label">粗细</label>
                <n-button-group size="tiny">
                  <n-button
                    :type="el.style.fontWeight !== 'bold' ? 'primary' : 'default'"
                    :secondary="el.style.fontWeight !== 'bold'"
                    @click="setStyle('fontWeight', 'normal')"
                  >常规</n-button>
                  <n-button
                    :type="el.style.fontWeight === 'bold' ? 'primary' : 'default'"
                    :secondary="el.style.fontWeight === 'bold'"
                    @click="setStyle('fontWeight', 'bold')"
                  >加粗</n-button>
                </n-button-group>
              </div>
              <div class="field">
                <label class="label">样式</label>
                <n-button-group size="tiny">
                  <n-button
                    :type="el.style.fontStyle !== 'italic' ? 'primary' : 'default'"
                    :secondary="el.style.fontStyle !== 'italic'"
                    @click="setStyle('fontStyle', 'normal')"
                  >常规</n-button>
                  <n-button
                    :type="el.style.fontStyle === 'italic' ? 'primary' : 'default'"
                    :secondary="el.style.fontStyle === 'italic'"
                    @click="setStyle('fontStyle', 'italic')"
                  >斜体</n-button>
                </n-button-group>
              </div>
            </div>
            <!-- 对齐 / 颜色 一行 -->
            <div class="grid-2">
              <div class="field">
                <label class="label">对齐</label>
                <n-button-group size="tiny">
                  <n-button
                    v-for="opt in ALIGN_OPTIONS"
                    :key="opt.value"
                    :type="(el.style.textAlign ?? 'left') === opt.value ? 'primary' : 'default'"
                    :secondary="(el.style.textAlign ?? 'left') === opt.value"
                    @click="setStyle('textAlign', opt.value)"
                  >{{ opt.label }}</n-button>
                </n-button-group>
              </div>
              <div class="field">
                <label class="label">颜色</label>
                <n-color-picker
                  :value="(el.style.color as string) ?? '#000'"
                  :modes="['hex']"
                  :show-alpha="false"
                  :swatches="SWATCHES"
                  size="tiny"
                  @update:value="(v: string) => setStyle('color', v)"
                />
              </div>
            </div>
          </div>
        </details>

        <!-- 数据绑定（仅在有绑定时显示） -->
        <details v-if="hasBinding" class="section">
          <summary class="section-title">数据绑定</summary>
          <div class="section-content">
            <div class="binding-list">
              <div v-if="el.dataField" class="binding-item">
                <span class="binding-label">字段</span>
                <code class="binding-value">{{ el.dataField }}</code>
              </div>
              <div v-if="el.label !== undefined" class="binding-item">
                <span class="binding-label">标签</span>
                <code class="binding-value">{{ el.label }}</code>
              </div>
              <div v-if="el.srcField" class="binding-item">
                <span class="binding-label">图片</span>
                <code class="binding-value">{{ el.srcField }}</code>
              </div>
              <div v-if="el.rowField" class="binding-item">
                <span class="binding-label">行数据</span>
                <code class="binding-value">{{ el.rowField }}</code>
              </div>
            </div>
          </div>
        </details>

        <!-- 图片设置 -->
        <details v-if="el.type === 'image'" class="section" open>
          <summary class="section-title">图片设置</summary>
          <div class="section-content">
            <div class="field">
              <label class="label">填充模式</label>
              <n-select
                :value="el.fit ?? 'contain'"
                :options="FIT_OPTIONS"
                size="tiny"
                @update:value="(v: string) => setFit(v)"
              />
            </div>
          </div>
        </details>

        <!-- 表格样式（先配整体样式） -->
        <details v-if="el.type === 'table'" class="section" open>
          <summary class="section-title">表格样式</summary>
          <div class="section-content">
            <!-- 开关 -->
            <div class="grid-2">
              <div class="field">
                <label class="label">表头</label>
                <n-switch
                  :value="el.showHeader !== false"
                  size="small"
                  @update:value="(v: boolean) => { if (el) el.showHeader = v }"
                />
              </div>
              <div class="field">
                <label class="label">表格线</label>
                <n-switch v-model:value="el.bordered" size="small" />
              </div>
            </div>
            <!-- 线宽/线色 -->
            <div v-if="el.bordered" class="grid-2">
              <div class="field">
                <label class="label">线宽</label>
                <n-input-number
                  v-model:value="el.borderWidth"
                  :min="0" :max="10" :step="1" :precision="0"
                  placeholder="1"
                  size="tiny"
                >
                  <template #suffix>px</template>
                </n-input-number>
              </div>
              <div class="field">
                <label class="label">线色</label>
                <n-color-picker
                  :value="el.borderColor ?? '#000'"
                  :modes="['hex']" :show-alpha="false"
                  :swatches="SWATCHES" size="tiny"
                  @update:value="(v: string) => { if (el) el.borderColor = v }"
                />
              </div>
            </div>
            <!-- 对齐 -->
            <div class="grid-2">
              <div class="field">
                <label class="label">表头对齐</label>
                <n-button-group size="tiny">
                  <n-button
                    v-for="opt in ALIGN_OPTIONS"
                    :key="opt.value"
                    :type="(el.headerAlign ?? 'left') === opt.value ? 'primary' : 'default'"
                    :secondary="(el.headerAlign ?? 'left') === opt.value"
                    @click="() => { if (el) el.headerAlign = opt.value as typeof el.headerAlign }"
                  >{{ opt.label }}</n-button>
                </n-button-group>
              </div>
              <div class="field">
                <label class="label">内容对齐</label>
                <n-button-group size="tiny">
                  <n-button
                    v-for="opt in ALIGN_OPTIONS"
                    :key="opt.value"
                    :type="(el.bodyAlign ?? 'left') === opt.value ? 'primary' : 'default'"
                    :secondary="(el.bodyAlign ?? 'left') === opt.value"
                    @click="() => { if (el) el.bodyAlign = opt.value as typeof el.bodyAlign }"
                  >{{ opt.label }}</n-button>
                </n-button-group>
              </div>
            </div>
            <!-- 内距 / 粗体 -->
            <div class="grid-2">
              <div class="field">
                <label class="label">单元格内距</label>
                <n-input-number
                  v-model:value="el.cellPadding"
                  :min="0" :max="20" :step="1" :precision="0"
                  placeholder="0"
                  size="tiny"
                >
                  <template #suffix>px</template>
                </n-input-number>
              </div>
              <div class="field">
                <label class="label">表头粗体</label>
                <n-switch
                  :value="el.headerBold !== false"
                  size="small"
                  @update:value="(v: boolean) => { if (el) el.headerBold = v }"
                />
              </div>
            </div>
            <!-- 表头字号 / 文字色 / 背景色 -->
            <div class="grid-3">
              <div class="field">
                <label class="label">表头字号</label>
                <n-input-number
                  v-model:value="el.headerFontSize"
                  :min="6" :max="72" :step="1" :precision="0"
                  placeholder="继承"
                  size="tiny"
                />
              </div>
              <div class="field">
                <label class="label">表头文字色</label>
                <n-color-picker
                  :value="el.headerColor ?? '#000'"
                  :modes="['hex']" :show-alpha="false"
                  :swatches="SWATCHES" size="tiny"
                  @update:value="(v: string) => { if (el) el.headerColor = v }"
                />
              </div>
              <div class="field">
                <label class="label">表头背景</label>
                <n-color-picker
                  :value="el.headerBgColor ?? '#ffffff'"
                  :modes="['hex']" :show-alpha="false"
                  :swatches="SWATCHES" size="tiny"
                  @update:value="(v: string) => { if (el) el.headerBgColor = v }"
                />
              </div>
            </div>
          </div>
        </details>

        <!-- 列配置（后配每列细节） -->
        <details v-if="el.type === 'table' && el.columns" class="section" open>
          <summary class="section-title">
            列配置
            <span class="section-hint">画布可拖拽</span>
          </summary>
          <div class="section-content">
            <div class="col-list">
              <div
                v-for="(col, index) in columns"
                :key="col.key"
                class="col-item"
                :class="{ 'is-hidden': col.hidden }"
              >
                <div class="col-row1">
                  <code class="col-field" :title="col.dataField">{{ col.dataField }}</code>
                  <n-switch
                    :value="!col.hidden"
                    size="small"
                    @update:value="() => toggleColumnHidden(col)"
                  />
                </div>
                <div class="col-row2">
                  <n-input v-model:value="col.label" size="tiny" placeholder="列名" class="col-name-input" />
                  <n-input-number
                    v-model:value="col.widthMM"
                    :min="0" :step="1" :precision="1"
                    placeholder="自动"
                    size="tiny" style="width: 80px"
                  >
                    <template #suffix>mm</template>
                  </n-input-number>
                  <n-select
                    :value="col.align ?? 'inherit'"
                    :options="COL_ALIGN_OPTIONS"
                    size="tiny" style="width: 72px"
                    @update:value="(v: string) => { col.align = v === 'inherit' ? undefined : (v as typeof col.align) }"
                  />
                  <n-button-group size="tiny">
                    <n-button :disabled="index === 0" quaternary @click="moveColumn(index, -1)">↑</n-button>
                    <n-button :disabled="index === columns.length - 1" quaternary @click="moveColumn(index, 1)">↓</n-button>
                  </n-button-group>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </template>
  </aside>
</template>

<style scoped>
/* ── 面板骨架 ── */
.right-panel {
  flex-shrink: 0;
  background: var(--pd-bg-panel);
  border-left: 1px solid var(--pd-border-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 空状态 ── */
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--pd-space-4);
  color: var(--pd-text-faint);
}
.empty-icon { font-size: 32px; opacity: 0.6; }
.empty-text {
  font-size: var(--pd-font-base);
  text-align: center;
  line-height: 1.6;
}

/* ── 元素头部 ── */
.el-header {
  display: flex;
  align-items: center;
  gap: var(--pd-space-3);
  padding: var(--pd-space-5) var(--pd-space-6);
  background: var(--pd-bg-white);
  border-bottom: 1px solid var(--pd-border-light);
}
.el-icon { font-size: var(--pd-font-xxl); }
.el-name {
  flex: 1;
  font-size: var(--pd-font-md);
  font-weight: var(--pd-weight-semibold);
  color: var(--pd-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-delete { margin-left: auto; }

/* ── 内容滚动区 ── */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--pd-space-2) 0 var(--pd-space-8);
}

/* ── 可折叠分组 ── */
.section {
  margin: 0;
  border-bottom: 1px solid var(--pd-border-light);
}
.section[open] {
  background: var(--pd-bg-white);
}
.section-title {
  display: flex;
  align-items: center;
  gap: var(--pd-space-2);
  padding: var(--pd-space-4) var(--pd-space-6);
  font-size: var(--pd-font-sm);
  font-weight: var(--pd-weight-semibold);
  color: var(--pd-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.section-title::-webkit-details-marker { display: none; }
.section-title::before {
  content: '▸';
  font-size: var(--pd-font-xs);
  transition: transform var(--pd-transition-fast);
  color: var(--pd-text-faint);
}
.section[open] > .section-title::before {
  transform: rotate(90deg);
}
.section-title:hover { color: var(--pd-text-regular); }
.section-hint {
  font-size: var(--pd-font-xs);
  font-weight: var(--pd-weight-normal);
  color: var(--pd-text-muted);
  text-transform: none;
  letter-spacing: 0;
  margin-left: var(--pd-space-2);
}
.section-content {
  padding: 0 var(--pd-space-6) var(--pd-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--pd-space-4);
}

/* ── 网格布局 ── */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pd-space-4);
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--pd-space-4);
}

/* ── 字段 ── */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--pd-space-1);
  min-width: 0;
}
.label {
  font-size: var(--pd-font-xs);
  color: var(--pd-text-disabled);
  white-space: nowrap;
}

/* ── 数据绑定 ── */
.binding-list {
  display: flex;
  flex-direction: column;
  gap: var(--pd-space-2);
}
.binding-item {
  display: flex;
  align-items: center;
  gap: var(--pd-space-4);
  padding: var(--pd-space-2) var(--pd-space-4);
  background: var(--pd-bg-subtle);
  border-radius: var(--pd-radius-base);
}
.binding-label {
  font-size: var(--pd-font-xs);
  color: var(--pd-text-placeholder);
  flex-shrink: 0;
}
.binding-value {
  font-size: var(--pd-font-sm);
  color: var(--pd-text-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 列配置 ── */
.col-list {
  display: flex;
  flex-direction: column;
  gap: var(--pd-space-3);
}
.col-item {
  padding: var(--pd-space-3) var(--pd-space-4);
  background: var(--pd-bg-subtle);
  border: 1px solid var(--pd-border-light);
  border-radius: var(--pd-radius-base);
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.col-item.is-hidden {
  opacity: 0.4;
}
.col-row1 {
  display: flex;
  align-items: center;
  gap: var(--pd-space-3);
}
.col-field {
  flex: 1;
  font-size: var(--pd-font-xs);
  color: var(--pd-text-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.col-row2 {
  display: flex;
  align-items: center;
  gap: var(--pd-space-2);
}
.col-name-input {
  flex: 1;
  min-width: 0;
}
</style>
