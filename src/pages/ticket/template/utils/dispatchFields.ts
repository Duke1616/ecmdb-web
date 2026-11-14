export interface TemplateRuleNode {
  type?: string
  field?: string
  title?: string
  children?: TemplateRuleNode[]
}

const isTemplateRuleNode = (value: unknown): value is TemplateRuleNode => {
  return typeof value === "object" && value !== null
}

/** 解析模板 rules（JSON 字符串或数组）为规则节点数组；非法 JSON 会抛出，由调用方兜底。 */
export const parseTemplateRules = (rules: unknown): TemplateRuleNode[] => {
  if (typeof rules === "string") {
    const parsed: unknown = JSON.parse(rules)
    return Array.isArray(parsed) ? parsed.filter(isTemplateRuleNode) : []
  }

  return Array.isArray(rules) ? rules.filter(isTemplateRuleNode) : []
}

/** 递归收集表单字段到 fieldMap（排除 fcRow / col 布局容器），title 缺省时回退字段名。 */
export const collectFieldMap = (rules: unknown, fieldMap: Map<string, string>): void => {
  let rulesArray: TemplateRuleNode[] = []

  try {
    rulesArray = parseTemplateRules(rules)
  } catch (error) {
    console.warn("解析 rules JSON 失败:", error)
    return
  }

  rulesArray.forEach((item) => {
    if (item.type !== "fcRow" && item.type !== "col" && item.field) {
      fieldMap.set(item.field, item.title || item.field)
    }

    if (Array.isArray(item.children)) {
      collectFieldMap(item.children, fieldMap)
    }
  })
}