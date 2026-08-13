import { computed, ref } from "vue"
import { cloneDeep } from "lodash-es"
import { getTaskDetailApi } from "@/api/task/manager"
import type { TaskItem } from "@/api/task/manager/type"
import { listAllResourcesApi } from "@/api/task/resource"
import type { Parameter } from "@/api/task/resource/type"
import { useRunnerCallParameters } from "@/pages/task/shared/useRunnerCallParameters"

/** 加载任务最新详情，并按任务规则组装运行时可覆盖参数。 */
export const useTaskRunParameters = () => {
  const loading = ref(false)
  const task = ref<TaskItem | null>(null)
  const directParameters = ref<Parameter[]>([])
  const runnerTaskParams = ref<Record<string, string>>({})
  const runnerContext = useRunnerCallParameters(runnerTaskParams)
  let request = 0

  const defaultValues = computed<Record<string, string>>(() =>
    task.value?.runner_id
      ? runnerContext.inputs.value
      : (task.value?.grpc_config?.params ?? task.value?.http_config?.params ?? {})
  )

  const declaredParameters = computed(() =>
    task.value?.runner_id ? runnerContext.parameters.value : directParameters.value
  )

  const parameters = computed<Parameter[]>(() => {
    const rules = task.value?.param_override_rules ?? []
    const allowedKeys = new Set(rules.map((rule) => rule.param_key))
    const definitions = declaredParameters.value
      .filter((parameter) => parameter.runtime_overridable && allowedKeys.has(parameter.key))
      .map((parameter) => {
        const savedMode = task.value?.metadata?.[parameter.key]
        const bindingKey = savedMode && parameter.bindings[savedMode] ? savedMode : Object.keys(parameter.bindings)[0]
        return {
          ...parameter,
          default: defaultValues.value[parameter.key] ?? parameter.default ?? "",
          bindings: bindingKey ? { [bindingKey]: parameter.bindings[bindingKey] } : parameter.bindings
        }
      })

    return definitions
  })

  const load = async (taskId: number) => {
    const currentRequest = ++request
    loading.value = true
    directParameters.value = []
    runnerContext.clearContext()
    try {
      const { data } = await getTaskDetailApi(taskId)
      if (currentRequest !== request) return
      task.value = data

      if (data.runner_id) {
        runnerTaskParams.value = cloneDeep(data.grpc_config?.params) ?? {}
        await runnerContext.loadContext(data.runner_id)
        return
      }

      if (!data.grpc_config) return
      const resources = await listAllResourcesApi()
      if (currentRequest !== request) return
      directParameters.value =
        resources
          .find((resource) => resource.name === data.grpc_config?.service_name)
          ?.handlers.find((handler) => handler.name === data.grpc_config?.handler_name)?.metadata ?? []
    } finally {
      if (currentRequest === request) loading.value = false
    }
  }

  const clear = () => {
    request++
    loading.value = false
    task.value = null
    directParameters.value = []
    runnerTaskParams.value = {}
    runnerContext.clearContext()
  }

  return { loading, task, parameters, defaultValues, load, clear }
}
