import { reactive, computed, onMounted } from "vue"
import { getTaskLogsApi } from "@/api/etask/manager"
import type { TaskExecutionVO } from "@/api/etask/manager/type"
import { useExecutionLogsSSE } from "@/sse/etask/manager"

/**
 * 日志流核心业务状态定义
 */
interface LogConsoleState {
  loading: boolean
  fullLogs: string
  lastLogId: number
  lastRefreshTime: string
  autoRefresh: boolean
  viewResultVisible: boolean
}

/**
 * 任务执行控制台日志流 Composable
 * @description 采用基于通用 useExecutionLogsSSE 的实时流式推送：
 *              - 初始化时通过 HTTP 接口一次性同步拉取当前所有已产生的历史日志。
 *              - 若任务正处于运行中，开启并跟随 SSE 实时接收最新日志。
 *              - 引入事件 ID 幂等性校验过滤竞态，并将日志增量追加、滚动跟踪与刷新时间更新收拢于内联 appendLogs 模块。
 * @param execution 响应式的当前执行实例对象
 * @param editorScrollCb 滚动回调，用于实现自动跟踪滚动
 */
export function useLogConsoleStream(execution: () => TaskExecutionVO | null, editorScrollCb?: () => void) {
  // 1. 聚拢响应式状态机
  const state = reactive<LogConsoleState>({
    loading: false,
    fullLogs: "",
    lastLogId: 0,
    lastRefreshTime: "",
    autoRefresh: true,
    viewResultVisible: false
  })

  // 2. 响应式计算属性
  const currentExecution = computed(() => execution())
  const isRunning = computed(() => ["RUNNING", "PREEMPTED"].includes(currentExecution.value?.status || ""))

  /**
   * 统一增量追加日志，并执行自动滚动和最后更新时间记录
   */
  const appendLogs = (newLogsText: string, isOverwrite = false) => {
    if (!newLogsText) return
    state.fullLogs = isOverwrite ? newLogsText : `${state.fullLogs}\n${newLogsText}`
    state.lastRefreshTime = new Date().toLocaleTimeString()

    // 自动跟踪滚动
    if (state.autoRefresh && editorScrollCb) {
      editorScrollCb()
    }
  }

  /**
   * 核心：一次性同步拉取历史日志
   */
  const fetchLogs = async (silent = false): Promise<number> => {
    const execId = currentExecution.value?.id
    if (!execId) return 0

    if (!silent) state.loading = true
    try {
      const res = await getTaskLogsApi({
        execution_id: execId,
        min_id: state.lastLogId,
        limit: 1000
      })

      const newLogs = res.data.logs || []
      if (newLogs.length > 0) {
        const contentBatch = newLogs.map((l) => l.content).join("\n")
        appendLogs(contentBatch, state.lastLogId === 0)
        state.lastLogId = Math.max(...newLogs.map((l) => l.id))
      }

      return newLogs.length
    } finally {
      if (!silent) state.loading = false
    }
  }

  /**
   * 强制重置状态并完整重新拉取
   */
  const resetAndFetch = () => {
    state.fullLogs = ""
    state.lastLogId = 0
    fetchLogs()
  }

  // 3. 实时建立 SSE 连接（仅在任务运行中时激活，组件销毁或切换实例时通过 abort 精准释放连接）
  useExecutionLogsSSE({
    executionId: () => currentExecution.value?.id,
    enabled: isRunning, // 响应式启用：当状态为非运行中时，SSE 自动断连
    onMessage: (event) => {
      // 幂等性防护：只消费 ID 大于我们本地记录的日志，防范 HTTP 与 SSE 的竞态重叠加载
      if (event.id > state.lastLogId) {
        appendLogs(event.content, state.lastLogId === 0)
        state.lastLogId = event.id
      }
    }
  })

  // 4. 组件挂载时先拉取历史日志
  onMounted(() => {
    if (currentExecution.value?.id) {
      fetchLogs()
    }
  })

  return {
    state,
    isRunning,
    resetAndFetch
  }
}
