# Design System — 打印模板设计器 UI 规范

> 本文档定义 print-design 项目的 UI 设计规范，所有样式通过 CSS 变量统一管理。
> 变量定义位置：`src/styles/tokens.css`

---

## 1. 颜色体系

### 1.1 品牌色

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-color-primary` | `#18a058` | 主色：选中态边框、拖拽手柄、按钮高亮 |
| `--pd-color-primary-light` | `#f0f9eb` | 行间隙 hover 背景 |
| `--pd-color-primary-bg` | `#e8f5e9` | 行间隙 active 背景、拖拽源背景 |
| `--pd-color-primary-hover` | `#f6ffed` | 已添加物料卡片、选中单元格背景 |
| `--pd-color-primary-shadow` | `rgba(24,160,88,0.15)` | 物料卡片 hover 阴影 |

### 1.2 危险色

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-color-danger` | `#d00` | 删除按钮、已添加物料二次点击 |
| `--pd-color-danger-light` | `#fff1f0` | 删除态 hover 背景 |
| `--pd-color-danger-shadow` | `rgba(208,0,0,0.15)` | 删除态 hover 阴影 |

### 1.3 信息色

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-color-info` | `#2080f0` | 信息标签（色板预设） |

### 1.4 中性色 — 文字

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-text-primary` | `#333` | 主要文字（标题、内容） |
| `--pd-text-regular` | `#555` | 常规文字（绑定值） |
| `--pd-text-secondary` | `#888` | 次要文字（行标签、分组标题） |
| `--pd-text-placeholder` | `#999` | 占位文字（标签、字段名） |
| `--pd-text-disabled` | `#aaa` | 禁用/提示文字 |
| `--pd-text-faint` | `#bbb` | 极淡文字（计数、空状态） |
| `--pd-text-muted` | `#ccc` | 最淡文字（提示标记） |

### 1.5 中性色 — 背景

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-bg-white` | `#fff` | 纸张、面板头部、卡片 |
| `--pd-bg-panel` | `#fafafa` | 左右侧面板背景 |
| `--pd-bg-subtle` | `#f5f7fa` | 绑定项、列配置项背景 |
| `--pd-bg-page` | `#ebedf0` | 画布工作区背景 |

### 1.6 中性色 — 边框

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-border-light` | `#eee` | 面板内部分割线 |
| `--pd-border-base` | `#e8e8e8` | 面板外边框、工具栏底边 |
| `--pd-border-card` | `#ececec` | 物料卡片边框 |
| `--pd-border-paper` | `#d0d4d9` | 纸张边框 |
| `--pd-border-muted` | `#c0c4cc` | 单元格 hover 边框、resize 手柄 |
| `--pd-border-grid` | `#d0d7de` | 表格设计器列分隔线 |
| `--pd-border-gridline` | `#e2e4e7` | 画布网格背景线 |

---

## 2. 字号

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-font-xs` | `10px` | 单元格标签、分组箭头、列字段名 |
| `--pd-font-sm` | `11px` | 行标签、提示文字、分组标题 |
| `--pd-font-base` | `12px` | 工具栏标签、空状态提示 |
| `--pd-font-md` | `13px` | 物料名称、元素名称、空状态正文 |
| `--pd-font-lg` | `14px` | 面板标题 |
| `--pd-font-xl` | `15px` | 品牌名称 |
| `--pd-font-xxl` | `16px` | 元素类型图标 |
| `--pd-font-display` | `18px` | 物料图标 |

### 字重

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-weight-normal` | `400` | 正文 |
| `--pd-weight-medium` | `500` | 强调（未使用） |
| `--pd-weight-semibold` | `600` | 标题、行标签 |

---

## 3. 间距

采用 2px 基准的递进式间距系统：

| Token | 值 | 典型用途 |
|-------|-----|----------|
| `--pd-space-1` | `2px` | 标签底部间距 |
| `--pd-space-2` | `4px` | 按钮内边距上下、字段间距 |
| `--pd-space-3` | `6px` | 行间距、按钮内边距左右、标签间距 |
| `--pd-space-4` | `8px` | 列表项间距、网格间距 |
| `--pd-space-5` | `10px` | 面板内边距、卡片内边距 |
| `--pd-space-6` | `12px` | 面板头部内边距、画布间距 |
| `--pd-space-7` | `14px` | 面板头部内边距左右 |
| `--pd-space-8` | `16px` | 工具栏内边距、内容区底部 |
| `--pd-space-12` | `24px` | 空状态内边距 |
| `--pd-space-20` | `40px` | 画布区域内边距、空状态上下 |

---

## 4. 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-radius-sm` | `2px` | 行间隙、resize 手柄 |
| `--pd-radius-base` | `4px` | 卡片、标签、按钮、绑定项 |
| `--pd-radius-md` | `6px` | 物料卡片 |

---

## 5. 阴影

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | 布局行卡片 |
| `--pd-shadow-base` | `0 1px 4px rgba(0,0,0,0.08)` | 纸张信息标签 |
| `--pd-shadow-md` | `0 1px 4px rgba(0,0,0,0.1)` | 行标签/行操作浮层 |
| `--pd-shadow-paper` | `0 6px 28px rgba(0,0,0,0.14)` | 纸张 |
| `--pd-shadow-selected` | `0 0 0 2px primary + sm` | 选中态行卡片 |

---

## 6. 层级 (z-index)

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-z-resize` | `5` | 列宽拖拽手柄 |
| `--pd-z-overlay` | `6` | 单元格删除按钮 |

---

## 7. 动效

| Token | 值 | 用途 |
|-------|-----|------|
| `--pd-transition-fast` | `0.15s` | hover 过渡、手柄变色 |

---

## 8. 命名约定

所有 token 以 `--pd-` 为前缀，按语义分组：

```
--pd-color-{用途}      品牌色、功能色
--pd-text-{层级}       文字颜色
--pd-bg-{用途}         背景颜色
--pd-border-{用途}     边框颜色
--pd-font-{尺寸}       字号
--pd-weight-{粗细}     字重
--pd-space-{数字}      间距（2px 倍数）
--pd-radius-{尺寸}     圆角
--pd-shadow-{用途}     阴影
--pd-z-{用途}          层级
--pd-transition-{速度} 过渡时间
```

---

## 9. 使用规范

### 新增组件样式

```css
/* ✅ 正确：使用 token */
.my-component {
  background: var(--pd-bg-white);
  border: 1px solid var(--pd-border-base);
  padding: var(--pd-space-4);
  font-size: var(--pd-font-md);
  color: var(--pd-text-primary);
  border-radius: var(--pd-radius-base);
}

/* ❌ 错误：硬编码值 */
.my-component {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 8px;
  font-size: 13px;
  color: #333;
  border-radius: 4px;
}
```

### 例外情况

以下场景允许使用硬编码值：

1. **用户可配置的默认值** — 如 `el.borderColor ?? '#000'`
2. **色板预设** — 如 `SWATCHES = ['#000', '#333', ...]`
3. **一次性特殊状态色** — 如橙色拖拽提示 `#fff3e0`

---

## 10. 修改指南

| 需求 | 操作 |
|------|------|
| 调整整体主色 | 修改 `--pd-color-primary` 及其派生值 |
| 调整灰度体系 | 修改 `--pd-text-*` 和 `--pd-border-*` |
| 调整间距密度 | 修改 `--pd-space-*` 系列 |
| 新增 token | 在 `tokens.css` 对应分组添加，遵循命名约定 |
| 新增组件 | 直接引用已有 token，不新增硬编码值 |
