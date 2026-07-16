import { ref, computed } from "vue"
import { listAllResourcesApi } from "@/api/task/resource"
import { ResourceKind, type Executor } from "@/api/task/resource/type"

/**
 * 获取分布式执行器列表，并处理 handler 级联联动逻辑
 * @param getTargetValue 获取当前选中 target 的函数（响应式对接）
 */
export function useExecutors(getTargetValue: () => string | undefined) {
  const executors = ref<Executor[]>([])
  const loading = ref(false)

  const fetchExecutors = () => {
    loading.value = true
    listAllResourcesApi({ kind: ResourceKind.Executor })
      .then((data) => {
        executors.value = data.map((resource) => ({
          name: resource.name,
          desc: resource.desc,
          handlers: resource.handlers,
          nodes: resource.nodes,
          dispatch_mode: resource.dispatch_mode
        }))
      })
      .catch(() => {
        executors.value = []
      })
      .finally(() => {
        loading.value = false
      })
  }

  /** 当前选中执行器对应的 handler 列表，随 target 动态更新 */
  const availableHandlers = computed(() => {
    const target = getTargetValue()
    if (!target) return []
    const matched = executors.value.find((e) => e.name === target)
    return matched?.handlers || []
  })

  return {
    executors,
    loading,
    fetchExecutors,
    availableHandlers
  }
}
