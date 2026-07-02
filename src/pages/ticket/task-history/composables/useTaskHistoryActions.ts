import { shallowRef, ref } from "vue"
import { ElMessage } from "element-plus"
import { retryTaskApi, updateTaskArgsApi, updateTaskVariablesApi, getTaskLogsApi } from "@/api/ticket/task/index.js"
import type { task } from "@/api/ticket/task/types/task"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { TaskHistoryAction, TaskResultDialogType } from "../types"
import type { JsonValue, TaskHistoryOperateItem, TaskResultDialogValue, TaskResultSavePayload } from "../types"

const toJsonValue = (value: unknown): JsonValue => {
  if (value === null) return null
  if (["string", "number", "boolean"].includes(typeof value)) return value as JsonValue
  if (Array.isArray(value)) return value.map((item) => toJsonValue(item))
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]))
  }
  return null
}

const parseTaskJson = (value: string): JsonValue => {
  if (!value) return {}

  try {
    return toJsonValue(JSON.parse(value))
  } catch {
    return value
  }
}

const isTaskHistoryAction = (value: string): value is TaskHistoryAction => {
  return Object.values(TaskHistoryAction).includes(value as TaskHistoryAction)
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "msg" in error) {
    return String((error as { msg?: unknown }).msg || fallback)
  }
  return fallback
}

export const taskHistoryOperateItems: TaskHistoryOperateItem[] = [
  {
    name: "输入",
    code: TaskHistoryAction.Input,
    icon: "Document",
    type: "info",
    capability: TICKET_CAPABILITIES.Task.View
  },
  {
    name: "输出",
    code: TaskHistoryAction.Output,
    icon: "Monitor",
    type: "success",
    capability: TICKET_CAPABILITIES.Task.Logs
  },
  {
    name: "参数",
    code: TaskHistoryAction.Args,
    icon: "Setting",
    type: "primary",
    capability: TICKET_CAPABILITIES.Task.UpdateArgs
  },
  {
    name: "变量",
    code: TaskHistoryAction.Variables,
    icon: "CollectionTag",
    type: "warning",
    capability: TICKET_CAPABILITIES.Task.UpdateVariables
  },
  {
    name: "重试",
    code: TaskHistoryAction.Retry,
    icon: "Refresh",
    type: "danger",
    capability: TICKET_CAPABILITIES.Task.Retry
  }
]

export const useTaskHistoryActions = (options: { refresh: () => void }) => {
  const taskId = ref(0)
  const result = shallowRef<JsonValue>("")
  const language = ref("")
  const resultVisible = ref(false)
  const currentDialogType = ref<TaskResultDialogValue>(TaskResultDialogType.Input)
  const retryDialogVisible = ref(false)
  const retryLoading = ref(false)

  const openResultDialog = (payload: { data: JsonValue; language: string; type: TaskResultDialogValue }) => {
    result.value = payload.data
    language.value = payload.language
    currentDialogType.value = payload.type
    resultVisible.value = true
  }

  const handleOperateEvent = async (data: task, code: string) => {
    if (!isTaskHistoryAction(code)) return

    taskId.value = data.id

    switch (code) {
      case TaskHistoryAction.Input:
        openResultDialog({
          data: data.code,
          language: data.language,
          type: TaskResultDialogType.Input
        })
        break
      case TaskHistoryAction.Output:
        try {
          const { data: logs } = await getTaskLogsApi(data.id)
          openResultDialog({
            data: logs,
            language: "text",
            type: TaskResultDialogType.Output
          })
        } catch {
          ElMessage.error("日志拉取失败")
        }
        break
      case TaskHistoryAction.Args:
        openResultDialog({
          data: parseTaskJson(data.args),
          language: "json",
          type: TaskResultDialogType.Args
        })
        break
      case TaskHistoryAction.Variables:
        openResultDialog({
          data: parseTaskJson(data.variables),
          language: "json",
          type: TaskResultDialogType.Variables
        })
        break
      case TaskHistoryAction.Retry:
        retryDialogVisible.value = true
        break
    }
  }

  const onResultDialogClosed = () => {
    result.value = ""
    language.value = ""
    resultVisible.value = false
    taskId.value = 0
  }

  const handleSaveResult = async (payload: TaskResultSavePayload) => {
    try {
      if (payload.type === TaskResultDialogType.Args) {
        await updateTaskArgsApi({ id: payload.taskId, args: payload.result })
      } else {
        await updateTaskVariablesApi({ id: payload.taskId, variables: JSON.stringify(payload.result) })
      }
      ElMessage.success("修改成功")
      options.refresh()
    } catch {
      ElMessage.error("保存失败")
    }
  }

  const handleRetryConfirm = async () => {
    retryLoading.value = true
    try {
      await retryTaskApi(taskId.value)
      ElMessage.success("重试已提交，请稍后查看结果")
      retryDialogVisible.value = false
      options.refresh()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, "重试任务失败"))
    } finally {
      retryLoading.value = false
    }
  }

  return {
    taskId,
    result,
    language,
    resultVisible,
    currentDialogType,
    retryDialogVisible,
    retryLoading,
    handleOperateEvent,
    onResultDialogClosed,
    handleSaveResult,
    handleRetryConfirm
  }
}
