import { ref } from "vue"
import { ElMessage } from "element-plus"
import { retryTaskApi, terminateTaskApi } from "@/api/ticket/task"
import { AutomationTaskStatus, type AutomationTask } from "@/api/ticket/task/types/task"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TaskHistoryAction, type TaskHistoryOperateItem } from "../types"

export const taskHistoryOperateItems: TaskHistoryOperateItem[] = [
  {
    name: "执行详情",
    code: TaskHistoryAction.Attempts,
    icon: "Document",
    type: "primary",
    capability: TICKET_CAPABILITIES.Task.ViewAttempts
  },
  {
    name: "重试",
    code: TaskHistoryAction.Retry,
    icon: "Refresh",
    type: "warning",
    capability: TICKET_CAPABILITIES.Task.Retry
  },
  {
    name: "强制终止",
    code: TaskHistoryAction.Terminate,
    type: "danger",
    capability: TICKET_CAPABILITIES.Task.Terminate
  }
]

const retryableStatuses: ReadonlySet<AutomationTaskStatus> = new Set([
  AutomationTaskStatus.Failed,
  AutomationTaskStatus.Blocked,
  AutomationTaskStatus.Cancelled
])
const terminableStatuses: ReadonlySet<AutomationTaskStatus> = new Set([
  AutomationTaskStatus.Failed,
  AutomationTaskStatus.Running,
  AutomationTaskStatus.Waiting,
  AutomationTaskStatus.Blocked,
  AutomationTaskStatus.Submitting
])

export const canRetryTask = (task: Pick<AutomationTask, "status">) => retryableStatuses.has(task.status)
export const canTerminateTask = (task: Pick<AutomationTask, "status" | "is_compensation">) =>
  !task.is_compensation && terminableStatuses.has(task.status)

export const useTaskHistoryActions = (options: { refresh: () => void | Promise<void> }) => {
  const taskId = ref(0)
  const attemptDialogVisible = ref(false)
  const retryDialogVisible = ref(false)
  const retryLoading = ref(false)
  const terminateDialogVisible = ref(false)
  const terminateLoading = ref(false)

  const handleOperateEvent = (task: AutomationTask, code: string) => {
    taskId.value = task.id
    if (code === TaskHistoryAction.Attempts) attemptDialogVisible.value = true
    if (code === TaskHistoryAction.Retry && canRetryTask(task)) retryDialogVisible.value = true
    if (code === TaskHistoryAction.Terminate && canTerminateTask(task)) terminateDialogVisible.value = true
  }

  const handleRetryConfirm = async () => {
    retryLoading.value = true
    try {
      await retryTaskApi(taskId.value)
      ElMessage.success("新的执行尝试已创建")
      retryDialogVisible.value = false
      await options.refresh()
    } catch {
      ElMessage.error("重试任务失败")
    } finally {
      retryLoading.value = false
    }
  }

  const handleTerminateConfirm = async (reason: string) => {
    const normalizedReason = reason.trim()
    if (!normalizedReason || terminateLoading.value) return
    terminateLoading.value = true
    try {
      await terminateTaskApi(taskId.value, normalizedReason)
      ElMessage.success("任务已终止")
      terminateDialogVisible.value = false
      await options.refresh()
    } catch {
      ElMessage.error("终止任务失败")
    } finally {
      terminateLoading.value = false
    }
  }

  return {
    taskId,
    attemptDialogVisible,
    retryDialogVisible,
    retryLoading,
    terminateDialogVisible,
    terminateLoading,
    handleOperateEvent,
    handleRetryConfirm,
    handleTerminateConfirm
  }
}
