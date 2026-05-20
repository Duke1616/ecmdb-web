import { reactive, computed, onMounted, onUnmounted } from "vue"
import { getTaskLogsApi } from "@/api/etask/manager"
import type { TaskExecutionVO } from "@/api/etask/manager/type"

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
 * @description 采用自适应 setTimeout 尾递归代替 setInterval，天生免疫请求重叠，彻底免除轮询锁；
 *              引入 Exponential Backoff（指数退避）智能渐进式轮询，在无日志产出时自动降低拉取频率，极大减轻服务器负担。
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

  // 2. 定时器句柄与退避延迟控制
  let timer: any = null
  const MIN_DELAY = 4000 // 初始极速轮询延迟（4 秒）
  const MAX_DELAY = 32000 // 最大退避轮询延迟（32 秒）
  let currentDelay = MIN_DELAY

  // 3. 计算当前实例状态
  const currentExecution = computed(() => execution())
  const isRunning = computed(() => ["RUNNING", "PREEMPTED"].includes(currentExecution.value?.status || ""))

  /**
   * 核心：增量抓取最新日志流
   * @param silent 是否静默拉取（静默拉取时不显示 UI Loading 动画）
   * @returns 本次拉取到的新日志条数
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

      // 只有当有新日志，或者 lastLogId 为 0（即首次加载）时才渲染数据
      if (newLogs.length > 0 || state.lastLogId === 0) {
        const contentBatch = newLogs.map((l) => l.content).join("\n")

        // 首次加载直接覆盖，后续增量追加
        state.fullLogs = state.lastLogId === 0 ? contentBatch : `${state.fullLogs}\n${contentBatch}`

        if (newLogs.length > 0) {
          state.lastLogId = Math.max(...newLogs.map((l) => l.id))
        }

        // 自动跟踪滚动
        if (state.autoRefresh && editorScrollCb) {
          editorScrollCb()
        }
      }

      state.lastRefreshTime = new Date().toLocaleTimeString()
      return newLogs.length
    } finally {
      if (!silent) state.loading = false
    }
  }

  /**
   * 强制重置状态并完整重新拉取
   */
  const resetAndFetch = () => {
    state.lastLogId = 0
    fetchLogs().then(() => {
      // 重置延迟，重新调度轮询
      currentDelay = MIN_DELAY
      startPolling()
    })
  }

  /**
   * 自适应 setTimeout 尾递归长轮询（支持 Exponential Backoff 指数退避）
   */
  const startPolling = () => {
    if (timer) clearTimeout(timer)

    const poll = async () => {
      // 退出边界判定：关闭自动刷新，或任务已被取消/已执行结束
      if (!state.autoRefresh || !isRunning.value) {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        return
      }

      try {
        const newLogCount = await fetchLogs(true)

        if (newLogCount > 0) {
          // 抓取到新日志：证明任务正活跃，重置为高频拉取，提供敏捷跟踪体验
          currentDelay = MIN_DELAY
        } else {
          // 未抓取到新日志：渐进式拉长拉取间隔，降低请求频次（4s -> 8s -> 16s -> 32s），为服务器解压
          currentDelay = Math.min(currentDelay * 2, MAX_DELAY)
        }
      } catch (err) {
        // 网络请求故障时，同样降级到最大间隔退避，防止疯狂重试
        currentDelay = MAX_DELAY
      } finally {
        // 自适应尾递归安排下一次轮询，彻底免疫请求重叠与网络堆积
        timer = setTimeout(poll, currentDelay)
      }
    }

    timer = setTimeout(poll, currentDelay)
  }

  /**
   * 显式处理自动跟踪开关状态变化
   */
  const handleAutoRefreshChange = () => {
    if (state.autoRefresh) {
      currentDelay = MIN_DELAY
      startPolling()
    } else {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }

  // 4. 利用挂载生命周期作为唯一副作用入口
  onMounted(() => {
    if (currentExecution.value?.id) {
      fetchLogs().then(() => {
        startPolling()
      })
    }
  })

  // 5. 销毁时彻底释放计时器句柄，安全防溢出
  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    state,
    isRunning,
    resetAndFetch,
    handleAutoRefreshChange
  }
}
