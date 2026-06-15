import type { PaperConfig, PaperType } from './types'

/**
 * 纸张预设
 * - 固定尺寸：A4 (210×297mm)、A5 (148×210mm)、三等分 (210×99mm)
 * - 连续纸张：80mm、58mm（宽度固定，设计区给默认虚拟高度，最终渲染 height:auto）
 */
export const PAPER_PRESETS: Record<PaperType, PaperConfig> = {
  A4: { type: 'A4', widthMM: 210, heightMM: 297 },
  A5: { type: 'A5', widthMM: 148, heightMM: 210 },
  TRISECTION: { type: 'TRISECTION', widthMM: 210, heightMM: 99 },
  PAPER_80MM: { type: 'PAPER_80MM', widthMM: 80, heightMM: null, designHeightMM: 297 },
  PAPER_58MM: { type: 'PAPER_58MM', widthMM: 58, heightMM: null, designHeightMM: 297 },
}

/** 纸张类型下拉选项 */
export const PAPER_OPTIONS: { label: string; value: PaperType }[] = [
  { label: 'A4 (210×297mm)', value: 'A4' },
  { label: 'A5 (148×210mm)', value: 'A5' },
  { label: '三等分 (210×99mm)', value: 'TRISECTION' },
  { label: '80mm 连续纸', value: 'PAPER_80MM' },
  { label: '58mm 连续纸', value: 'PAPER_58MM' },
]
