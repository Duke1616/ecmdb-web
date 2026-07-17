import type * as task from "./types/task"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

const TASK_API = `${API_SERVICE.TICKET}/task`

export function listTasksApi(data: task.Page) {
  return instance.post<task.TasksResp>({ url: `${TASK_API}/list`, data })
}

export function listTasksByInstanceIdApi(data: task.ListByInstanceIDReq) {
  return instance.post<task.TasksResp>({ url: `${TASK_API}/list/by_instance_id`, data })
}

export function retryTaskApi(id: number) {
  return instance.post<void>({ url: `${TASK_API}/retry`, data: { id } })
}

export function listTaskAttemptsApi(taskId: number) {
  return instance.post<task.ListAttemptsResp>({ url: `${TASK_API}/attempt/list`, data: { task_id: taskId } })
}

export function getTaskAttemptLogsApi(attemptId: number, minId = 0, limit = 1000) {
  return instance.post<task.LogsResp>({
    url: `${TASK_API}/attempt/logs`,
    data: { attempt_id: attemptId, min_id: minId, limit }
  })
}
