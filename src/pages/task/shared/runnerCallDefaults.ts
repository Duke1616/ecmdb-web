import type { runner as Runner } from "@/api/task/runner/types/runner"
import { ParameterRole, type HandlerDetail } from "@/api/task/resource/type"
import { parameterDefaultsToInputs } from "@/pages/task/runner/parameterDefaults"
import { serializeRunnerVariables } from "./parameterOverrides"

/** 按 Handler 的 variables 语义 Key 组合 Runner 参数默认值和私有变量。 */
export const buildRunnerDeclaredDefaults = (
  runner: Pick<Runner, "parameter_defaults" | "variables">,
  handler: HandlerDetail | null
): Record<string, string> => {
  const variablesKey = handler?.metadata?.find((parameter) => parameter.role === ParameterRole.Variables)?.key
  return {
    ...parameterDefaultsToInputs(runner.parameter_defaults),
    ...(variablesKey ? { [variablesKey]: serializeRunnerVariables(runner.variables) } : {})
  }
}
