import type * as workflow from "./types/workflow"
import instance from "@/utils/hy_service"

/** 新增工作流程 */
export function createTemplateApi(data: workflow.createWorkflowReq) {
  return instance.post<number>({
    url: "workflow/create",
    data: data
  })
}
