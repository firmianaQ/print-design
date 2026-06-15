/**
 * 物料注册表 —— 通用注册机制
 *
 * ALL_MATERIALS 为空数组，业务方通过 registerMaterials() 注册自定义物料。
 * 演示物料由 demo 层注册，不属于核心库。
 */
import type { MaterialItem } from '../types'

/** 全部已注册物料（初始为空，由 registerMaterials() 填充） */
export const ALL_MATERIALS: MaterialItem[] = []

/**
 * 注册物料到全局注册表
 * 业务方在应用启动时调用，将自定义物料注入设计器。
 */
export function registerMaterials(materials: MaterialItem[]): void {
  ALL_MATERIALS.push(...materials)
}

/** 全部已注册的单据类型（用于物料库分类/下拉） */
export function listDocumentTypes(): string[] {
  const set = new Set<string>()
  for (const m of ALL_MATERIALS) set.add(m.documentType)
  return [...set]
}

/**
 * 按单据类型过滤物料 —— 左侧面板数据源
 */
export function filterMaterialsByDocumentType(documentType: string): MaterialItem[] {
  return ALL_MATERIALS.filter((m) => m.documentType === documentType)
}
