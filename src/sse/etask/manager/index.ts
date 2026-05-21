import { useSSE } from "@/common/utils/sse/useSSE"
import type { TaskStatusEvent, TaskLogEvent, TaskExecutionEvent } from "@/api/etask/manager"
import { API_SERVICE } from "@@/utils/service"
import { toValue, type MaybeRefOrGetter } from "vue"

/**
 * 订阅系统全局任务状态变更事件流的 SSE 接口
 * @param options 配置参数，包括回调、错误处理、是否启用等
 */
export function useTaskEventsSSE(options: {
  onMessage: (data: TaskStatusEvent) => void
  onError?: (err: unknown) => void
  enabled?: MaybeRefOrGetter<boolean>
}) {
  return useSSE<TaskStatusEvent>({
    path: `${API_SERVICE.TASK}/manager/task-events/stream`,
    eventName: "task_status_change",
    onMessage: options.onMessage,
    onError: options.onError,
    enabled: options.enabled
  })
}

/**
 * 订阅指定执行实例执行日志实时推送流的 SSE 接口
 * @param options 配置参数，包括实例 ID、回调、错误处理、是否启用等
 */
export function useExecutionLogsSSE(options: {
  executionId: MaybeRefOrGetter<number | undefined | null>
  onMessage: (data: TaskLogEvent) => void
  onError?: (err: unknown) => void
  enabled?: MaybeRefOrGetter<boolean>
}) {
  return useSSE<TaskLogEvent>({
    path: () => `${API_SERVICE.TASK}/manager/executions/${toValue(options.executionId)}/logs/stream`,
    eventName: "task_log",
    onMessage: options.onMessage,
    onError: options.onError,
    enabled: options.enabled
  })
}

/**
 * 订阅特定任务执行历史及进度推送流的 SSE 接口
 * @param options 配置参数，包括任务 ID、回调、错误处理、是否启用等
 */
export function useTaskExecutionsSSE(options: {
  taskId: MaybeRefOrGetter<number | undefined | null>
  onMessage: (data: TaskExecutionEvent) => void
  onError?: (err: unknown) => void
  enabled?: MaybeRefOrGetter<boolean>
}) {
  return useSSE<TaskExecutionEvent>({
    path: () => `${API_SERVICE.TASK}/manager/tasks/${toValue(options.taskId)}/executions/stream`,
    eventName: "task_execution",
    onMessage: options.onMessage,
    onError: options.onError,
    enabled: options.enabled
  })
}
