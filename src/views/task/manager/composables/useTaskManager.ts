import { ref, reactive } from "vue"
import {
  listTasksApi,
  createTaskApi,
  deleteTaskApi,
  getTaskDetailApi,
  updateTaskApi,
  runTaskApi,
  stopTaskApi
} from "@/api/etask/manager"
import { TaskStatus, type TaskItem, type CreateTaskReq, type UpdateTaskReq } from "@/api/etask/manager/type"
import { ElMessage, ElMessageBox } from "element-plus"

export function useTaskManager() {
  const loading = ref(false)
  const tasksData = ref<TaskItem[]>([])
  const searchQuery = ref("")
  const paginationData = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    layout: "total, sizes, prev, pager, next, jumper"
  })

  // 统计信息
  const stats = reactive({
    total: 0,
    recurring: 0,
    oneTime: 0,
    enabled: 0
  })

  const updateStats = () => {
    stats.total = paginationData.total
    const list = tasksData.value || []
    stats.recurring = list.filter((t) => t.type === "RECURRING").length
    stats.oneTime = list.filter((t) => t.type === "ONE_TIME").length
    stats.enabled = list.filter((t) => t.status === TaskStatus.ACTIVE).length
  }

  const fetchTasksData = async () => {
    loading.value = true
    try {
      const res = await listTasksApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize,
        query: searchQuery.value
      })
      tasksData.value = res.data.tasks
      paginationData.total = res.data.total
      updateStats()
    } catch (error) {
      console.error("Fetch tasks failed:", error)
      ElMessage.error("获取任务列表失败")
    } finally {
      loading.value = false
    }
  }

  const handleCreateTask = async (data: CreateTaskReq) => {
    try {
      await createTaskApi(data)
      ElMessage.success("创建任务成功")
      fetchTasksData()
      return true
    } catch (error) {
      ElMessage.error("创建任务失败")
      return false
    }
  }

  const handleUpdateTask = async (data: UpdateTaskReq) => {
    try {
      await updateTaskApi(data)
      ElMessage.success("更新任务成功")
      fetchTasksData()
      return true
    } catch (error) {
      ElMessage.error("更新任务失败")
      return false
    }
  }

  const fetchTaskDetail = async (id: string) => {
    loading.value = true
    try {
      const res = await getTaskDetailApi(id)
      return res.data
    } catch (error) {
      ElMessage.error("获取任务详情失败")
      return null
    } finally {
      loading.value = false
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await ElMessageBox.confirm("确定要删除该任务吗？", "警告", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
      await deleteTaskApi(id)
      ElMessage.success("删除成功")
      fetchTasksData()
    } catch (error) {
      console.error("删除失败:", error)
    }
  }

  const handleRunTask = async (id: string) => {
    try {
      await runTaskApi(id)
      ElMessage.success("指令已下发: 立即执行一次")
      fetchTasksData()
    } catch (error) {
      ElMessage.error("下发执行指令失败")
    }
  }

  const handleStopTask = async (id: string) => {
    try {
      await stopTaskApi(id)
      ElMessage.success("指令已下发: 强制停止/禁用成功")
      fetchTasksData()
    } catch (error) {
      ElMessage.error("停止任务失败")
    }
  }

  const handleCurrentChange = (val: number) => {
    paginationData.currentPage = val
    fetchTasksData()
  }

  const handleSizeChange = (val: number) => {
    paginationData.pageSize = val
    fetchTasksData()
  }

  return {
    loading,
    tasksData,
    searchQuery,
    paginationData,
    stats,
    fetchTasksData,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    fetchTaskDetail,
    handleRunTask,
    handleStopTask,
    handleCurrentChange,
    handleSizeChange
  }
}
