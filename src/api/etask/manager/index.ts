import type * as task from "./type"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建任务 */
export function createTaskApi(data: task.CreateTaskReq) {
  return instance.post<string>({
    url: `${API_SERVICE.TASK}/manager/create`,
    data
  })
}

/** 修改任务 */
export function updateTaskApi(data: task.UpdateTaskReq) {
  return instance.post<void>({
    url: `${API_SERVICE.TASK}/manager/update`,
    data
  })
}

/** 获取任务列表 */
export function listTasksApi(data: task.PageQuery) {
  return instance.post<task.TaskPage>({
    url: `${API_SERVICE.TASK}/manager/list`,
    data
  })
}

/** 获取单条任务详情 */
export function getTaskDetailApi(taskId: number) {
  return instance.get<task.TaskItem>({
    url: `${API_SERVICE.TASK}/manager/detail/${taskId}`
  })
}

/** 获取任务日志 */
export function getTaskLogsApi(data: task.GetLogsReq) {
  return instance.post<string>({
    url: `${API_SERVICE.TASK}/manager/logs`,
    data
  })
}

/** 删除任务 */
export function deleteTaskApi(taskId: number) {
  return instance.delete<void>({
    url: `${API_SERVICE.TASK}/manager/delete/${taskId}`
  })
}

/** 立即运行一次任务 */
export function runTaskApi(taskId: number) {
  return instance.post<void>({
    url: `${API_SERVICE.TASK}/manager/run/${taskId}`
  })
}

/** 停止任务执行/禁用调度 */
export function stopTaskApi(taskId: number) {
  return instance.post<void>({
    url: `${API_SERVICE.TASK}/manager/stop/${taskId}`
  })
}
