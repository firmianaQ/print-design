/**
 * 打印模板设计器 —— 核心类型定义
 *
 * 严格区分两级 JSON：
 *   - MaterialItem   模具：预设了样式 + 强制绑定字段，不含画布位置，不含实例 ID
 *   - TemplateSchema 实例：画布核心状态，含纸张配置 + 元素集合（带 id 与真实坐标）
 */

/** 底层基础渲染器类型 —— 系统只维护这 4 种纯静态渲染结构 */
export type ElementType = 'value' | 'label-value' | 'image' | 'table'

/** 纸张类型：固定尺寸 (A4/A5/三等分) 或连续纸张 (80mm/58mm) */
export type PaperType = 'A4' | 'A5' | 'TRISECTION' | 'PAPER_80MM' | 'PAPER_58MM'

/**
 * 纸张配置
 * - 固定纸张：heightMM 为真实高度
 * - 连续纸张：heightMM 为 null（设计区给虚拟高度，最终渲染 height:auto）
 */
export interface PaperConfig {
  type: PaperType
  /** 物理宽度 (mm) —— 同时用于 @page size 与画布容器宽度换算 */
  widthMM: number
  /** 物理高度 (mm)；连续纸张为 null */
  heightMM: number | null
  /** 仅连续纸张生效：设计区虚拟高度 (mm)，仅用于拖拽时给一个可视范围 */
  designHeightMM?: number
}

/** 视觉样式对象。值可为数字（按规则附加单位）或字符串（原样输出）。 */
export type StyleObject = Record<string, string | number>

/** 表格列定义 */
export interface TableColumn {
  /** 列唯一 key */
  key: string
  /** 表头文字 */
  label: string
  /** 数据源字段路径，支持嵌套，如 'product.name' */
  dataField: string
  /** 列宽 (mm)；不设则均分 */
  widthMM?: number
  /** 是否隐藏列（true 时不参与渲染，仅保留配置） */
  hidden?: boolean
  /** 该列内容对齐（覆写表格级 bodyAlign；如金额列右对齐） */
  align?: 'left' | 'center' | 'right'
}

/**
 * 画布元素实例
 *
 * 采用「布局表格 + 隐式行」模型：整个模板编译为一个布局 <table>，
 * 元素归到某行（row）、占某些列（col + colSpan），同 row 的元素并排为一行。
 * 行高由内容决定，表格撑高时后续行自动下移，无撞车。
 * 「行」是渲染/编译期按 row 分组推断的，schema 内不存嵌套行容器。
 */
export interface TemplateElement {
  /** 画布内绝对唯一标识（nanoid） */
  id: string
  /** 基础渲染器类型 */
  type: ElementType

  /** 组件名称（实例化时从物料名复制，便于在画布/右栏识别元素） */
  name: string

  // ---- 布局坐标（隐式行模型）----
  /** 所在行号（0 起，同 row 的元素并排为一行） */
  row: number
  /** 所在列号（0 起，同行内从左到右） */
  col: number
  /** 占据的列数（默认 1；布局表共 12 列，并排用 6+6、4+4+4 等） */
  colSpan: number
  /** 宽度占比（0~100，相对纸宽；省略则按 colSpan 比例均分该行） */
  widthPct?: number
  /** 元素内内容的水平对齐（编译为 td 的 text-align） */
  align?: 'left' | 'center' | 'right'

  /** 视觉样式层（字体、颜色、粗细等，直绑右栏 v-model）。
   *  注意：position/left/top/width/height 不再由 style 控制，改由布局表决定。 */
  style: StyleObject

  // ---- type 专属字段（可选，按 type 使用）----

  /** value: 静态文字。若设置则优先于 dataField 渲染静态值 */
  staticText?: string
  /** value / label-value / image / table: 业务数据字段路径（点路径） */
  dataField?: string

  /** label-value: 静态标签前缀，如 "收件人：" */
  label?: string
  /** label-value: 标签与值之间的分隔符，默认 " " */
  separator?: string

  /** image: 静态占位图 URL。若设置则优先于 srcField */
  staticSrc?: string
  /** image: 动态图片 URL 字段路径 */
  srcField?: string
  /** image: 图片填充模式，object-fit 取值 */
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'

  /** table: 列定义 */
  columns?: TableColumn[]
  /** table: 是否渲染表格线 */
  bordered?: boolean
  /** table: 表格线宽度 (px)，bordered=true 时生效 */
  borderWidth?: number
  /** table: 表格线颜色，bordered=true 时生效 */
  borderColor?: string
  /** table: 表头是否显示 */
  showHeader?: boolean
  /** table: 数据源字段路径，指向行数组；每行可含 _rowStyle / children */
  rowField?: string
  // ---- table 对齐（三层：表头 / 内容默认 / 单列覆写）----
  /** table: 表头文字对齐（默认 left） */
  headerAlign?: 'left' | 'center' | 'right'
  /** table: 内容单元格默认对齐（默认 left）；单列可用 column.align 覆写 */
  bodyAlign?: 'left' | 'center' | 'right'
  // ---- table 表头样式（独立于内容）----
  /** table: 表头背景色（不设则透明） */
  headerBgColor?: string
  /** table: 表头字号（不设则跟随表格 style.fontSize） */
  headerFontSize?: number
  /** table: 表头是否加粗（默认 true） */
  headerBold?: boolean
  /** table: 表头文字颜色（不设则跟随表格 style.color） */
  headerColor?: string
  // ---- table 行内边距/行高 ----
  /** table: 单元格内边距 (px)，影响行高与内容留白；默认 2（紧凑），小票常用 0~4 */
  cellPadding?: number
}

/**
 * 模板实例 JSON —— 画布核心状态
 * 实例一旦生成，即与左侧模具彻底断开联系。
 */
export interface TemplateSchema {
  /** 单据类型，决定物料过滤，如 'KITCHEN_RECEIPT' */
  documentType: string
  /** 纸张配置 */
  paper: PaperConfig
  /** 画布元素集合 */
  elements: TemplateElement[]
}

/**
 * 业务物料（模具）
 * 预设了特定样式 + 强制绑定后端字段的基础组件 JSON。
 * 不含实例 id、不含行号（row/col 由实例化时按当前画布末尾追加）。
 */
export interface MaterialItem {
  /** 物料类型 —— 复用基础渲染器类型 */
  type: ElementType
  /** 物料显示名称，如 "大字桌号" */
  name: string
  /** 物料图标（emoji 或图标 class） */
  icon: string
  /** 归属单据类型，用于左侧物料库过滤 */
  documentType: string
  /** 预设配置：cloneDeep 后 + nanoid + name + row/col → 生成 TemplateElement。
   *  name 由实例化拦截器从 MaterialItem.name 复制，避免模具与物料名重复维护。
   *  row/col/colSpan 由实例化拦截器按画布末尾自动赋值。 */
  preset: Omit<TemplateElement, 'id' | 'name' | 'row' | 'col'>
}

/** 表格行数据：支持行级样式覆写 + 树形递归子行 */
export interface TableRow {
  [key: string]: unknown
  /** 行级样式覆写（如合计行加粗、放大字号） */
  _rowStyle?: StyleObject
  /** 子行（套餐明细、加料做法等），递归渲染为缩进行 */
  children?: TableRow[]
}

/** 编译器数据源：任意结构对象 */
export type DataSource = Record<string, unknown>

/** 布局表总列数（类比 12 栅格） */
export const GRID_COLUMNS = 12
