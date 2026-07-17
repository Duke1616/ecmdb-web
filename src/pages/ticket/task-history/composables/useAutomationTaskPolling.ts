import { onBeforeUnmount } from "vue"
import { AutomationTaskStatus, type AutomationTask } from "@/api/ticket/task/types/task"

const pollingInterval = 3000

const needsRefresh = (task: AutomationTask) =>
  [
    AutomationTaskStatus.Waiting,
    AutomationTaskStatus.Submitting,
    AutomationTaskStatus.Running,
    AutomationTaskStatus.Failed
  ].includes(task.status)

/** 在任务仍可能发生状态迁移时轮询，全部稳定后自动停止。 */
export function useAutomationTaskPolling(tasks: () => AutomationTask[], refresh: () => Promise<void>) {
  let timer: number | undefined
  let refreshing = false

  const stop = () => {
    window.clearTimeout(timer)
    timer = undefined
  }

  const schedule = () => {
    stop()
    if (!tasks().some(needsRefresh)) return
    timer = window.setTimeout(async () => {
      if (refreshing) return
      refreshing = true
      try {
        await refresh()
      } catch (error) {
        console.error("刷新自动化任务状态失败:", error)
      } finally {
        refreshing = false
        schedule()
      }
    }, pollingInterval)
  }

  onBeforeUnmount(stop)
  return { schedule, stop }
}
