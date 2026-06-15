import { inject, provide, type InjectionKey } from 'vue'
import type { DesignerInstance } from './useDesigner'

/**
 * provide / inject 下发 useDesigner 实例
 *
 * 设计原则：禁用 Pinia/Vuex，统一通过 Vue 原生响应式 + Context 下发。
 * Designer.vue 在顶层 provide，LeftPanel / Canvas / RightPanel inject 拿同一实例。
 */
export const DESIGNER_KEY: InjectionKey<DesignerInstance> = Symbol('print-designer')

export function provideDesigner(instance: DesignerInstance): void {
  provide(DESIGNER_KEY, instance)
}

/** 子组件获取 designer 实例；若未注入则抛错（避免静默失败） */
export function injectDesigner(): DesignerInstance {
  const instance = inject(DESIGNER_KEY)
  if (!instance) {
    throw new Error('[print-designer] injectDesigner 失败：未找到 Designer 上下文。请确保组件位于 <Designer> 内部。')
  }
  return instance
}
