import type { AccessScope, ConditionOperand } from "@/api/iam/policy/type"
import type { AccessScopePreset } from "@/api/iam/permission/type"
import type { ManifestService } from "../composables/usePolicyData"
import { formatPolicyExpression, getPolicyExpressionValidationMessage, visitExpressionPredicates } from "./expression"
import { clonePolicyJson } from "./clone"

/** 面向策略编辑器展示的 AccessScope 选项；none 为不附加业务数据过滤。 */
export interface AccessScopeTemplateOption {
  id: string
  label: string
  description: string
  expression?: AccessScope
}

const noneOption: AccessScopeTemplateOption = {
  id: "none",
  label: "全部数据（不限制）",
  description: "授权后可以访问全部业务数据，请仅授予确实需要完整数据权限的管理员"
}

/** 将 Manifest 中的业务模板转换为编辑器和详情页共用的展示选项。 */
export const toAccessScopeTemplateOptions = (presets: AccessScopePreset[] = []): AccessScopeTemplateOption[] => [
  ...presets.map((preset) => ({
    id: preset.code,
    label: preset.name,
    description: preset.description || preset.name,
    expression: preset.expression
  })),
  noneOption
]

const immediateAttributeKeys = new Set(["principal:username", "environment:current_time"])

const isReservedAttributeKey = (key: string) =>
  ["principal:", "environment:", "request:", "auth:"].some((prefix) => key.startsWith(prefix))

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalize((value as Record<string, unknown>)[key])
        return result
      }, {})
  }
  return value
}

const expressionEquals = (left: AccessScope, right: AccessScope) =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right))

const actionPresetMap = (manifest: ManifestService[]): Map<string, AccessScopePreset[]> => {
  const result = new Map<string, AccessScopePreset[]>()
  const visit = (group: ManifestService["entries"][number]) => {
    for (const action of group.actions || []) {
      result.set(action.code, action.access_scope_presets || [])
    }
    for (const child of group.children || []) visit(child)
  }
  for (const service of manifest) {
    for (const group of service.entries || []) visit(group)
  }
  return result
}

const hasWildcard = (actions: string[]) => actions.some((action) => action.includes("*") || action.includes("?"))

/** 返回可安全从混合 Statement 中拆出的精确 AccessScope Action。 */
export const getSelectedAccessScopeActions = (actions: string[], manifest: ManifestService[]): string[] => {
  const presetsByAction = actionPresetMap(manifest)
  return actions.filter(
    (action) =>
      !action.includes("*") &&
      !action.includes("?") &&
      presetsByAction.has(action) &&
      presetsByAction.get(action)!.length > 0
  )
}

/** 判断所选精确 Action 是否都声明了 AccessScope 能力。 */
export const supportsVisualAccessScope = (actions: string[], manifest: ManifestService[]): boolean => {
  if (actions.length === 0 || hasWildcard(actions)) return false
  const presetsByAction = actionPresetMap(manifest)
  return actions.every((action) => (presetsByAction.get(action)?.length || 0) > 0)
}

/** 返回所有所选 Action 共同声明、且表达式一致的 AccessScope 模板。 */
export const getAvailableAccessScopeTemplates = (
  actions: string[],
  manifest: ManifestService[]
): AccessScopeTemplateOption[] => {
  if (!supportsVisualAccessScope(actions, manifest)) return []
  const presetsByAction = actionPresetMap(manifest)
  const [firstAction, ...remainingActions] = actions
  const common = (presetsByAction.get(firstAction) || []).filter((preset) =>
    remainingActions.every((action) =>
      (presetsByAction.get(action) || []).some(
        (candidate) => candidate.code === preset.code && expressionEquals(candidate.expression, preset.expression)
      )
    )
  )
  return toAccessScopeTemplateOptions(common).map((template) => ({
    ...template,
    expression: template.expression ? clonePolicyJson(template.expression) : undefined
  }))
}

/** 返回当前混合选择中，支持 AccessScope 的 Action 所共有的模板。 */
export const getAccessScopeTemplatesForSelection = (
  actions: string[],
  manifest: ManifestService[]
): AccessScopeTemplateOption[] => {
  if (hasWildcard(actions)) return []
  return getAvailableAccessScopeTemplates(getSelectedAccessScopeActions(actions, manifest), manifest)
}

/** 由业务服务声明的模板构造后端接受的 AccessScope AST。 */
export const createAccessScopeFromTemplate = (
  id: string,
  templates: AccessScopeTemplateOption[]
): AccessScope | undefined => {
  if (id === "none") return undefined
  const template = templates.find((item) => item.id === id)
  return template?.expression ? clonePolicyJson(template.expression) : undefined
}

/** 无损识别已声明的 AccessScope 模板；未知表达式返回 custom。 */
export const detectAccessScopeTemplate = (
  scope: AccessScope | undefined,
  templates: AccessScopeTemplateOption[]
): string => {
  if (!scope) return "none"
  return (
    templates.find((template) => template.expression && expressionEquals(scope, template.expression))?.id || "custom"
  )
}

/** 格式化 AccessScope；已声明模板优先使用业务服务提供的名称。 */
export const formatAccessScope = (scope?: AccessScope, templates: AccessScopeTemplateOption[] = []): string => {
  if (!scope) return "全部数据"
  const template = templates.find((item) => item.expression && expressionEquals(scope, item.expression))
  if (template) return template.label
  return formatPolicyExpression(scope, { "principal:username": "当前用户名" }, "全部数据")
}

/** 校验 AccessScope 的 AST、属性边界和 Action 能力声明。 */
export const getAccessScopeValidationMessage = (
  scope?: AccessScope,
  actions: string[] = [],
  manifest: ManifestService[] = []
): string => {
  const structuralMessage = getPolicyExpressionValidationMessage(scope, "AccessScope")
  if (structuralMessage || !scope) return structuralMessage

  const namespaceMessage = visitExpressionPredicates(scope, (predicate) => {
    if (isReservedAttributeKey(predicate.key)) {
      return `AccessScope 属性 ${predicate.key} 必须是业务数据属性`
    }
    for (const operand of predicate.values) {
      if (operand.type === "ref" && !immediateAttributeKeys.has(String(operand.value))) {
        return `AccessScope 属性引用 ${String(operand.value)} 必须由 EIAM 提供`
      }
    }
    return ""
  })
  if (namespaceMessage) return namespaceMessage

  if (actions.length === 0) return ""
  if (hasWildcard(actions)) return "AccessScope 不能配置在通配符 Action 上，请改为精细化操作"
  if (manifest.length === 0) return ""
  if (!supportsVisualAccessScope(actions, manifest)) {
    return "AccessScope 只能配置在全部声明了访问范围能力的独立权限语句中"
  }
  return ""
}

/** 构造引用当前用户名的模板值，供业务能力声明测试与兼容代码复用。 */
export const principalUsernameRef = (): ConditionOperand => ({ type: "ref", value: "principal:username" })
