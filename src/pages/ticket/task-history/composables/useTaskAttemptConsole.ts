import { computed, onBeforeUnmount, ref } from "vue"
import { getTaskAttemptLogsApi, listTaskAttemptsApi } from "@/api/ticket/task"
import { AutomationAttemptStatus, type AutomationAttempt } from "@/api/ticket/task/types/task"
import { useExecutionLogStream } from "@/common/composables/useExecutionLogStream"

const refreshInterval = 2500
const logReconcileInterval = 10_000

export function useTaskAttemptConsole(taskId: () => number) {
  const attempts = ref<AutomationAttempt[]>([])
  const currentAttempt = ref<AutomationAttempt | null>(null)
  const loading = ref(false)
  const autoRefresh = ref(true)
  let timer: number | undefined
  let polling = false

  const isRunning = computed(() => {
    const status = currentAttempt.value?.status
    return status === AutomationAttemptStatus.Submitting || status === AutomationAttemptStatus.Running
  })

  const logStream = useExecutionLogStream({
    executionId: () => currentAttempt.value?.execution_id,
    live: () => autoRefresh.value && isRunning.value,
    fetchPage: async ({ executionId, cursor, limit }) => {
      const attempt = currentAttempt.value
      if (!attempt || attempt.execution_id !== executionId) return { logs: [] }
      const { data } = await getTaskAttemptLogsApi(attempt.id, cursor, limit)
      return { logs: data.logs || [], maxId: data.max_id }
    }
  })

  const loadAttempts = async (silent = false) => {
    const id = taskId()
    if (!id) return
    if (!silent) loading.value = true
    try {
      const { data } = await listTaskAttemptsApi(id)
      attempts.value = data.attempts || []
      const selectedID = currentAttempt.value?.id
      currentAttempt.value = attempts.value.find((item) => item.id === selectedID) || attempts.value[0] || null
    } finally {
      if (!silent) loading.value = false
    }
  }

  const selectAttempt = async (attempt: AutomationAttempt) => {
    if (currentAttempt.value?.id === attempt.id) return
    currentAttempt.value = attempt
    await logStream.sync()
  }

  const refresh = async () => {
    await loadAttempts(true)
    await logStream.sync()
  }

  const startPolling = () => {
    window.clearInterval(timer)
    timer = window.setInterval(async () => {
      if (!autoRefresh.value || polling) return
      polling = true
      try {
        const wasRunning = isRunning.value
        await loadAttempts(true)
        const reachedTerminal = wasRunning && !isRunning.value
        const needsReconcile = Date.now() - logStream.lastFetchedAt.value >= logReconcileInterval
        if (reachedTerminal || logStream.hasMore.value || (isRunning.value && needsReconcile)) {
          await logStream.sync(true)
        }
      } catch (error) {
        console.error("同步自动化执行记录失败:", error)
      } finally {
        polling = false
      }
    }, refreshInterval)
  }

  const initData = async () => {
    currentAttempt.value = null
    await loadAttempts()
    await logStream.sync()
    startPolling()
  }

  const reset = () => {
    window.clearInterval(timer)
    timer = undefined
    polling = false
    attempts.value = []
    currentAttempt.value = null
    logStream.reset()
  }

  onBeforeUnmount(reset)

  return {
    attempts,
    currentAttempt,
    loading,
    logLoading: logStream.loading,
    logs: logStream.content,
    lastSyncTime: logStream.lastSyncTime,
    autoRefresh,
    isRunning,
    initData,
    selectAttempt,
    refresh,
    reset
  }
}
