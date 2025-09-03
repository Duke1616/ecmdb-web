import type * as workflow from "./types/workflow"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增工作流程 */
export function createWorkflowApi(data: workflow.createOrUpdateWorkflowReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/workflow/create`,
    data: data
  })
}

/** 修改工作流程 */
export function updateWorkflowApi(data: workflow.createOrUpdateWorkflowReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/workflow/update`,
    data: data
  })
}

/** 删除工作流程 */
export function deleteWorkflowApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/workflow/delete`,
    data: { id: id }
  })
}

/** 部署工作流程 */
export function deployWorkflowApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/workflow/deploy`,
    data: { id: id }
  })
}

/** 列表 */
export function listWorkflowApi(data: workflow.listWorkflowReq) {
  return instance.post<workflow.workflows>({
    url: `${API_SERVICE.CMDB}/workflow/list`,
    data: data
  })
}

/** 获取流程状态图 */
export function getWorkflowGraphApi(data: workflow.workflowGraphReq) {
  return instance.post<workflow.workflowGraph>({
    url: `${API_SERVICE.CMDB}/workflow/graph`,
    data: data
  })
}
