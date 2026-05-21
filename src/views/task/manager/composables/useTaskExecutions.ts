import { ref, reactive } from "vue"
import { listExecutionsApi } from "@/api/etask/manager"
import type { TaskExecutionVO } from "@/api/etask/manager/type"
import { useTaskExecutionsSSE } from "@/sse/etask/manager"

/**
 * 任务执行历史数据流与状态托管 Composable
 * @description 抽离 TaskExecutionDialog 中的核心业务，托管分页、HTTP 数据拉取、以及基于 useTaskExecutionsSSE 的实时热更新流。
 * @param taskIdGetter 响应式获取当前 TaskID 的 getter 函数
 */
export function useTaskExecutions(taskIdGetter: () => number | null) {
  const execLoading = ref(false)
  const executions = ref<TaskExecutionVO[]>([])
  const currentExecution = ref<TaskExecutionVO | null>(null)

  const totalCount = ref(0)
  const pagination = reactive({
    page: 1,
    size: 10
  })

  // 1. 自动挂载特定任务的执行历史 SSE 实时推送流
  useTaskExecutionsSSE({
    taskId: taskIdGetter,
    enabled: () => !!taskIdGetter(), // 仅在 taskId 有效时开启连接
    onMessage: (event) => {
      const mappedVo: TaskExecutionVO = {
        id: event.id,
        task_id: event.task_id,
        task_name: event.task_name,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
        running_progress: event.running_progress,
        executor_node_id: event.executor_node_id,
        task_result: event.task_result,
        ctime: event.c_time
      }

      const existingIndex = executions.value.findIndex((e) => e.id === mappedVo.id)
      if (existingIndex !== -1) {
        // 已有批次状态/进度秒级热刷新
        executions.value[existingIndex] = mappedVo
      } else {
        // 新批次在第一页时，直接推入头部
        if (pagination.page === 1) {
          executions.value.unshift(mappedVo)
          if (executions.value.length > pagination.size) {
            executions.value.pop()
          }
        }
        totalCount.value++
      }

      // 如果当前正选中的实例发生变更，同步之以对齐日志状态
      if (currentExecution.value?.id === mappedVo.id) {
        currentExecution.value = mappedVo
      }
    }
  })

  /**
   * HTTP 接口获取执行历史列表
   */
  const fetchExecutionList = async (silent = false) => {
    const taskId = taskIdGetter()
    if (!taskId) return

    if (!silent) execLoading.value = true
    try {
      const res = await listExecutionsApi({
        task_id: taskId,
        offset: (pagination.page - 1) * pagination.size,
        limit: pagination.size
      })
      executions.value = res.data.executions
      totalCount.value = res.data.total

      // 如果当前选中的实例在刷新后的列表中，同步最新的状态
      if (currentExecution.value) {
        const updated = executions.value.find((e) => e.id === currentExecution.value?.id)
        if (updated) {
          currentExecution.value = updated
        }
      } else if (executions.value.length > 0) {
        handleSelectExecution(executions.value[0])
      }
    } finally {
      if (!silent) execLoading.value = false
    }
  }

  /**
   * 外部触发初次初始化数据
   */
  const initData = async () => {
    const taskId = taskIdGetter()
    if (!taskId) return
    pagination.page = 1
    currentExecution.value = null
    await fetchExecutionList()
  }

  /**
   * 翻页回调
   */
  const handlePageChange = async (page: number) => {
    pagination.page = page
    await fetchExecutionList()
  }

  /**
   * 切换选中执行记录
   */
  const handleSelectExecution = (item: TaskExecutionVO) => {
    currentExecution.value = item
  }

  /**
   * 计算运行时长（辅助渲染）
   */
  const calculateDuration = (start: number, end: number) => {
    if (!end || end <= 0) return "计算中..."
    const diff = (end - start) / 1000
    if (diff < 60) return `${diff.toFixed(1)}s`
    return `${(diff / 60).toFixed(1)}m`
  }

  /**
   * 弹窗关闭后清空状态，释放内存
   */
  const handleDialogClosed = () => {
    executions.value = []
    currentExecution.value = null
    totalCount.value = 0
  }

  return {
    execLoading,
    executions,
    currentExecution,
    totalCount,
    pagination,
    initData,
    handlePageChange,
    handleSelectExecution,
    calculateDuration,
    handleDialogClosed,
    fetchExecutionList
  }
}
