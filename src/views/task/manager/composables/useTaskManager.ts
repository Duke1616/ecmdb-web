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
import { type TaskItem, type CreateTaskReq, type UpdateTaskReq } from "@/api/etask/manager/type"
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
    } catch (error) {
      console.error("Fetch tasks failed:", error)
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
      return false
    }
  }

  const fetchTaskDetail = async (id: number) => {
    loading.value = true
    try {
      const res = await getTaskDetailApi(id)
      return res.data
    } catch (error) {
      return null
    } finally {
      loading.value = false
    }
  }

  const handleDeleteTask = async (id: number) => {
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

  const handleRunTask = async (id: number) => {
    try {
      await runTaskApi(id)
      ElMessage.success("指令已下发: 立即执行一次")
      fetchTasksData()
    } catch (error) {
      // 错误已由请求层统一处理
    }
  }

  const handleStopTask = async (id: number) => {
    try {
      await stopTaskApi(id)
      ElMessage.success("指令已下发: 强制停止/禁用成功")
      fetchTasksData()
    } catch (error) {
      // 错误已由请求层统一处理
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
