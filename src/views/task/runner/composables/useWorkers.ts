import { ref, computed } from "vue"
import { listAgentsApi } from "@/api/etask/agent"
import type { Agent } from "@/api/etask/agent/type"

/**
 * 获取工作节点列表
 * @param getTargetValue 获取当前选中的 target 值
 * @returns agents 列表、处理器列表及加载函数
 */
export function useWorkers(getTargetValue?: () => string | undefined) {
  const agents = ref<Agent[]>([])
  const loading = ref(false)

  const fetchWorkers = () => {
    loading.value = true
    listAgentsApi()
      .then(({ data }) => {
        agents.value = data || []
      })
      .catch(() => {
        agents.value = []
      })
      .finally(() => {
        loading.value = false
      })
  }

  /**
   * 当前选中的节点 (Topic) 所支持的处理器列表
   */
  const availableHandlers = computed(() => {
    if (!getTargetValue) return []
    const target = getTargetValue()
    if (!target) return []
    const agent = agents.value.find((a) => a.topic === target)
    return agent?.handlers || []
  })

  /**
   * 获取工作节点 label 展示文本
   * @param item 工作节点
   */
  const getWorkerLabel = (item: Agent) => {
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
