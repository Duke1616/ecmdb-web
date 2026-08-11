import { ParameterRole, type Parameter } from "@/api/task/resource/type"
import type { JsonValue, ParameterDefaults } from "@/api/task/runner/types/runner"

/** 判断 Handler 参数是否承载统一变量集合，并兼容没有 role 的旧版通用 Handler。 */
export const isVariablesParameter = (parameter: Parameter) =>
  parameter.role === ParameterRole.Variables || parameter.key === "variables"

/** Runner 默认参数在编辑器中统一使用字符串，提交时再恢复为 JSON 值。 */
export const parameterDefaultsToInputs = (defaults?: ParameterDefaults): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(defaults || {})) {
    if (value === null) {
      result[key] = ""
    } else if (typeof value === "string") {
      result[key] = value
    } else {
      result[key] = JSON.stringify(value)
    }
  }
  return result
}

const firstComponent = (parameter: Parameter) => Object.values(parameter.bindings || {})[0]?.component

const restoreJsonValue = (raw: string, parameter: Parameter): JsonValue => {
  const component = firstComponent(parameter)
  if (component === "boolean-switch") return raw === "true"
  if (component === "number-input") {
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  }
  if (component === "kv-input" || component === "code-editor") {
    try {
      return JSON.parse(raw || (component === "kv-input" ? "[]" : "null")) as JsonValue
    } catch {
      return raw
    }
  }
  return raw
}

/** 只提交当前 Handler 可配置且非 variables 语义的默认参数，顺便清理切换 Handler 后的遗留字段。 */
export const inputsToParameterDefaults = (
  inputs: Record<string, string>,
  parameters: Parameter[]
): ParameterDefaults => {
  const result: ParameterDefaults = {}
  for (const parameter of parameters) {
    if (isVariablesParameter(parameter) || !Object.hasOwn(inputs, parameter.key)) continue
    result[parameter.key] = restoreJsonValue(inputs[parameter.key], parameter)
  }
  return result
}
