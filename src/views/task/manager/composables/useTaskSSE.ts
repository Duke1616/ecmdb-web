import { useTaskEventsSSE } from "@/sse/etask/manager"
import { type TaskStatusEvent } from "@/api/etask/manager"
export type { TaskStatusEvent }

/**
 * 调度任务实时状态 SSE 监听 Hook
 * @description 代理调用统一封装的 useTaskEventsSSE，监听后端推送的任务状态变更事件。
 * @param onStatusChange 状态变更时的回调函数
 */
export function useTaskSSE(onStatusChange: (event: TaskStatusEvent) => void) {
  useTaskEventsSSE({
    onMessage: onStatusChange
  })
}
