import { computed, onBeforeUnmount, ref } from "vue"
import { getTaskAttemptLogsApi, listTaskAttemptsApi } from "@/api/ticket/task"
import { AutomationAttemptStatus, type AutomationAttempt } from "@/api/ticket/task/types/task"

const refreshInterval = 2500
const logPageSize = 1000
const maxPagesPerSync = 10

export function useTaskAttemptConsole(taskId: () => number) {
  const attempts = ref<AutomationAttempt[]>([])
  const currentAttempt = ref<AutomationAttempt | null>(null)
  const loading = ref(false)
  const logLoading = ref(false)
  const logs = ref("")
  const lastLogId = ref(0)
  const lastSyncTime = ref("")
  const autoRefresh = ref(true)
  let timer: number | undefined
  let polling = false
  let logsPending = false

  const isRunning = computed(() => {
    const status = currentAttempt.value?.status
    return status === AutomationAttemptStatus.Submitting || status === AutomationAttemptStatus.Running
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

  const fetchLogs = async (reset = false) => {
    const attempt = currentAttempt.value
    if (!attempt?.execution_id) return
    if (reset) {
      logs.value = ""
      lastLogId.value = 0
      logsPending = false
    }
    if (!logs.value) logLoading.value = true
    try {
      for (let page = 0; page < maxPagesPerSync; page += 1) {
        const { data } = await getTaskAttemptLogsApi(attempt.id, lastLogId.value, logPageSize)
        const newLogs = data.logs || []
        if (newLogs.length > 0) {
          const content = newLogs.map((item) => item.content).join("\n")
          logs.value = logs.value ? `${logs.value}\n${content}` : content
          lastLogId.value = Math.max(lastLogId.value, data.max_id, ...newLogs.map((item) => item.id))
        }
        logsPending = newLogs.length === logPageSize
        if (!logsPending) break
      }
      lastSyncTime.value = new Date().toLocaleTimeString()
    } finally {
      logLoading.value = false
    }
  }

  const selectAttempt = async (attempt: AutomationAttempt) => {
    if (currentAttempt.value?.id === attempt.id) return
    currentAttempt.value = attempt
    logs.value = ""
    lastLogId.value = 0
    lastSyncTime.value = ""
    logsPending = false
    await fetchLogs()
  }

  const refresh = async () => {
    await loadAttempts(true)
    await fetchLogs(true)
  }

  const startPolling = () => {
    window.clearInterval(timer)
    timer = window.setInterval(async () => {
      if (!autoRefresh.value || polling) return
      polling = true
      try {
        const wasRunning = isRunning.value
        await loadAttempts(true)
        // 状态刚进入终态时再拉取一次，避免遗漏结束前的最后一批日志。
        if (wasRunning || isRunning.value || logsPending) await fetchLogs()
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
    await fetchLogs(true)
    startPolling()
  }

  const reset = () => {
    window.clearInterval(timer)
    timer = undefined
    polling = false
    attempts.value = []
    currentAttempt.value = null
    logs.value = ""
    lastLogId.value = 0
    lastSyncTime.value = ""
    logsPending = false
  }

  onBeforeUnmount(reset)

  return {
    attempts,
    currentAttempt,
    loading,
    logLoading,
    logs,
    lastSyncTime,
    autoRefresh,
    isRunning,
    initData,
    selectAttempt,
    refresh,
    reset
  }
}
