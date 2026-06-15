import { generateHTML } from '../compiler'
import type { DataSource, TemplateSchema } from '../compiler'

/**
 * 把模板编译为 HTML 字符串（唯一编译入口）。
 * 预览与输出控制台共用此产物，避免重复编译、保证两者完全一致。
 */
export function exportHTML(schema: TemplateSchema, dataSource: DataSource): string {
  return generateHTML(schema, dataSource)
}

/**
 * 预览打印 HTML —— 在新窗口展示「已编译好的」HTML 字符串。
 *
 * 注意：仅展示生成的 DOM，不含 window.print() 调用（遵循设计边界）。
 * 用户可自行在预览窗口按 Ctrl+P 调用浏览器原生打印。
 *
 * @param html 由 exportHTML 编译产出的 HTML 字符串
 */
export function previewHTML(html: string): void {
  const win = window.open('', '_blank', 'width=480,height=720')
  if (!win) {
    // 弹窗被拦截时回退到控制台输出
    console.warn('[print-designer] 预览窗口被浏览器拦截，HTML 已输出到控制台：\n', html)
    return
  }
  win.document.open()
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>打印预览</title></head><body>${html}</body></html>`)
  win.document.close()
}
