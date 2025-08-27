import type * as task from "./types/task"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建工单任务 */
export function startTaskApi(data: task.startTaskReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/task/start`,
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksApi(data: task.page) {
  return instance.post<task.tasks>({
    url: `${API_SERVICE.CMDB}/task/list`,
    data: data
  })
}

/** 自动化任务列表 */
export function listTasksByInstanceIdApi(data: task.listByInstanceId) {
  return instance.post<task.tasks>({
    url: `${API_SERVICE.CMDB}/task/list/by_instance_id`,
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskArgsApi(data: task.args) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/task/update/args`,
    data: data
  })
}

/** 修改传入参数 */
export function updateTaskVariablesApi(data: task.varibales) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/task/update/variables`,
    data: data
  })
}

/** 修改传入参数 */
export function retryTaskApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/task/retry`,
    data: { id: id }
  })
}
