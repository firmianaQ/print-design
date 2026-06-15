<script setup lang="ts">
/**
 * 应用入口：工具栏 + 设计器 + 预览
 *
 * 工具栏功能：
 *   - 演示模板切换（后厨小票 / 客人登记单 / 收银结账单）
 *   - 纸张类型切换（驱动纸张适配引擎）
 *   - 单据类型切换（驱动左栏物料过滤）
 *   - 清空画布 / 导出 schema（JSON）/ 预览打印 HTML
 */
import { ref } from 'vue'
import { Designer, PAPER_OPTIONS, type PaperType } from './index'
import { DEMO_TEMPLATES, DEFAULT_DEMO, findDemo, registerDemoMaterials } from './demo'
import { exportHTML, previewHTML } from './demo/preview'

// 应用启动时注册演示物料（业务方替换为自定义物料）
registerDemoMaterials()

const designerRef = ref<InstanceType<typeof Designer> | null>(null)

/** 演示模板下拉选项 */
const demoOptions = DEMO_TEMPLATES.map((t) => ({ label: t.label, value: t.key }))

/** 当前选中的演示模板 key */
const currentDemo = ref(DEFAULT_DEMO.key)

/** 当前纸张类型（v-model 同步） */
const paperType = ref<PaperType>(DEFAULT_DEMO.schema.paper.type)

/** 当前演示模板的数据源（预览/输出 HTML 用） */
const currentData = ref(DEFAULT_DEMO.dataSource)

/** 初始 schema：默认演示模板 */
const initialSchema = ref(DEFAULT_DEMO.schema)

/** 切换纸张 */
function onPaperChange(type: PaperType): void {
  designerRef.value?.designer.setPaper(type)
}

/** 切换演示模板：加载对应 schema + 数据源，同步纸张。
 *  单据类型（documentType）由 schema 自带，loadSchema 后左栏物料自动按它过滤。 */
function onDemoChange(key: string): void {
  const demo = findDemo(key)
  if (!demo) return
  currentDemo.value = key
  currentData.value = demo.dataSource
  designerRef.value?.loadSchema(demo.schema)
  designerRef.value?.designer.setDataSource(demo.dataSource)
  paperType.value = demo.schema.paper.type
}

/** 清空画布 */
function clearCanvas(): void {
  designerRef.value?.designer.clearCanvas()
}

/** 导出 schema JSON */
function exportSchema(): void {
  const schema = designerRef.value?.exportSchema()
  if (!schema) return
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'print-template.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** 取当前画布编译出的 HTML（预览与输出控制台共用同一份产物） */
function buildHTML(): string | null {
  const schema = designerRef.value?.exportSchema()
  if (!schema) return null
  return exportHTML(schema, currentData.value)
}

/** 预览打印：在新窗口展示编译产物 */
function onPreview(): void {
  const html = buildHTML()
  if (!html) return
  previewHTML(html)
}

/** 把编译产物输出到控制台（调试用） */
function logHTML(): void {
  const html = buildHTML()
  if (html) console.log(html)
}
</script>

<template>
  <div class="app">
    <header class="toolbar">
      <div class="toolbar-left">
        <span class="brand">🖨️ 打印模板设计器</span>
      </div>
      <div class="toolbar-right">
        <n-space :size="8" align="center">
          <span class="field-label">演示</span>
          <n-select
            v-model:value="currentDemo"
            :options="demoOptions"
            size="small"
            style="width: 180px"
            @update:value="onDemoChange"
          />
          <span class="field-label">纸张</span>
          <n-select
            v-model:value="paperType"
            :options="PAPER_OPTIONS"
            size="small"
            style="width: 170px"
            @update:value="onPaperChange"
          />
          <n-divider vertical />
          <n-button size="small" @click="clearCanvas">清空</n-button>
          <n-button size="small" @click="exportSchema">导出 JSON</n-button>
          <n-button size="small" @click="logHTML">输出 HTML</n-button>
          <n-button size="small" type="primary" @click="onPreview">预览打印</n-button>
        </n-space>
      </div>
    </header>

    <main class="designer-wrap">
      <Designer ref="designerRef" :initial="initialSchema" :initial-data-source="currentData" />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.toolbar {
  height: 52px;
  flex-shrink: 0;
  background: var(--pd-bg-white);
  border-bottom: 1px solid var(--pd-border-base);
  padding: 0 var(--pd-space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: var(--pd-font-xl);
  font-weight: var(--pd-weight-semibold);
  color: var(--pd-text-primary);
}
.field-label {
  font-size: var(--pd-font-base);
  color: var(--pd-text-placeholder);
  white-space: nowrap;
}
.designer-wrap {
  flex: 1;
  overflow: hidden;
}
</style>
