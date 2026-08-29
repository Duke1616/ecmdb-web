import { ref, computed } from "vue"
import { listTasksApi, deleteTaskApi, runTaskApi, stopTaskApi } from "@/api/task/manager"
import type { TaskItem, PageQuery } from "@/api/task/manager/type"
import { ElMessage } from "element-plus"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import type { TaskRunSubmitPayload } from "../components/TaskRunDialog.vue"

/** 任务列表、弹窗状态和任务操作的统一入口。 */
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
  const cloneTaskId = ref<number | null>(null)

  // 日志弹窗状态
  const logVisible = ref(false)
  const logTaskId = ref(0)
  const logTaskName = ref("")
  const runVisible = ref(false)
  const runTask = ref<TaskItem | null>(null)

  const resetFormTarget = () => {
    currentEditId.value = null
    cloneTaskId.value = null
  }

  const openForm = (target: { editId?: number; cloneId?: number } = {}) => {
    resetFormTarget()
    currentEditId.value = target.editId ?? null
    cloneTaskId.value = target.cloneId ?? null
    formVisible.value = true
  }

  const handleCreate = () => openForm()

  const handleEdit = (row: TaskItem) => openForm({ editId: row.id })

  const handleClone = (row: TaskItem) => openForm({ cloneId: row.id })

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
    resetFormTarget()
    loadData()
  }

  const handleLogs = (row: TaskItem) => {
    logTaskId.value = row.id
    logTaskName.value = row.name
    logVisible.value = true
  }

  const handleRunTask = (row: TaskItem) => {
    runTask.value = row
    runVisible.value = true
  }

  const submitRunTask = async (payload: TaskRunSubmitPayload) => {
    await runTaskApi(payload)
    if (payload.cron_expr) {
      ElMessage.success("任务触发时间已更新，等待调度器自动触发")
    } else {
      ElMessage.success("指令已下发: 立即执行一次")
    }

    runVisible.value = false
    loadData()
  }

  /** 通用调度指令执行 */
  const executeCommand = async (api: (id: number) => Promise<unknown>, id: number, msg: string) => {
    await api(id)
    ElMessage.success(msg)
    loadData()
  }

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
    cloneTaskId,
    logVisible,
    logTaskId,
    logTaskName,
    runVisible,
    runTask,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleClone,
    handleDelete,
    handleLogs,
    handleRunTask,
    submitRunTask,
    handleStopTask,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
