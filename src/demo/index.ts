import type { DataSource, TemplateSchema } from '../designer/types'
import { KITCHEN_SCHEMA, KITCHEN_DATA } from './sampleSchema'
import { GUEST_SCHEMA, GUEST_DATA, CASHIER_SCHEMA, CASHIER_DATA } from './moreSamples'
import { DEMO_MATERIALS } from './materials'
import { registerMaterials } from '../designer/materials'

export { KITCHEN_SCHEMA, KITCHEN_DATA } from './sampleSchema'
export { SAMPLE_SCHEMA, SAMPLE_DATA } from './sampleSchema'
export { GUEST_SCHEMA, GUEST_DATA, CASHIER_SCHEMA, CASHIER_DATA } from './moreSamples'
export { DEMO_MATERIALS } from './materials'

/** 演示模板（schema + 配套数据源 + 元信息） */
export interface DemoTemplate {
  /** 唯一 key */
  key: string
  /** 显示名称 */
  label: string
  /** 场景描述 */
  desc: string
  schema: TemplateSchema
  dataSource: DataSource
}

/**
 * 演示模板注册表 —— 覆盖三类典型场景
 *
 * 1. 后厨小票   80mm 连续纸  小票线性流 + 表格树形 + 行级样式
 * 2. 客人登记单 A4 固定纸     二维网格表单 + 大量 label-value 并排
 * 3. 收银结账单 58mm 连续纸   紧凑小票 + 金额合计 + 表格线
 */
export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    key: 'kitchen',
    label: '后厨小票（80mm）',
    desc: '小票线性流 + 套餐树形 + 合计行样式',
    schema: KITCHEN_SCHEMA,
    dataSource: KITCHEN_DATA,
  },
  {
    key: 'guest',
    label: '客人登记单（A4）',
    desc: '二维网格表单 + 标签值并排 + 签字栏',
    schema: GUEST_SCHEMA,
    dataSource: GUEST_DATA,
  },
  {
    key: 'cashier',
    label: '收银结账单（58mm）',
    desc: '紧凑小票 + 表格线 + 金额合计',
    schema: CASHIER_SCHEMA,
    dataSource: CASHIER_DATA,
  },
]

/** 默认演示模板（首个） */
export const DEFAULT_DEMO = DEMO_TEMPLATES[0]

/** 按 key 查找演示模板 */
export function findDemo(key: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find((t) => t.key === key)
}

/**
 * 注册演示物料到全局注册表
 * 在应用启动时调用一次，将演示物料注入设计器。
 */
export function registerDemoMaterials(): void {
  registerMaterials(DEMO_MATERIALS)
}
