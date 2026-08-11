import { computed, ref, type Ref } from "vue"
import { ElMessage } from "element-plus"
import { getRunnerDetailApi } from "@/api/task/runner"
import type { runner as Runner } from "@/api/task/runner/types/runner"
import { listAllResourcesApi } from "@/api/task/resource"
import type { HandlerDetail, Parameter, Resource } from "@/api/task/resource/type"
import { mergeParameterValues, pickParameterOverrides } from "./parameterOverrides"
import { resolveRunnerHandler } from "./runnerResources"
import { buildRunnerDeclaredDefaults } from "./runnerCallDefaults"

const createFallbackParameter = (key: string, defaultValue: string): Parameter => ({
  key,
  desc: key,
  required: false,
  default: defaultValue,
  bindings: {
    static: {
      component: "text-input",
      config: {},
      placeholder: "请输入覆盖值",
      label: "手动输入"
    }
  }
})

/** Runner 已由外层确定，调用参数内部不再允许二次选择 Runner 引用。 */
const resolveManualBindings = (parameter: Parameter) => {
  const bindings = Object.fromEntries(
    Object.entries(parameter.bindings ?? {}).filter(([, binding]) => binding.component !== "runner-picker")
  )
  return Object.keys(bindings).length ? bindings : createFallbackParameter(parameter.key, parameter.default).bindings
}

/**
 * 可复用的 Runner 调用参数上下文：加载 Handler metadata、Runner 默认值与私有变量，
 * 编辑器展示有效值，外部 overrides 只保存真正变化的调用级覆盖。
 */
export const useRunnerCallParameters = (overrides: Ref<Record<string, string>>) => {
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

  /** Runner 显式配置优先于 Handler metadata 默认值。 */
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

    for (const key of new Set([...Object.keys(values), ...Object.keys(overrides.value)])) {
      if (!declaredKeys.has(key)) definitions.push(createFallbackParameter(key, values[key] ?? ""))
    }
    return definitions
  })

  const inputs = computed<Record<string, string>>({
    get: () => mergeParameterValues(defaults.value, overrides.value),
    set: (values) => {
      overrides.value = pickParameterOverrides(values, defaults.value, parameters.value)
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
      if (resourcesResult.status === "fulfilled") {
        currentHandler.value = resolveRunnerHandler(runner, resourcesResult.value) ?? null
      } else {
        console.warn("加载执行节点元数据失败，将使用 Runner 已声明参数:", resourcesResult.reason)
      }

      declaredDefaults.value = buildRunnerDeclaredDefaults(runner, currentHandler.value)
    } catch (error) {
      if (request !== contextRequest) return
      console.error("加载执行单元参数失败:", error)
      ElMessage.error("加载执行单元参数失败")
    } finally {
      if (request === contextRequest) loading.value = false
    }
  }

  const clearOverrides = () => {
    overrides.value = {}
  }

  return {
    loading,
    currentRunner,
    currentHandler,
    defaults,
    parameters,
    inputs,
    loadContext,
    clearContext,
    clearOverrides
  }
}
