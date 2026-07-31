import { computed, ref, watch } from "vue"
import { getTaskLogsApi } from "@/api/task/manager"
import type { TaskExecutionVO } from "@/api/task/manager/type"
import { useExecutionLogStream } from "@/common/composables/useExecutionLogStream"

/** 管理端执行日志控制台，页面只保留展示偏好和结果弹窗状态。 */
export function useLogConsoleStream(execution: () => TaskExecutionVO | null, editorScrollCb?: () => void) {
  const currentExecution = computed(() => execution())
  const isRunning = computed(() => ["RUNNING", "PREEMPTED"].includes(currentExecution.value?.status || ""))
  const autoRefresh = ref(true)
  const viewResultVisible = ref(false)

  const logStream = useExecutionLogStream({
    executionId: () => currentExecution.value?.id,
    live: () => autoRefresh.value && isRunning.value,
    fetchPage: async ({ executionId, cursor, limit }) => {
      const { data } = await getTaskLogsApi({ execution_id: executionId, min_id: cursor, limit })
      return { logs: data.logs || [] }
    },
    onUpdated: () => {
      if (autoRefresh.value) editorScrollCb?.()
    }
  })

  watch(
    () => currentExecution.value?.id,
    (executionId) => {
      if (executionId) void logStream.sync()
    },
    { immediate: true }
  )

  const resetAndFetch = () => {
    logStream.reset()
    return logStream.sync()
  }

  return {
    fullLogs: logStream.content,
    loading: logStream.loading,
    lastRefreshTime: logStream.lastSyncTime,
    autoRefresh,
    viewResultVisible,
    isRunning,
    resetAndFetch
  }
}
