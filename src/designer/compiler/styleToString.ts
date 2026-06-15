import type { StyleObject } from '../types'

/**
 * 样式键名：camelCase → kebab-case
 *   fontSize → font-size, fontWeight → font-weight, textAlign → text-align
 */
function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

/**
 * 这些 CSS 属性的数值应附加 'px' 单位。
 * 其余数值属性（如 fontWeight / zIndex / opacity / lineHeight）保持无单位。
 */
const PX_KEYS = new Set([
  'fontSize',
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'borderWidth',
  'letterSpacing',
  'textIndent',
  'lineHeight',
])

/**
 * style 对象 → 原生 CSS 行内样式字符串
 *
 * 规则：
 *   - 数字值：PX_KEYS 内的属性附加 'px'，其余保持原值
 *   - 字符串值：原样输出
 *   - 值为空字符串/undefined/null 跳过
 *   - **每条声明后都带分号**（含末尾），保证后续字符串拼接（如追加列宽/边框片段）
 *     不会把两条声明粘连成无效 CSS（如 `text-align:leftwidth:50mm`）
 *
 * 示例：
 *   { fontSize: 14, color: '#f00', fontWeight: 700 }
 *   → 'font-size:14px;color:#f00;font-weight:700;'
 */
export function styleToString(style: StyleObject | undefined): string {
  if (!style) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(style)) {
    if (value === '' || value == null) continue
    const cssKey = toKebab(key)
    const cssValue = typeof value === 'number' ? (PX_KEYS.has(key) ? `${value}px` : String(value)) : value
    parts.push(`${cssKey}:${cssValue};`)
  }
  return parts.join('')
}

/**
 * 合并多个样式对象（后者覆盖前者），用于行级样式覆写场景。
 * 跳过 null/undefined 值。
 */
export function mergeStyles(...styles: Array<StyleObject | undefined>): StyleObject {
  const merged: StyleObject = {}
  for (const s of styles) {
    if (!s) continue
    for (const [k, v] of Object.entries(s)) {
      if (v === '' || v == null) continue
      merged[k] = v
    }
  }
  return merged
}
