# @print-design/vue

轻量级、数据驱动的 Vue 3 打印模板设计器。可视化拖拽排版，编译生成带 `@page` 打印指令的纯 HTML 字符串，兼容 Lodop。

## 安装

```bash
pnpm add @print-design/vue
pnpm add vue  # peer dependency
```

## 快速使用

### 编译器（无 Vue 依赖）

编译器是纯函数，可在 Node.js 或任意框架中独立使用：

```typescript
import { generateHTML } from '@print-design/vue/compiler'

const html = generateHTML(schema, dataSource)
// → 带 @page + table/tr/td 内联样式的纯 HTML 字符串
```

### Vue 组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Designer } from '@print-design/vue'

const designerRef = ref()

function exportSchema() {
  const schema = designerRef.value?.exportSchema()
  console.log(JSON.stringify(schema, null, 2))
}
</script>

<template>
  <Designer ref="designerRef" :initial="{ documentType: 'KITCHEN_RECEIPT' }" />
</template>
```

`Designer` 组件暴露以下方法：

| 方法 | 说明 |
|------|------|
| `exportSchema()` | 导出当前模板 JSON |
| `loadSchema(schema)` | 加载已有模板 |
| `setPaper(type)` | 切换纸张类型 |
| `clearCanvas()` | 清空画布 |

## 数据约定

编译需要两个参数：**模板 JSON**（`schema`）和**业务数据 JSON**（`dataSource`）。模板定义排版，数据定义内容。

### 点路径取值

元素通过 `dataField` 按点路径从数据源中取值：

```json
// dataSource
{ "shop": { "name": "老王川菜馆" }, "orderNo": "20260614001" }
```

```
dataField: "shop.name"   → "老王川菜馆"
dataField: "orderNo"     → "20260614001"
```

### 表格数据

`table` 元素通过 `rowField` 指向数据源中的数组字段，每项渲染为一行：

```json
// dataSource
{
  "items": [
    { "name": "宫保鸡丁", "qty": 1, "unit": "份" },
    { "name": "米饭", "qty": 2, "unit": "碗" }
  ]
}
```

```json
// table 元素配置
{
  "type": "table",
  "rowField": "items",
  "columns": [
    { "key": "name", "label": "菜品", "dataField": "name", "widthMM": 50 },
    { "key": "qty", "label": "数量", "dataField": "qty", "widthMM": 20 }
  ]
}
```

### 树形子行

行数据中可包含 `children` 数组，自动渲染为缩进子行（适用于套餐明细、加料做法等）：

```json
{
  "name": "双人套餐",
  "qty": 1,
  "children": [
    { "name": "  ├ 水煮鱼", "qty": 1 },
    { "name": "  └ 麻婆豆腐", "qty": 1 }
  ]
}
```

### 行级样式覆写

特殊字段 `_rowStyle` 不渲染为单元格内容，而是应用为该行 `<tr>` 的内联样式（如合计行加粗放大）：

```json
{
  "name": "合计 6 件",
  "qty": "",
  "_rowStyle": { "fontWeight": "bold", "fontSize": 14 }
}
```

### 完整示例

```typescript
import { generateHTML } from '@print-design/vue/compiler'

const schema = {
  documentType: 'KITCHEN_RECEIPT',
  paper: { type: 'PAPER_80MM', widthMM: 80, heightMM: null },
  elements: [
    {
      id: 'shop-name',
      type: 'value',
      row: 0, col: 0, colSpan: 12,
      align: 'center',
      dataField: 'shop.name',
      style: { fontSize: 16, fontWeight: 'bold', color: '#000' }
    },
    {
      id: 'order-time',
      type: 'label-value',
      row: 1, col: 0, colSpan: 6,
      label: '下单时间：',
      separator: '',
      dataField: 'orderTime',
      style: { fontSize: 12, color: '#333' }
    },
    {
      id: 'items',
      type: 'table',
      row: 2, col: 0, colSpan: 12,
      rowField: 'items',
      columns: [
        { key: 'name', label: '菜品', dataField: 'name', widthMM: 50 },
        { key: 'qty', label: '数量', dataField: 'qty', widthMM: 20 }
      ],
      style: { fontSize: 13, color: '#000' }
    }
  ]
}

const dataSource = {
  shop: { name: '老王川菜馆' },
  orderTime: '2026-06-14 12:30',
  items: [
    { name: '宫保鸡丁', qty: 1 },
    { name: '米饭', qty: 2 }
  ]
}

const html = generateHTML(schema, dataSource)
```

## 元素类型

| 类型 | 说明 | 取值字段 |
|------|------|---------|
| `value` | 单值文本 | `dataField`（或 `staticText` 静态文字） |
| `label-value` | 标签 + 值，如"单号：20260614001" | `label` + `dataField` |
| `image` | 图片 | `srcField`（或 `staticSrc` 静态 URL） |
| `table` | 数据表格，支持树形子行和行级样式覆写 | `rowField` + `columns[].dataField` |

## 纸张类型

| 类型 | 尺寸 | 说明 |
|------|------|------|
| `A4` | 210 x 297mm | 固定尺寸 |
| `A5` | 148 x 210mm | 固定尺寸 |
| `TRISECTION` | 210 x 99mm | 三等分纸 |
| `PAPER_80MM` | 宽 80mm，高度 auto | 连续纸 / 小票 |
| `PAPER_58MM` | 宽 58mm，高度 auto | 连续纸 / 窄小票 |

## API 参考

### `@print-design/vue`

| 导出 | 类型 | 说明 |
|------|------|------|
| `Designer` | Vue 组件 | 三栏布局设计器 |
| `useDesigner` | Composable | 创建设计器实例 |
| `provideDesigner` / `injectDesigner` | 函数 | provide/inject 上下文 |
| `generateHTML` | 纯函数 | schema + data -> HTML |
| `renderElement` | 纯函数 | 单元素渲染 |
| `styleToString` / `mergeStyles` | 纯函数 | 样式对象 -> CSS 字符串 |
| `resolvePath` | 纯函数 | 点路径数据解析 |
| `PAPER_PRESETS` | 常量 | 纸张预设 |
| `PAPER_OPTIONS` | 常量 | 纸张下拉选项 |
| `ALL_MATERIALS` | 常量 | 已注册物料 |
| `registerMaterials` | 函数 | 注册自定义物料 |
| `filterMaterialsByDocumentType` | 函数 | 按单据类型过滤物料 |
| `listDocumentTypes` | 函数 | 列出所有单据类型 |
| `mmToPx` / `pxToMm` | 函数 | 单位换算 |
| `PX_PER_MM` | 常量 | 每毫米像素数 |

### `@print-design/vue/compiler`

仅导出纯函数和类型，不依赖 Vue：

| 导出 | 说明 |
|------|------|
| `generateHTML` | schema + data -> HTML |
| `renderElement` | 单元素渲染 |
| `styleToString` / `mergeStyles` | 样式对象 -> CSS 字符串 |
| `resolvePath` | 点路径数据解析 |
| `mmToPx` / `pxToMm` | 单位换算 |

## 开发

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器
pnpm build         # 构建库（ESM/CJS/UMD + .d.ts）
pnpm test          # 运行编译器冒烟测试
pnpm typecheck     # 类型检查
```

## 相关文档

- [AGENTS.md](./AGENTS.md) — AI Agent 开发指南
- [docs/ONBOARDING.md](./docs/ONBOARDING.md) — 贡献者入职指南
- [design.md](./design.md) — UI 设计规范
