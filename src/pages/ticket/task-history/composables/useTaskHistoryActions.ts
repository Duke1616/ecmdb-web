import { ref } from "vue"
import { ElMessage } from "element-plus"
import { retryTaskApi } from "@/api/ticket/task"
import type { AutomationTask } from "@/api/ticket/task/types/task"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TaskHistoryAction, type TaskHistoryOperateItem } from "../types"

export const taskHistoryOperateItems: TaskHistoryOperateItem[] = [
  {
    name: "执行详情",
    code: TaskHistoryAction.Attempts,
    icon: "Document",
    type: "primary",
    capability: TICKET_CAPABILITIES.Task.View
  },
  {
    name: "重试",
    code: TaskHistoryAction.Retry,
    icon: "Refresh",
    type: "warning",
    capability: TICKET_CAPABILITIES.Task.Retry
  }
]

export const useTaskHistoryActions = (options: { refresh: () => void }) => {
  const taskId = ref(0)
  const attemptDialogVisible = ref(false)
  const retryDialogVisible = ref(false)
  const retryLoading = ref(false)

  const handleOperateEvent = (task: AutomationTask, code: string) => {
    taskId.value = task.id
    if (code === TaskHistoryAction.Attempts) attemptDialogVisible.value = true
    if (code === TaskHistoryAction.Retry) retryDialogVisible.value = true
  }

  const handleRetryConfirm = async () => {
    retryLoading.value = true
    try {
      await retryTaskApi(taskId.value)
      ElMessage.success("新的执行尝试已创建")
      retryDialogVisible.value = false
      options.refresh()
    } catch {
      ElMessage.error("重试任务失败")
    } finally {
      retryLoading.value = false
    }
  }

  return {
    taskId,
    attemptDialogVisible,
    retryDialogVisible,
    retryLoading,
    handleOperateEvent,
    handleRetryConfirm
  }
}
