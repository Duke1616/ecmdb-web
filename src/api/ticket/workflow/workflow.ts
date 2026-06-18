import type * as workflow from "./types/workflow"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增工作流程 */
export function createWorkflowApi(data: workflow.createOrUpdateWorkflowReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/workflow/create`,
    data: data
  })
}

/** 修改工作流程 */
export function updateWorkflowApi(data: workflow.createOrUpdateWorkflowReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/workflow/update`,
    data: data
  })
}

/** 删除工作流程 */
export function deleteWorkflowApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/workflow/delete`,
    data: { id: id }
  })
}

/** 部署工作流程 */
export function deployWorkflowApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/workflow/deploy`,
    data: { id: id }
  })
}

/** 列表 */
export function listWorkflowApi(data: workflow.listWorkflowReq) {
  return instance.post<workflow.workflows>({
    url: `${API_SERVICE.TICKET}/workflow/list`,
    data: data
  })
}

/** 获取流程状态图 */
export function getWorkflowGraphApi(data: workflow.workflowGraphReq) {
  return instance.post<workflow.workflowGraph>({
    url: `${API_SERVICE.TICKET}/workflow/graph`,
    data: data
  })
}

/** 根据关键字搜索工作流程 */
export function listWorkflowsByKeywordApi(data: workflow.ListByKeywordReq) {
  return instance.post<workflow.workflows>({
    url: `${API_SERVICE.TICKET}/workflow/list/by_keyword`,
    data: data
  })
}

/** 获取工作流详情 */
export function getWorkflowDetailApi(id: number) {
  return instance.get<workflow.workflow>({
    url: `${API_SERVICE.TICKET}/workflow/detail/${id}`
  })
}

/** 根据流程 Ids 批量获取工作流详情 */
export function findWorkflowByIdsApi(ids: number[]) {
  return instance.post<workflow.workflows>({
    url: `${API_SERVICE.TICKET}/workflow/by_ids`,
    data: { ids }
  })
}
