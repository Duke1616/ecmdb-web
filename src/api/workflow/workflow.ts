import type * as workflow from "./types/workflow"
import instance from "@/utils/hy_service"

/** 新增工作流程 */
export function createWorkflowApi(data: workflow.createWorkflowReq) {
  return instance.post<number>({
    url: "workflow/create",
    data: data
  })
}

/** 列表 */
export function listWorkflowApi(data: workflow.listWorkflowReq) {
  return instance.post<workflow.workflows>({
    url: "workflow/list",
    data: data
  })
}
