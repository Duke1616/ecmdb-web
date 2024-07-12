import type * as task from "./types/task"
import instance from "@/utils/hy_service"

/** 创建工单任务 */
export function startTaskApi(data: task.startTaskReq) {
  return instance.post<number>({
    url: "task/start",
    data: data
  })
}
