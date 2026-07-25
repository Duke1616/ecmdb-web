import type { ConditionOperand, ConditionOperator, ConditionPredicate, PolicyExpression } from "@/api/iam/policy/type"

const supportedOperators = new Set<ConditionOperator>([
  "StringEquals",
  "StringNotEquals",
  "StringEqualsIgnoreCase",
  "StringContains",
  "ForAnyValue:StringEquals",
  "ForAllValues:StringNotEquals",
  "NumericEquals",
  "NumericLessThan",
  "NumericGreaterThan",
  "Bool",
  "DateLessThan",
  "DateGreaterThan",
  "IpAddress",
  "NotIpAddress"
])

const operatorLabels: Partial<Record<ConditionOperator, string>> = {
  StringEquals: "等于",
  StringNotEquals: "不等于",
  StringEqualsIgnoreCase: "等于（忽略大小写）",
  StringContains: "包含",
  "ForAnyValue:StringEquals": "任一值等于",
  "ForAllValues:StringNotEquals": "所有值均不等于",
  NumericEquals: "数值等于",
  NumericLessThan: "数值小于",
  NumericGreaterThan: "数值大于",
  Bool: "为",
  DateLessThan: "早于",
  DateGreaterThan: "晚于",
  IpAddress: "属于网段",
  NotIpAddress: "不属于网段"
}

const formatOperand = (operand: ConditionOperand, attributeLabels: Record<string, string>) => {
  if (operand.type === "ref") {
    const key = String(operand.value)
    return attributeLabels[key] || key
  }
  return typeof operand.value === "string" ? operand.value : JSON.stringify(operand.value)
}

/** 将 Condition/AccessScope AST 格式化为紧凑的人类可读文本。 */
export const formatPolicyExpression = (
  expression: PolicyExpression | undefined,
  attributeLabels: Record<string, string>,
  emptyText: string
): string => {
  if (!expression) return emptyText
  if (expression.predicate) {
    const { key, operator, values } = expression.predicate
    const left = attributeLabels[key] || key
    const op = operatorLabels[operator] || operator
    return `${left} ${op} ${values.map((value) => formatOperand(value, attributeLabels)).join("、")}`
  }
  if (expression.all) {
    return `(${expression.all.map((item) => formatPolicyExpression(item, attributeLabels, emptyText)).join(" 且 ")})`
  }
  if (expression.any) {
    return `(${expression.any.map((item) => formatPolicyExpression(item, attributeLabels, emptyText)).join(" 或 ")})`
  }
  return "无效表达式"
}

/** 遍历表达式中的所有叶子 Predicate。 */
export const visitExpressionPredicates = (
  expression: PolicyExpression | undefined,
  visitor: (predicate: ConditionPredicate) => string
): string => {
  if (!expression) return ""
  if (expression.predicate) return visitor(expression.predicate)
  for (const child of expression.all || expression.any || []) {
    const message = visitExpressionPredicates(child, visitor)
    if (message) return message
  }
  return ""
}

/** 与后端边界一致的有界表达式结构校验。 */
export const getPolicyExpressionValidationMessage = (
  expression: PolicyExpression | undefined,
  fieldName: "Condition" | "AccessScope"
): string => {
  if (!expression) return ""

  let predicates = 0
  const visit = (node: PolicyExpression, depth: number): string => {
    if (depth > 4) return `${fieldName} 嵌套深度不能超过 4 层`
    const kinds =
      Number(!!node.predicate) +
      Number(Array.isArray(node.all) && node.all.length > 0) +
      Number(Array.isArray(node.any) && node.any.length > 0)
    if (kinds !== 1) return `每个 ${fieldName} 节点必须且只能包含 all、any 或 predicate 之一`

    if (node.predicate) {
      predicates += 1
      if (predicates > 32) return `${fieldName} 判断数量不能超过 32 个`
      if (!node.predicate.key.trim()) return `${fieldName} 属性键不能为空`
      if (!supportedOperators.has(node.predicate.operator)) return `不支持操作符 ${node.predicate.operator}`
      if (!Array.isArray(node.predicate.values) || node.predicate.values.length === 0) {
        return `${fieldName} 至少需要一个比较值`
      }
      if (node.predicate.values.length > 100) return `单个 ${fieldName} 的比较值不能超过 100 个`
      for (const operand of node.predicate.values) {
        if (operand.type !== "literal" && operand.type !== "ref") {
          return `${fieldName} 值类型只能是 literal 或 ref`
        }
        if (operand.type === "ref" && !String(operand.value || "").trim()) {
          return `${fieldName} 属性引用不能为空`
        }
      }
      return ""
    }

    for (const child of node.all || node.any || []) {
      const message = visit(child, depth + 1)
      if (message) return message
    }
    return ""
  }

  return visit(expression, 1)
}
