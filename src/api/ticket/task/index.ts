import type * as task from "./types/task"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建工单任务 */
export function startTaskApi(data: task.startTaskReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/task/start`,
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksApi(data: task.page) {
  return instance.post<task.tasks>({
    url: `${API_SERVICE.TICKET}/task/list`,
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksByInstanceIdApi(data: task.listByInstanceId) {
  return instance.post<task.tasks>({
    url: `${API_SERVICE.TICKET}/task/list/by_instance_id`,
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskArgsApi(data: task.args) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/task/update/args`,
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskVariablesApi(data: task.varibales) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/task/update/variables`,
    data: data
  })
}

/** 修改传入参数 */
export function retryTaskApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/task/retry`,
    data: { id: id }
  })
}

/** 获取任务日志 */
export function getTaskLogsApi(taskId: number) {
  return instance.get<string>({
    url: `${API_SERVICE.TICKET}/task/logs/${taskId}`
  })
}
