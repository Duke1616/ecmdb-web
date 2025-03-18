import type * as task from "./types/task"
import instance from "@/utils/hy_service"

/** 创建工单任务 */
export function startTaskApi(data: task.startTaskReq) {
  return instance.post<number>({
    url: "task/start",
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksApi(data: task.page) {
  return instance.post<task.tasks>({
    url: "task/list",
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksByInstanceIdApi(data: task.listByInstanceId) {
  return instance.post<task.tasks>({
    url: "task/list/by_instance_id",
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskArgsApi(data: task.args) {
  return instance.post<number>({
    url: "task/update/args",
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskVariablesApi(data: task.varibales) {
  return instance.post<number>({
    url: "task/update/variables",
    data: data
  })
}

/** 修改传入参数 */
export function retryTaskApi(id: number) {
  return instance.post<number>({
    url: "task/retry",
    data: { id: id }
  })
}
