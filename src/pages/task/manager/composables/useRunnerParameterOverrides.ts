import { computed, ref, type Ref } from "vue"
import { ElMessage } from "element-plus"
import { getRunnerDetailApi } from "@/api/task/runner"
import type { runner as Runner } from "@/api/task/runner/types/runner"
import { listAllResourcesApi } from "@/api/task/resource"
import { ParameterRole, type HandlerDetail, type Parameter, type Resource } from "@/api/task/resource/type"
import { parameterDefaultsToInputs } from "@/pages/task/runner/parameterDefaults"
import { resolveRunnerHandler } from "@/pages/task/shared/runnerResources"
import type { TaskFormState } from "./useTaskData"
import { mergeParameterValues, pickParameterOverrides, serializeRunnerVariables } from "./parameterOverrides"

const createFallbackParameter = (key: string, defaultValue: string): Parameter => {
  const isVariables = key === "variables"
  return {
    key,
    role: isVariables ? ParameterRole.Variables : undefined,
    desc: isVariables ? "环境变量" : key,
    required: false,
    default: defaultValue,
    bindings: {
      static: {
        component: isVariables ? "kv-input" : "text-input",
        config: {},
        placeholder: isVariables ? "添加调用级变量" : "请输入覆盖值",
        label: "手动输入"
      }
    }
  }
}

/** Runner 已由外层执行单元确定，参数内部不再允许二次选择 Runner 引用。 */
const resolveManualBindings = (parameter: Parameter) => {
  const bindings = Object.fromEntries(
    Object.entries(parameter.bindings ?? {}).filter(([, binding]) => binding.component !== "runner-picker")
  )
  return Object.keys(bindings).length ? bindings : createFallbackParameter(parameter.key, parameter.default).bindings
}

/**
 * Runner 调用参数上下文：加载默认配置、匹配 Handler 元数据，并维护差异覆盖模型。
 */
export const useRunnerParameterOverrides = (form: Ref<TaskFormState>) => {
  const loading = ref(false)
  const currentRunner = ref<Runner | null>(null)
  const currentHandler = ref<HandlerDetail | null>(null)
  const declaredDefaults = ref<Record<string, string>>({})
  let contextRequest = 0
  let resourcesPromise: Promise<Resource[]> | undefined

  const loadResources = () => {
    if (!resourcesPromise) {
      resourcesPromise = listAllResourcesApi().catch((error) => {
        resourcesPromise = undefined
        throw error
      })
    }
    return resourcesPromise
  }

  /** Runner 显式配置优先于 Handler 元数据默认值。 */
  const defaults = computed<Record<string, string>>(() => {
    const values: Record<string, string> = {}
    for (const parameter of currentHandler.value?.metadata ?? []) {
      values[parameter.key] = parameter.default || ""
    }
    return { ...values, ...declaredDefaults.value }
  })

  const parameters = computed<Parameter[]>(() => {
    const values = defaults.value
    const definitions = (currentHandler.value?.metadata ?? []).map((parameter) => ({
      ...parameter,
      default: values[parameter.key] ?? parameter.default ?? "",
      bindings: resolveManualBindings(parameter)
    }))
    const declaredKeys = new Set(definitions.map((parameter) => parameter.key))

    for (const key of new Set([...Object.keys(values), ...Object.keys(form.value.runner_params)])) {
      if (!declaredKeys.has(key)) definitions.push(createFallbackParameter(key, values[key] ?? ""))
    }
    return definitions
  })

  /** 展示有效值，回写时只保留相对 Runner 当前默认值真正变化的字段。 */
  const inputs = computed<Record<string, string>>({
    get: () => mergeParameterValues(defaults.value, form.value.runner_params),
    set: (values) => {
      form.value.runner_params = pickParameterOverrides(values, defaults.value, parameters.value)
    }
  })

  const resetContextValues = () => {
    currentRunner.value = null
    currentHandler.value = null
    declaredDefaults.value = {}
  }

  const clearContext = () => {
    contextRequest++
    resetContextValues()
    loading.value = false
  }

  const loadContext = async (runnerId?: number) => {
    const request = ++contextRequest
    resetContextValues()
    if (!runnerId) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      const [detailResult, resourcesResult] = await Promise.allSettled([getRunnerDetailApi(runnerId), loadResources()])
      if (request !== contextRequest) return
      if (detailResult.status === "rejected") throw detailResult.reason

      const runner = detailResult.value.data
      currentRunner.value = runner
      declaredDefaults.value = {
        ...parameterDefaultsToInputs(runner.parameter_defaults),
        variables: serializeRunnerVariables(runner.variables)
      }

      if (resourcesResult.status === "fulfilled") {
        currentHandler.value = resolveRunnerHandler(runner, resourcesResult.value) ?? null
      } else {
        console.warn("加载执行节点元数据失败，将使用 Runner 已声明参数:", resourcesResult.reason)
      }
    } catch (error) {
      if (request !== contextRequest) return
      console.error("加载执行单元参数失败:", error)
      ElMessage.error("加载执行单元参数失败")
    } finally {
      if (request === contextRequest) loading.value = false
    }
  }

  const clearOverrides = () => {
    form.value.runner_params = {}
  }

  return {
    loading,
    currentRunner,
    parameters,
    inputs,
    loadContext,
    clearContext,
    clearOverrides
  }
}
