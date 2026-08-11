import { ParameterRole, type Parameter } from "@/api/task/resource/type"
import type { PreviewVariable } from "@/api/task/codebook/types/preview"

export interface PreviewOverrides {
  params: Record<string, string>
  variables: PreviewVariable[]
}

/** 将动态参数编辑器的差异值拆成普通 Handler 参数和独立执行变量。 */
export const buildPreviewOverrides = (overrides: Record<string, string>, parameters: Parameter[]): PreviewOverrides => {
  const params = { ...overrides }
  const variablesKey = parameters.find((parameter) => parameter.role === ParameterRole.Variables)?.key
  if (!variablesKey || !Object.hasOwn(params, variablesKey)) return { params, variables: [] }

  const rawVariables = params[variablesKey]
  delete params[variablesKey]
  let value: unknown
  try {
    value = JSON.parse(rawVariables || "[]")
  } catch {
    throw new Error("运行变量必须是合法 JSON")
  }
  if (!Array.isArray(value)) throw new Error("运行变量必须是键值数组")

  const variables = value.map((item) => {
    if (!item || typeof item !== "object" || typeof item.key !== "string") {
      throw new Error("运行变量格式不正确")
    }
    return {
      key: item.key,
      value: typeof item.value === "string" ? item.value : String(item.value ?? ""),
      secret: !!item.secret
    }
  })
  return { params, variables }
}
