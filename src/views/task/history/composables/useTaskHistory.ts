import { ref, watch } from "vue"
import { listTasksApi } from "@/api/ticket/task"
import { usePagination } from "@/common/composables/usePagination"
import type { task } from "@/api/ticket/task/types/task"

export function useTaskHistory() {
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const tasksData = ref<task[]>([])
  const loading = ref(false)

  // 搜索参数
  const searchQuery = ref("")

  /** 获取任务列表数据 */
  const fetchTasksData = async () => {
    loading.value = true
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
      loading.value = false
    }
  }

  // 监听分页和搜索参数变化
  watch(
    [() => paginationData.currentPage, () => paginationData.pageSize, searchQuery],
    () => {
      fetchTasksData()
    },
    { immediate: true }
  )

  return {
    tasksData,
    loading,
    searchQuery,
    paginationData,
    fetchTasksData,
    handleCurrentChange,
    handleSizeChange
  }
}
