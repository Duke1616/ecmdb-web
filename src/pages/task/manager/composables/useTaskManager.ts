import { ref, computed } from "vue"
import { listTasksApi, deleteTaskApi, runTaskApi, stopTaskApi } from "@/api/task/manager"
import type { TaskItem, PageQuery } from "@/api/task/manager/type"
import { ElMessage } from "element-plus"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

/**
 * 任务管理核心逻辑 Hook
 * @description 对齐 useRoleList / usePolicyList 标准范式
 */
export function useTaskManager() {
  // 通用列表管理器
  const {
    list: tasksData,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<TaskItem, PageQuery>({
    fetchApi: listTasksApi,
    listKey: "tasks",
    initialQuery: { query: "", offset: 0, limit: 20 }
  })

  // 交互动作管理器
  const { handleConfirmAction } = useGovernanceActions()

  // 表单弹窗状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  // 日志弹窗状态
  const logVisible = ref(false)
  const logTaskId = ref(0)
  const logTaskName = ref("")

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: TaskItem) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = (row: TaskItem) => {
    handleConfirmAction({
      message: `确定要永久删除任务 "${row.name}" 吗？此操作不可逆。`,
      api: () => deleteTaskApi(row.id),
      onSuccess: loadData,
      successMsg: "任务已成功删除"
    })
  }

  const handleFormSuccess = () => {
    formVisible.value = false
    loadData()
  }

  const handleLogs = (row: TaskItem) => {
    logTaskId.value = row.id
    logTaskName.value = row.name
    logVisible.value = true
  }

  /** 通用调度指令执行 */
  const executeCommand = async (api: (id: number) => Promise<unknown>, id: number, msg: string) => {
    await api(id)
    ElMessage.success(msg)
    loadData()
  }

  const handleRunTask = (id: number) => executeCommand(runTaskApi, id, "指令已下发: 立即执行一次")
  const handleStopTask = (id: number) => executeCommand(stopTaskApi, id, "指令已下发: 强制停止/禁用成功")

  return {
    tasksData,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    loading,
    query,
    formVisible,
    currentEditId,
    logVisible,
    logTaskId,
    logTaskName,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleLogs,
    handleRunTask,
    handleStopTask,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
