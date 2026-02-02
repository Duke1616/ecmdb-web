import { FormRule } from "@form-create/element-ui"

/**
 * 递归移除 rules 中的 fetch 配置
 * NOTE: 用于在只读/查看模式下防止触发动态请求，避免无关的接口报错
 * @param rules 表单规则
 */
export const removeFetchFromRules = (rules: FormRule[]) => {
  if (!Array.isArray(rules)) return

  rules.forEach((rule: any) => {
    if (rule.fetch) {
      delete rule.fetch
    }
    if (rule.children) {
      removeFetchFromRules(rule.children)
    }
    if (rule.control) {
      rule.control.forEach((c: any) => {
        if (c.rule) {
          removeFetchFromRules(c.rule)
        }
      })
    }
  })
}
