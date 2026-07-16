import { ref, computed } from "vue"
import { listAllResourcesApi } from "@/api/task/resource"
import { ResourceKind, type Resource } from "@/api/task/resource/type"

/**
 * 获取工作节点列表
 * @param getTargetValue 获取当前选中的 target 值
 * @returns agents 列表、处理器列表及加载函数
 */
export function useWorkers(getTargetValue?: () => string | undefined) {
  const agents = ref<Resource[]>([])
  const loading = ref(false)

  const fetchWorkers = () => {
    loading.value = true
    listAllResourcesApi({ kind: ResourceKind.Agent })
      .then((data) => {
        agents.value = data
      })
      .catch(() => {
        agents.value = []
      })
      .finally(() => {
        loading.value = false
      })
  }

  /** 当前选中资源池所支持的处理器列表。 */
  const availableHandlers = computed(() => {
    if (!getTargetValue) return []
    const target = getTargetValue()
    if (!target) return []
    const agent = agents.value.find((a) => a.name === target)
    return agent?.handlers || []
  })

  /**
   * 获取工作节点 label 展示文本
   * @param item 工作节点
   */
  const getWorkerLabel = (item: Resource) => {
    return `${item.name} -【 topic: ${item.topic} 】`
  }

  return {
    workers: agents,
    loading,
    fetchWorkers,
    getWorkerLabel,
    availableHandlers
  }
}
