import { computed, reactive, type Reactive } from 'vue'
import { cloneDeep } from 'lodash-es'
import { nanoid } from 'nanoid'
import type {
  DataSource,
  MaterialItem,
  PaperType,
  TemplateElement,
  TemplateSchema,
} from './types'
import { GRID_COLUMNS } from './types'
import { PAPER_PRESETS } from './paperPresets'
import { filterMaterialsByDocumentType } from './materials'

/** 默认初始 schema —— 80mm 连续纸 + KITCHEN_RECEIPT 单据类型，空画布 */
function createDefaultSchema(): TemplateSchema {
  return {
    documentType: 'KITCHEN_RECEIPT',
    paper: { ...PAPER_PRESETS.PAPER_80MM },
    elements: [],
  }
}

/**
 * useDesigner —— 顶层 Composable，统一管理响应式 schema 与物料数据
 *
 * 严格禁用 Pinia / Vuex：仅用 Vue 原生 reactive + computed + provide/inject。
 * 通过 provideDesigner() 下发，子组件用 injectDesigner() 拿到同一实例。
 */
export function useDesigner(initial?: Partial<TemplateSchema>) {
  // ---- 响应式核心状态 ----
  const state = reactive({
    schema: createDefaultSchema(),
    /** 当前选中元素 id（null = 无选中） */
    activeId: null as string | null,
    /** 业务数据源（编译时与 schema 合并） */
    dataSource: {} as DataSource,
  })

  // 覆盖默认初始值
  if (initial) {
    if (initial.documentType) state.schema.documentType = initial.documentType
    if (initial.paper) state.schema.paper = { ...state.schema.paper, ...initial.paper }
    if (initial.elements) state.schema.elements = cloneDeep(initial.elements)
  }

  // ---- 计算属性 ----
  /** 当前选中元素对象 */
  const activeElement = computed<TemplateElement | null>(
    () => state.schema.elements.find((e) => e.id === state.activeId) ?? null,
  )

  /** 当前单据类型下可用的物料列表（按 documentType 过滤） */
  const materials = computed<MaterialItem[]>(() =>
    filterMaterialsByDocumentType(state.schema.documentType),
  )

  /** 画布宽度 px（按纸张 mm 换算） */
  const canvasWidthPx = computed(() => (state.schema.paper.widthMM * 96) / 25.4)

  /** 画布设计区高度 px —— 仅作画布可视最小高度；实际行高由内容决定（流式） */
  const canvasHeightPx = computed(() => {
    const p = state.schema.paper
    const h = p.heightMM ?? p.designHeightMM ?? 297
    return (h * 96) / 25.4
  })

  /**
   * 元素按 row 分组（隐式行）。
   * 同 row 的元素并排为一行；返回 [行号, 该行元素] 数组，行号升序、行内按 col 升序。
   */
  const rows = computed<[number, TemplateElement[]][]>(() => {
    const map = new Map<number, TemplateElement[]>()
    for (const el of state.schema.elements) {
      const r = el.row ?? 0
      if (!map.has(r)) map.set(r, [])
      map.get(r)!.push(el)
    }
    const entries = [...map.entries()].sort((a, b) => a[0] - b[0])
    for (const [, els] of entries) els.sort((a, b) => (a.col ?? 0) - (b.col ?? 0))
    return entries
  })

  /** 当前最大行号（空画布为 -1） */
  const maxRow = computed(() => {
    let m = -1
    for (const el of state.schema.elements) if ((el.row ?? 0) > m) m = el.row ?? 0
    return m
  })

  // ---- 操作方法 ----

  /**
   * 实例化拦截：物料落入画布
   * 深拷贝 preset → 注入 nanoid + 组件名 + 行列坐标 → push 进 schema.elements
   * 默认追加到新的一行（row = maxRow+1，colSpan=GRID_COLUMNS 即独占满宽）。
   * name 从物料名复制；实例生成后即与左侧模具彻底断开联系。
   */
  function addFromMaterial(material: MaterialItem): TemplateElement {
    const preset = cloneDeep(material.preset)
    const el: TemplateElement = {
      ...preset,
      id: nanoid(),
      name: material.name,
      // row/col 不在物料 preset 中（preset Omit 了它们），由实例化拦截器按画布末尾赋值
      row: maxRow.value + 1,
      col: 0,
      colSpan: preset.colSpan ?? GRID_COLUMNS,
    }
    state.schema.elements.push(el)
    state.activeId = el.id
    return el
  }

  /**
   * 按物料名查找已存在的实例。
   * 物料以 name 在同 documentType 内唯一，故 name 即去重键。
   */
  function findElementByMaterialName(name: string): TemplateElement | undefined {
    return state.schema.elements.find((e) => e.name === name)
  }

  /**
   * 切换物料：已添加则删除该实例，未添加则新建实例（点击添加/再点删除）。
   * 每个物料在一套模板里只允许一个实例（同数据源不重复）。
   * @returns 操作后该物料是否仍存在于画布
   */
  function toggleMaterial(material: MaterialItem): boolean {
    const existing = findElementByMaterialName(material.name)
    if (existing) {
      removeElement(existing.id)
      return false
    }
    addFromMaterial(material)
    return true
  }

  /** 选中元素 */
  function selectElement(id: string | null): void {
    state.activeId = id
  }

  /**
   * 把元素移动到指定行/列（拖拽换行换列的核心）。
   * 改 el.row/col 后重排目标行内的 col，保证不冲突。
   */
  function moveElement(id: string, toRow: number, toCol: number): void {
    const el = state.schema.elements.find((e) => e.id === id)
    if (!el) return
    el.row = toRow
    el.col = toCol
    normalizeRowCols(toRow)
  }

  /** 把某行内的元素 col 规整为 0,1,2... 连续值 */
  function normalizeRowCols(row: number): void {
    const sameRow = state.schema.elements
      .filter((e) => (e.row ?? 0) === row)
      .sort((a, b) => (a.col ?? 0) - (b.col ?? 0))
    sameRow.forEach((e, i) => (e.col = i))
  }

  /**
   * 规整行的列宽：行内只有一个元素时自动撑满（colSpan=GRID_COLUMNS）。
   *
   * 应用场景：元素被抽出成新行、元素被删除导致某行只剩一个元素时，
   * 剩下的元素应占满整行，而非保留原来并排时的半宽。
   */
  function normalizeRowSpan(row: number): void {
    const sameRow = state.schema.elements.filter((e) => (e.row ?? 0) === row)
    if (sameRow.length === 1) sameRow[0].colSpan = GRID_COLUMNS
  }

  /** 新增一行空行（把 >= atRow 的元素 row 全部 +1） */
  function insertRow(atRow: number): void {
    for (const el of state.schema.elements) {
      if ((el.row ?? 0) >= atRow) el.row = (el.row ?? 0) + 1
    }
  }

  /**
   * 把元素抽到「两行之间的新行」——拖现有元素到行间隙时调用。
   *
   * 流程：
   *   1. 记录源行；insertRow(beforeRow) 把 beforeRow 及之后元素整体下移
   *   2. 注意：此时被拖元素若在 >= beforeRow 的行，其 row 已被 +1；需基于新行号判断
   *   3. 把元素放到新行（beforeRow），col=0
   *   4. 若源行变空，把 > 源行的元素 row 上移补齐空洞
   *
   * @param beforeRow 新行插入位置（成为该行号，原该行及之后整体下移）
   */
  function moveElementToNewRow(id: string, beforeRow: number): void {
    const el = state.schema.elements.find((e) => e.id === id)
    if (!el) return
    const sourceRow = el.row ?? 0
    // 先整体下移腾位
    insertRow(beforeRow)
    // 被拖元素若在 >= beforeRow 的行，insertRow 已把它 row+1，重新定位
    el.row = beforeRow
    el.col = 0
    // 源行变空则补齐空洞（用源行号；若源行 >= beforeRow，insertRow 后实际源行已 +1）
    const effectiveSourceRow = sourceRow >= beforeRow ? sourceRow + 1 : sourceRow
    const sourceStillHas = state.schema.elements.some(
      (e) => e.id !== id && (e.row ?? 0) === effectiveSourceRow,
    )
    if (!sourceStillHas) {
      for (const e of state.schema.elements) {
        if ((e.row ?? 0) > effectiveSourceRow) e.row = (e.row ?? 0) - 1
      }
    } else {
      normalizeRowCols(effectiveSourceRow)
    }
    // 新行可能只有这一个元素 → 撑满；源行若剩单元素也撑满
    normalizeRowCols(beforeRow)
    normalizeRowSpan(beforeRow)
    if (sourceStillHas) normalizeRowSpan(effectiveSourceRow)
  }

  /** 删除元素；若其所在行变空，把后续行 row 上移补齐（避免行号空洞） */
  function removeElement(id: string): void {
    const el = state.schema.elements.find((e) => e.id === id)
    if (!el) return
    const row = el.row ?? 0
    const idx = state.schema.elements.findIndex((e) => e.id === id)
    if (idx >= 0) state.schema.elements.splice(idx, 1)
    const rowStillHas = state.schema.elements.some((e) => (e.row ?? 0) === row)
    if (!rowStillHas) {
      for (const e of state.schema.elements) {
        if ((e.row ?? 0) > row) e.row = (e.row ?? 0) - 1
      }
    } else {
      normalizeRowCols(row)
      // 删除后该行只剩一个元素 → 撑满整行
      normalizeRowSpan(row)
    }
    if (state.activeId === id) state.activeId = null
  }

  /** 删除激活元素（委托 removeElement，处理行号空洞） */
  function removeActive(): void {
    if (!state.activeId) return
    removeElement(state.activeId)
  }

  /** 清空画布 */
  function clearCanvas(): void {
    state.schema.elements = []
    state.activeId = null
  }

  /** 切换纸张类型（保留元素，仅换画布尺寸） */
  function setPaper(type: PaperType): void {
    state.schema.paper = { ...PAPER_PRESETS[type] }
  }

  /** 切换单据类型（左栏物料重新过滤；清空画布避免跨类型残留） */
  function setDocumentType(type: string): void {
    state.schema.documentType = type
    state.schema.elements = []
    state.activeId = null
  }

  /** 设置数据源 */
  function setDataSource(data: DataSource): void {
    state.dataSource = data
  }

  /** 用完整 schema 覆盖当前（用于加载已保存模板） */
  function loadSchema(schema: TemplateSchema): void {
    state.schema = cloneDeep(schema)
    state.activeId = null
  }

  /** 导出当前 schema（深拷贝，脱离响应式） */
  function exportSchema(): TemplateSchema {
    return cloneDeep(state.schema)
  }

  return {
    // 直接暴露 reactive schema 便于子组件 v-model 直绑（需可写）
    schema: state.schema as Reactive<TemplateSchema>,
    activeId: computed(() => state.activeId),
    dataSource: computed(() => state.dataSource),
    // 计算属性
    activeElement,
    materials,
    rows,
    maxRow,
    canvasWidthPx,
    canvasHeightPx,
    // 方法
    addFromMaterial,
    toggleMaterial,
    findElementByMaterialName,
    selectElement,
    moveElement,
    moveElementToNewRow,
    insertRow,
    removeElement,
    removeActive,
    clearCanvas,
    setPaper,
    setDocumentType,
    setDataSource,
    loadSchema,
    exportSchema,
  }
}

/** useDesigner 的返回类型 */
export type DesignerInstance = ReturnType<typeof useDesigner>
