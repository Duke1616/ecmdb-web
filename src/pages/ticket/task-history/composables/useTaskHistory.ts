import { ref, watch } from "vue"
import { listTasksApi } from "@/api/ticket/task"
import { usePagination } from "@/common/composables/usePagination"
import type { AutomationTask } from "@/api/ticket/task/types/task"
import { useAutomationTaskPolling } from "./useAutomationTaskPolling"

export function useTaskHistory() {
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const tasksData = ref<AutomationTask[]>([])
  const loading = ref(false)

  /** 获取任务列表数据 */
  const fetchTasksData = async (silent = false) => {
    if (!silent) loading.value = true
    try {
      const { data } = await listTasksApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
        // 后续如果后端支持，可以加入搜索参数: keyword: searchQuery.value
      })
      paginationData.total = data.total
      tasksData.value = data.tasks
    } catch (error) {
      console.error("获取任务列表失败:", error)
      tasksData.value = []
    } finally {
      if (!silent) loading.value = false
      schedulePolling()
    }
  }

  const { schedule: schedulePolling } = useAutomationTaskPolling(
    () => tasksData.value,
    () => fetchTasksData(true)
  )

  // 分页变化时重新加载任务。
  watch(
    [() => paginationData.currentPage, () => paginationData.pageSize],
    () => {
      fetchTasksData()
    },
    { immediate: true }
  )

  return {
    tasksData,
    loading,
    paginationData,
    fetchTasksData,
    handleCurrentChange,
    handleSizeChange
  }
}
