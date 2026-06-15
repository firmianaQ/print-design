# 打印模板设计器 — 新成员入职指南

> 本指南由知识图谱自动生成，帮助新团队成员快速理解项目架构和代码结构。
> 最后更新：2026-06-14 | 基于 commit: f58b243

---

## 项目概览

| 项目 | 说明 |
|------|------|
| **名称** | print-design（`@print-design/vue`） |
| **描述** | 轻量级、数据驱动的 Vue 3 前端打印模板设计器库 |
| **语言** | TypeScript, Vue, CSS, HTML |
| **框架** | Vue 3 (Composition API), Vite, Naive UI |
| **核心职责** | 将模板配置 JSON 与业务数据 JSON 结合，编译生成带 `@page` 打印指令和内联样式的纯 HTML 字符串 |
| **设计边界** | 不包含 `window.print()` 调用、底层打印机通信或物理打印配置弹出逻辑 |
| **兼容目标** | 输出仅用 `table/tr/td` + 内联样式，兼容 Lodop（IE 内核，不支持 flex/grid） |

### 快速开始

```bash
pnpm install          # 安装依赖
pnpm run dev          # 启动开发服务器 http://localhost:5173
pnpm run build        # 类型检查 + 生产构建（ES/CJS/UMD）
pnpm run typecheck    # 仅类型检查
pnpm run test         # 运行编译器冒烟测试
```

### 三种使用方式

```typescript
// 方式一：仅使用编译器（无 Vue 依赖，可在 Node.js 中运行）
import { generateHTML, type TemplateSchema } from '@print-design/vue/compiler'

// 方式二：使用完整设计器（Vue 组件）
import { Designer } from '@print-design/vue'

// 方式三：在 Vue 中组合使用
import { useDesigner, provideDesigner, generateHTML } from '@print-design/vue'
```

---

## 架构分层

项目采用清晰的分层架构，共 10 层：

```
┌─────────────────────────────────────────────────────────────────┐
│  Application Shell    main.ts / App.vue / index.ts / compiler.ts│
├─────────────────────────────────────────────────────────────────┤
│  Designer Core        types.ts / useDesigner.ts / inject.ts     │
├─────────────────────────────────────────────────────────────────┤
│  Compiler Engine      generateHTML / renderElement / utils       │
├─────────────────────────────────────────────────────────────────┤
│  UI Components        Designer / Canvas / Left / Right / Preview │
├─────────────────────────────────────────────────────────────────┤
│  Materials & Presets  materials/ / paperPresets.ts               │
├─────────────────────────────────────────────────────────────────┤
│  Utilities            units.ts                                  │
├─────────────────────────────────────────────────────────────────┤
│  Demo & Samples       demo/ (3 种业务场景演示数据)                │
├─────────────────────────────────────────────────────────────────┤
│  Configuration        vite.config.* / tsconfig.* / package.json  │
├─────────────────────────────────────────────────────────────────┤
│  Documentation        README / AGENTS / REFACTOR-PLAN / design   │
├─────────────────────────────────────────────────────────────────┤
│  Testing              scripts/test-compiler.mjs                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. 应用入口层

| 文件 | 职责 |
|------|------|
| `src/main.ts` | Vue 应用创建，注册 Naive UI |
| `src/App.vue` | 根组件，工具栏 + 三栏布局容器 |
| `src/index.ts` | **库主入口** — 统一导出所有公共 API（组件/Composable/编译器/预设/类型） |
| `src/compiler.ts` | **编译器独立入口** — 仅导出纯函数，不依赖 Vue，可在 Node.js 中独立使用 |

> **双入口设计**：`src/index.ts` 是完整库入口（含 Vue 组件），`src/compiler.ts` 是纯函数编译器入口（无 Vue 依赖）。Vite 库模式输出 ES/CJS/UMD 三种格式。

### 2. 设计器核心层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/designer/types.ts` | 中等 | 核心类型：TemplateSchema, TemplateElement, MaterialItem, PaperConfig |
| `src/designer/useDesigner.ts` | ⚠️ 复杂 | 顶层 Composable，管理响应式 schema 和所有操作方法 |
| `src/designer/inject.ts` | 简单 | provide/inject 上下文分发（DESIGNER_KEY） |
| `src/designer/index.ts` | 简单 | 模块公共 API 桶文件 |

### 3. 编译器引擎层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/designer/compiler/generateHTML.ts` | 中等 | 编译入口：@page 规则 → 布局 `<table>` → 按行分组 → 元素渲染 |
| `src/designer/compiler/renderElement.ts` | ⚠️ 复杂 | 元素渲染分发：value / label-value / image / table 四种渲染器 |
| `src/designer/compiler/resolvePath.ts` | 简单 | 点路径解析（支持嵌套取值 + 数组下标） |
| `src/designer/compiler/styleToString.ts` | 简单 | 样式对象 → CSS 字符串（camelCase→kebab-case） |

### 4. UI 组件层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/designer/components/Designer.vue` | 简单 | 三栏布局容器，实例化 useDesigner 并 provide |
| `src/designer/components/Canvas.vue` | ⚠️ 复杂 | 核心画布编辑区，布局表格模型 + 拖拽交互 |
| `src/designer/components/LeftPanel.vue` | 简单 | 左侧物料库面板，点击添加/再点删除 |
| `src/designer/components/RightPanel.vue` | ⚠️ 复杂 | 右侧属性配置表单（Naive UI），v-model 直绑 style |
| `src/designer/components/elements/ElementPreview.vue` | 简单 | 设计期元素预览渲染器 |
| `src/designer/components/elements/DesignTable.vue` | ⚠️ 复杂 | 画布内表格设计器（表头拖拽换序 + 列宽拖拽调整） |

### 5. 物料与预设层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/designer/materials/index.ts` | 简单 | 物料注册表（通用机制），`registerMaterials()` 注册 + 按 `documentType` 过滤 |
| `src/designer/paperPresets.ts` | 简单 | 纸张预设（A4/A5/三等分/80mm/58mm） |

> `documentType` 和 `MaterialItem` 均可自定义扩展，业务方通过 `registerMaterials()` 注册自定义物料。

### 6. 工具层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/designer/utils/units.ts` | 简单 | mm↔px 单位换算（96dpi） |

### 7. 演示与样例层

| 文件 | 复杂度 | 职责 |
|------|--------|------|
| `src/demo/index.ts` | 简单 | 演示模板注册表（3 个模板）+ `registerDemoMaterials()` |
| `src/demo/materials.ts` | 中等 | 演示物料定义（3 种单据类型，21 个物料） |
| `src/demo/sampleSchema.ts` | 中等 | 后厨小票演示数据（80mm 连续纸） |
| `src/demo/moreSamples.ts` | 中等 | 客人登记单（A4）+ 收银结账单（58mm） |
| `src/demo/preview.ts` | 简单 | 编译预览工具（exportHTML + previewHTML） |

### 8. 配置层

| 文件 | 职责 |
|------|------|
| `vite.config.ts` | Vite 开发服务器配置，@→src 路径别名 |
| `vite.config.lib.ts` | Vite 库模式构建，输出 ES/CJS 双格式 + .d.ts 类型声明 |
| `vite.config.umd.ts` | Vite UMD 格式构建（CDN 引入场景） |
| `tsconfig.json` | TypeScript 严格模式，ES2020，Bundler 解析 |
| `tsconfig.lib.json` | 库构建专用 TS 配置（vue-tsc 生成 .d.ts） |
| `tsconfig.node.json` | Node 端 TS 配置（Vite 配置文件类型检查） |
| `package.json` | 包配置：vue 3.4 (peer)、naive-ui 2.38、lodash-es、nanoid |

### 9. 文档层

| 文件 | 职责 |
|------|------|
| `README.md` | 项目定位、三种使用方式、技术栈、架构说明 |
| `AGENTS.md` | AI Agent 项目导航指南（架构分层、文件索引、数据流、修改指南） |
| `REFACTOR-PLAN.md` | 布局表格模型重构方案（从绝对定位到隐式行） |
| `design.md` | 整体设计方案文档 |
| `docs/ONBOARDING.md` | 本文件 — 新成员入职指南 |

### 10. 测试层

| 文件 | 职责 |
|------|------|
| `scripts/test-compiler.mjs` | 编译器冒烟测试（用 tsx 直接执行） |

---

## 关键概念

### 两级 JSON 隔离

项目严格区分两种 JSON 结构：

- **MaterialItem（模具）**：预设样式 + 强制绑定字段，无画布坐标、无实例 ID。是"模板"。
- **TemplateSchema（实例）**：画布核心状态，含纸张配置 + 元素集合（带 nanoid 和 px 坐标）。实例一旦生成即与模具断开。

```
MaterialItem（左侧面板）          TemplateSchema（画布状态）
┌─────────────────────┐          ┌─────────────────────────┐
│ type: 'value'       │          │ documentType: 'KITCHEN' │
│ name: '大字桌号'     │ ──实例化──→│ paper: { type: '80mm' } │
│ preset: { ... }     │          │ elements: [             │
│ (无 id/row/col)     │          │   { id: 'abc', row: 0 } │
└─────────────────────┘          │   ...                   │
                                 └─────────────────────────┘
```

### 布局表格 + 隐式行模型

- 整个模板编译为一个布局 `<table>`，逻辑行 = `<tr>`，并排 = 同行多 `<td>`
- 元素通过 `row/col/colSpan` 定位，同 row 元素自动归行
- 行高由内容决定，表格类元素撑高时后续行自动下移（解决了绝对定位模型的"撞车"问题）
- 输出仅用 `table/tr/td` + 内联样式，兼容 Lodop（IE 内核）

### 四种基础渲染器

| 类型 | 说明 | 示例 |
|------|------|------|
| `value` | 单值文本（静态或动态变量） | `老王川菜馆` |
| `label-value` | 静态标签 + 动态变量 | `收件人：张三` |
| `image` | 图片（静态占位或动态 URL） | `<img src="..." />` |
| `table` | 表格：支持行级 `_rowStyle` 覆写 + `children` 树形递归 | 嵌套 `<table>` |

### 五种纸张类型

| 类型 | 尺寸 | 说明 |
|------|------|------|
| A4 | 210×297mm | 固定尺寸 |
| A5 | 148×210mm | 固定尺寸 |
| 三等分 | 210×99mm | 固定尺寸 |
| 80mm 连续纸 | 宽 80mm，高度 auto | 小票场景 |
| 58mm 连续纸 | 宽 58mm，高度 auto | 极窄小票 |

### 单据类型与物料

- **`documentType`**：字符串字段，决定左侧面板显示哪些物料。业务方可自定义任意值。
- **`MaterialItem`**：物料模具，通过 `documentType` 字段归属到某个单据类型。
- 项目内置 3 种演示单据类型和 21 个预设物料（`materials/preset.ts`），仅为示例。

### 状态管理策略

- **禁用 Pinia / Vuex**，采用顶层 Composable `useDesigner` + Vue 原生 reactive + provide/inject
- Designer.vue 在顶层 provide，LeftPanel / Canvas / RightPanel inject 拿同一实例
- v-model 直绑 style 对象，实现零事件派发的所见即所得

---

## 引导式学习路径

建议按以下顺序阅读代码（约 2-3 小时）：

### Step 1: 项目概览（10 分钟）
从 `README.md` 和 `package.json` 开始，了解项目定位、技术栈和可用脚本。

### Step 2: 应用入口与库 API（10 分钟）
追踪启动链：`src/main.ts` → `src/App.vue`。理解 Vue 应用如何启动、Naive UI 如何注册、顶层工具栏如何协调演示模板切换。同时了解双入口设计：`src/index.ts`（完整库）和 `src/compiler.ts`（纯函数编译器）。

### Step 3: 核心类型系统（15 分钟）
阅读 `src/designer/types.ts`，理解两级 JSON 隔离设计和布局表格+隐式行模型。这是理解整个系统的基石。

### Step 4: 状态管理（20 分钟）
阅读 `src/designer/useDesigner.ts` 和 `src/designer/inject.ts`，理解响应式状态管理和 provide/inject 分发机制。重点关注 `addFromMaterial`（物料实例化）、`moveElement`（拖拽换位）、`removeElement`（删除+行号空洞补齐）。

### Step 5: 画布编辑区（20 分钟）
阅读 `src/designer/components/Canvas.vue`，理解布局表格渲染、行间隙 drop 区、元素拖拽换位等核心交互。注意画布 table 结构与编译器 generateHTML 的同构关系。

### Step 6: 左右面板（15 分钟）
阅读 `LeftPanel.vue`（物料库，点击添加/再点删除）和 `RightPanel.vue`（属性配置，v-model 直绑 style）。

### Step 7: 编译引擎（20 分钟）
阅读 `generateHTML.ts`（编译入口）和 `renderElement.ts`（渲染分发），理解从 schema 到 HTML 的编译流程。运行 `npm run test` 验证理解。

### Step 8: 物料与演示数据（10 分钟）
阅读 `src/designer/materials/preset.ts`（21 个预设物料）和 `src/demo/` 目录（3 种业务场景的完整示例）。

### Step 9: 工具函数与测试（10 分钟）
阅读 `resolvePath.ts`、`styleToString.ts`、`units.ts`，理解被编译器和画布共同使用的工具函数。阅读 `scripts/test-compiler.mjs` 理解验证方式。

### Step 10: 架构演进（10 分钟）
阅读 `REFACTOR-PLAN.md`，了解从绝对定位到布局表格模型的架构级重构决策和约束。

---

## 复杂度热点 ⚠️

以下文件逻辑最密集，修改时需格外小心：

### 1. `src/designer/useDesigner.ts` — 状态管理中心
- 管理所有响应式状态（schema/activeId/dataSource）
- 包含元素实例化、行/列操作、元素增删等核心方法
- 行号空洞自动补齐、单元素行自动撑满等边界逻辑
- **建议**：修改前先理解 `moveElementToNewRow` 和 `removeElement` 的行号管理逻辑

### 2. `src/designer/compiler/renderElement.ts` — 渲染分发器
- 按 ElementType 路由到 4 种渲染函数
- `renderTable` 包含表头样式、行级 `_rowStyle` 覆写、树形 `children` 递归、列显隐等复杂逻辑
- **建议**：修改表格渲染时注意与 DesignTable.vue 的所见即所得一致性

### 3. `src/designer/components/Canvas.vue` — 核心画布
- 布局表格渲染（与编译器 generateHTML 同构）
- 行间隙 drop 区（物料拖入 + 元素拖拽两种来源）
- 元素拖拽换位（HTML5 DnD）
- **建议**：修改拖拽逻辑时注意 `draggingElId` 状态清理和 `stopPropagation` 防冒泡

### 4. `src/designer/components/RightPanel.vue` — 属性配置
- 高密度 Naive UI 表单，v-model 直绑 activeElement.style
- 表格列编辑器（显隐/调序/改列名/改列宽）
- **建议**：添加新属性时注意 null 安全（el 可能为空）

### 5. `src/designer/components/elements/DesignTable.vue` — 表格设计器
- 表头拖拽换序 + 列宽拖拽调整
- 行渲染复用编译器同款逻辑（_rowStyle + children 递归）
- **建议**：修改列宽逻辑时注意 mm↔px 换算和 table-layout:fixed 的取宽规则

---

## 常见任务

### 添加新的物料类型
1. 定义 `MaterialItem` 数组（指定 `documentType`、`type`、`preset` 等）
2. 在应用启动时调用 `registerMaterials(materials)` 注册
3. 物料自动出现在对应单据类型的左侧面板中

示例：
```typescript
import { registerMaterials } from '@print-design/vue'

registerMaterials([
  { type: 'value', name: '自定义字段', icon: '📝', documentType: 'MY_TYPE', preset: { ... } }
])
```

### 添加新的纸张类型
1. 在 `src/designer/paperPresets.ts` 的 `PAPER_PRESETS` 中添加新条目
2. 在 `PAPER_OPTIONS` 中添加下拉选项
3. 固定纸张设置 `heightMM`，连续纸张设为 `null`

### 添加新的渲染器类型
1. 在 `src/designer/types.ts` 的 `ElementType` 中添加新类型
2. 在 `src/designer/compiler/renderElement.ts` 中添加对应的渲染函数
3. 在 `renderElement` 的 switch 中添加路由
4. 在 `src/designer/components/elements/ElementPreview.vue` 中处理预览
5. 在 `src/designer/components/RightPanel.vue` 中添加专属配置段

### 修改编译输出
编译器是纯函数，修改时可以直接用 `npm run test` 验证：
- `src/designer/compiler/generateHTML.ts` — 整体骨架
- `src/designer/compiler/renderElement.ts` — 元素渲染
- `scripts/test-compiler.mjs` — 添加新的断言

### 库构建与发布
```bash
pnpm run build        # 类型检查 + 库构建（ES/CJS/UMD）
```
- `vite.config.lib.ts` — ES/CJS 双格式 + .d.ts 类型声明
- `vite.config.umd.ts` — UMD 格式（CDN 引入）
- `tsconfig.lib.json` — 库构建专用 TS 配置

---

## 关键数据流

### 模板编译流程
```
TemplateSchema + DataSource
  → generateHTML()
    → buildPageRule()        # @page 打印媒体查询
    → renderRows()           # 按 row 分组为 <tr>
      → renderCell()         # 元素包进 <td colspan>
        → renderElement()    # 按 type 分发渲染
          → renderValue()        # 单值文本
          → renderLabelValue()   # 标签+变量
          → renderImage()        # 图片
          → renderTable()        # 嵌套表格（递归 children）
    → styleToString()        # 样式→CSS 字符串
    → resolvePath()          # 数据字段路径解析
  → 纯 HTML 字符串（含 @page + table/tr/td + 内联样式）
```

### 状态管理流程
```
App.vue
  → Designer.vue
    → useDesigner(initial)   # 创建响应式状态
    → provideDesigner()      # provide 下发
      → LeftPanel.vue        # injectDesigner() → materials
      → Canvas.vue           # injectDesigner() → schema, rows, activeId
      → RightPanel.vue       # injectDesigner() → activeElement, style v-model
```

---

## 代码约定

| 约定 | 说明 |
|------|------|
| 命名 | kebab-case 文件名、PascalCase 组件名、camelCase 函数/变量 |
| 注释 | 文件顶部中文 JSDoc、函数中文 JSDoc、行内中文注释 |
| 状态管理 | 禁用 Pinia/Vuex，仅用 Vue 原生 reactive + provide/inject |
| 编译器 | 纯函数，无副作用，输出仅用 table/tr/td + 内联样式 |
| 样式 | 数值属性按 PX_KEYS 集合决定是否附加 px，每条声明后带分号 |

---

*本指南基于项目知识图谱自动生成。如有疑问，请阅读各文件顶部的注释或运行 `pnpm run test` 验证理解。*
