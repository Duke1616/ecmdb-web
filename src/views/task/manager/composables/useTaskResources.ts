import { ref } from "vue"
import { listExecutorsApi } from "@/api/etask/executor"
import type { Executor, HandlerDetail } from "@/api/etask/executor/type"

/**
 * 任务资源管理 Composable
 * 负责执行器列表同步与智能过滤建议
 */
export function useTaskResources() {
  const loading = ref(false)
  const executorList = ref<Executor[]>([])

  /**
   * 同步外部资源数据
   */
  const fetchResources = async () => {
    loading.value = true
    try {
      const res = await listExecutorsApi()
      executorList.value = res.data || []
    } catch (e) {
      console.error("[TaskManager] Sync context failed", e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 服务选择建议过滤
   */
  const queryServiceSuggestions = (queryString: string, cb: (results: (Executor & { value: string })[]) => void) => {
    const res = queryString
      ? executorList.value.filter((ex) => ex.name.toLowerCase().includes(queryString.toLowerCase()))
      : executorList.value
    cb(res.map((ex) => ({ value: ex.name, ...ex })))
  }

  /**
   * Handler 处理方法建议过滤
   */
  const queryHandlerSuggestions = (
    serviceName: string,
    queryString: string,
    cb: (results: (HandlerDetail & { value: string; label: string })[]) => void
  ) => {
    const ex = executorList.value.find((e) => e.name === serviceName)
    const handlers: HandlerDetail[] = ex?.handlers || []
    const res = queryString
      ? handlers.filter((h) => h.name.toLowerCase().includes(queryString.toLowerCase()))
      : handlers
    cb(res.map((h) => ({ value: h.name, label: h.name, ...h })))
  }

  return {
    loading,
    executorList,
    fetchResources,
    queryServiceSuggestions,
    queryHandlerSuggestions
  }
}
