import type { Condition } from "@/api/iam/policy/type"
import { formatPolicyExpression, getPolicyExpressionValidationMessage, visitExpressionPredicates } from "./expression"

/** EIAM Condition 属性的人类可读名称。 */
export const conditionAttributeLabels: Record<string, string> = {
  "principal:username": "登录用户名",
  "environment:current_time": "当前时间"
}

const conditionAttributeKeys = new Set(Object.keys(conditionAttributeLabels))

/** 格式化 Condition 供策略摘要和详情页面展示。 */
export const formatCondition = (condition?: Condition): string =>
  formatPolicyExpression(condition, conditionAttributeLabels, "无生效条件")

/** 校验 Condition 的 AST 结构及 EIAM 属性命名空间。 */
export const getConditionValidationMessage = (condition?: Condition): string => {
  const structuralMessage = getPolicyExpressionValidationMessage(condition, "Condition")
  if (structuralMessage) return structuralMessage

  return visitExpressionPredicates(condition, (predicate) => {
    if (!conditionAttributeKeys.has(predicate.key)) return `Condition 不支持属性 ${predicate.key}`
    for (const operand of predicate.values) {
      if (operand.type === "ref" && !conditionAttributeKeys.has(String(operand.value))) {
        return `Condition 不支持属性引用 ${String(operand.value)}`
      }
    }
    return ""
  })
}
