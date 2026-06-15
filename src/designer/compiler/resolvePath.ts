/**
 * 点路径解析工具 —— 支持嵌套取值与数组下标
 *
 * 示例：
 *   resolvePath({ a: { b: 1 } }, 'a.b')           → 1
 *   resolvePath({ list: [{ id: 7 }] }, 'list.0.id') → 7
 *   resolvePath({}, 'missing.path', '默认')         → '默认'
 *
 * 当中间值为 null/undefined 时安全返回 fallback，不抛错。
 */
export function resolvePath<T = unknown>(
  obj: unknown,
  path: string,
  fallback?: T,
): T | undefined {
  if (obj == null) return fallback
  if (!path) return obj as T

  const segments = path.split('.')
  let current: unknown = obj

  for (const seg of segments) {
    if (current == null) return fallback
    // 数组下标也走 [] 访问，字符串 key 同样适用
    current = (current as Record<string, unknown>)[seg]
  }

  return current === undefined ? fallback : (current as T)
}
