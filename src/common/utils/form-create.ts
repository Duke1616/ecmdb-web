/**
 * 递归移除 rules 中的 fetch 配置
 * NOTE: 用于在只读/查看模式下防止触发动态请求，避免无关的接口报错
 * @param rules 表单规则
 */
/**
 * 递归移除 rules 中的 fetch 配置 (深度遍历)
 * NOTE: 用于在只读/查看模式下防止触发动态请求，避免无关的接口报错
 * @param data 表单规则或任意对象
 */
export const removeFetchFromRules = (data: any) => {
  if (!data || typeof data !== "object") return

  // Handle Arrays
  if (Array.isArray(data)) {
    data.forEach((item) => removeFetchFromRules(item))
    return
  }

  // Handle Objects
  // Aggressively delete dynamic properties
  const dynamicKeys = ["fetch", "effect", "link"]
  dynamicKeys.forEach((key) => {
    if (key in data) {
      delete data[key]
      data[key] = undefined
    }
  })

  // Recurse into all object properties to find nested fetch configs
  // This covers children, control, or any other nesting structure
  Object.keys(data).forEach((key) => {
    const val = data[key]
    if (typeof val === "object" && val !== null) {
      removeFetchFromRules(val)
    }
  })
}
