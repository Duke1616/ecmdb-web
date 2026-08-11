import { isEqual } from "lodash-es"
import type { Parameter } from "@/api/task/resource/type"

export type ParameterValues = Record<string, string>

/** 编辑器展示继承后的有效值，覆盖值优先。 */
export const mergeParameterValues = (defaults: ParameterValues, overrides: ParameterValues): ParameterValues => ({
  ...defaults,
  ...overrides
})

const firstBinding = (parameter?: Parameter) => Object.values(parameter?.bindings ?? {})[0]

const parseJSON = (value: string) => {
  try {
    return { valid: true as const, value: JSON.parse(value) }
  } catch {
    return { valid: false as const, value }
  }
}

/**
 * 参数是否仍等于继承值。
 * JSON/键值数组按结构比较，避免缩进或对象字段顺序不同产生无效覆盖。
 */
export const isInheritedParameterValue = (value: string, inherited: string, parameter?: Parameter): boolean => {
  if (value === inherited) return true

  const binding = firstBinding(parameter)
  if (binding?.component === "number-input") {
    const currentNumber = Number(value)
    const inheritedNumber = Number(inherited)
    return value.trim() !== "" && inherited.trim() !== "" && currentNumber === inheritedNumber
  }

  const isJSONValue =
    binding?.component === "kv-input" ||
    (binding?.component === "code-editor" && binding.config?.language?.toLowerCase() === "json")
  if (!isJSONValue) return false

  const currentJSON = parseJSON(value)
  const inheritedJSON = parseJSON(inherited)
  return currentJSON.valid && inheritedJSON.valid && isEqual(currentJSON.value, inheritedJSON.value)
}

/** 只保留相对继承值真正变化的参数。 */
export const pickParameterOverrides = (
  values: ParameterValues,
  defaults: ParameterValues,
  parameters: Parameter[] = []
): ParameterValues => {
  const parameterMap = new Map(parameters.map((parameter) => [parameter.key, parameter]))
  const overrides: ParameterValues = {}

  for (const [key, value] of Object.entries(values)) {
    if (!Object.hasOwn(defaults, key) || !isInheritedParameterValue(value, defaults[key], parameterMap.get(key))) {
      overrides[key] = value
    }
  }
  return overrides
}

/** Runner 私有变量沿用 variables 参数的数组格式，作为调用级编辑器的继承值。 */
export const serializeRunnerVariables = (variables: Array<{ key: string; value: string; secret: boolean }> = []) =>
  JSON.stringify(variables)
