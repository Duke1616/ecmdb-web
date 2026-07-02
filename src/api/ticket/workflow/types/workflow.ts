import type LogicFlow from "@logicflow/core"

export interface CreateOrUpdateWorkflowReq {
  id?: number
  name: string
  icon: string
  desc: string
  owner: string
  is_notify: boolean
  notify_method: number
  flow_data: WorkflowGraphData
}

export interface ListWorkflowReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export type WorkflowGraphData = LogicFlow.GraphConfigData

export interface Workflow {
  id: number
  template_id: number
  name: string
  desc: string
  owner: string
  icon: string
  is_notify: boolean
  notify_method: number
  flow_data?: WorkflowGraphData
}

export interface WorkflowListRes {
  workflows: Workflow[]
  total: number
}

export interface WorkflowGraphReq {
  id: number
  process_instance_id: number
  status: number
}

export interface WorkflowGraphRes {
  edge_ids: string[]
  workflow: Workflow
}

// 根据关键字搜索工作流程请求
export interface ListByKeywordReq {
  keyword: string // 搜索关键字
  offset?: number // 偏移量
  limit?: number // 限制数量
}

export interface FindByIdsReq {
  ids: number[]
}

export interface AutomationCodebookUidsReq {
  workflow_id: number
}

export interface RetrieveAutomationCodebookUids {
  automation_codebooks: Record<string, AutomationCodebookValue>
}

export type AutomationCodebookValue = number | string | AutomationCodebookConfig

export interface AutomationCodebookConfig {
  id?: number
  dispatch_id?: number
  codebook_id: number
}
