import type { DataSource, TemplateSchema } from '../designer/types'
import { PAPER_PRESETS } from '../designer/paperPresets'

/**
 * 后厨小票 —— 演示模板（80mm 连续纸）
 *
 * 场景：小票线性流 + 表格树形 + 行级样式覆写
 * 排版：店铺名 → Logo → 大字桌号 → (下单时间 + 备注 同行并排) → 菜品清单（嵌套表格，含套餐子行 + 合计行加粗）
 */
export const KITCHEN_SCHEMA: TemplateSchema = {
  documentType: 'KITCHEN_RECEIPT',
  paper: { ...PAPER_PRESETS.PAPER_80MM },
  elements: [
    {
      id: 'kit-shop-name',
      name: '店铺名称',
      type: 'value',
      row: 0,
      col: 0,
      colSpan: 12,
      align: 'center',
      dataField: 'shop.name',
      style: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    },
    {
      id: 'kit-logo',
      name: '店铺Logo',
      type: 'image',
      row: 1,
      col: 0,
      colSpan: 12,
      align: 'center',
      srcField: 'shop.logoUrl',
      fit: 'contain',
      style: {},
    },
    {
      id: 'kit-table',
      name: '大字桌号',
      type: 'value',
      row: 2,
      col: 0,
      colSpan: 12,
      align: 'center',
      dataField: 'tableNo',
      style: { fontSize: 36, fontWeight: 'bold', color: '#000' },
    },
    // 同行并排：下单时间（左半）+ 备注（右半）各占 6 列
    {
      id: 'kit-time',
      name: '下单时间',
      type: 'label-value',
      row: 3,
      col: 0,
      colSpan: 6,
      align: 'left',
      label: '下单时间：',
      separator: '',
      dataField: 'orderTime',
      style: { fontSize: 12, color: '#333' },
    },
    {
      id: 'kit-remark',
      name: '备注',
      type: 'label-value',
      row: 3,
      col: 6,
      colSpan: 6,
      align: 'left',
      label: '备注：',
      separator: '',
      dataField: 'remark',
      style: { fontSize: 12, color: '#d00' },
    },
    {
      id: 'kit-items',
      name: '菜品清单',
      type: 'table',
      row: 4,
      col: 0,
      colSpan: 12,
      align: 'left',
      bordered: false,
      rowField: 'items',
      columns: [
        { key: 'name', label: '菜品', dataField: 'name', widthMM: 50 },
        { key: 'qty', label: '数量', dataField: 'qty', widthMM: 18 },
        { key: 'unit', label: '单位', dataField: 'unit', widthMM: 16 },
      ],
      style: { fontSize: 13, color: '#000' },
    },
  ],
}

/** 后厨小票数据源 */
export const KITCHEN_DATA: DataSource = {
  shop: {
    name: '老王川菜馆（人民路店）',
    logoUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%2318a058" rx="8"/><text x="32" y="42" font-size="32" fill="white" text-anchor="middle" font-family="sans-serif">王</text></svg>',
  },
  tableNo: 'A12',
  orderTime: '2026-06-14 12:30:45',
  remark: '少辣，不要香菜',
  items: [
    { name: '宫保鸡丁', qty: 1, unit: '份' },
    {
      name: '双人套餐（含 3 道）',
      qty: 1,
      unit: '套',
      children: [
        { name: '  ├ 水煮鱼', qty: 1, unit: '份' },
        { name: '  ├ 麻婆豆腐', qty: 1, unit: '份' },
        { name: '  └ 蒜蓉空心菜', qty: 1, unit: '份' },
      ],
    },
    { name: '米饭', qty: 2, unit: '碗' },
    {
      name: '酸梅汤（加料）',
      qty: 2,
      unit: '杯',
      children: [{ name: '  └ 加冰', qty: 2, unit: '份' }],
    },
    // 合计行：行级样式覆写（加粗 + 放大）
    {
      name: '合计 6 件',
      qty: '',
      unit: '',
      _rowStyle: { fontWeight: 'bold', fontSize: 14 },
    },
  ],
}

// 保留旧导出名以兼容（test / preview 引用）
export const SAMPLE_SCHEMA = KITCHEN_SCHEMA
export const SAMPLE_DATA = KITCHEN_DATA
