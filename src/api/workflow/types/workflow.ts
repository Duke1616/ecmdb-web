export interface createOrUpdateWorkflowReq {
  id?: number
  name: string
  icon: string
  desc: string
  owner: string
  is_notify: boolean
  notify_method: number
  flow_data: any
}

export interface listWorkflowReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface createLFReq {}

export interface workflow {
  id: number
  template_id: number
  name: string
  desc: string
  owner: string
  icon: string
  flow_data: any
}
export interface workflows {
  workflows: workflow[]
  total: number
}

export interface workflowGraphReq {
  id: number
  process_instance_id: number
  status: number
}

export interface workflowGraph {
  edge_ids: string[]
  workflow: workflow
}

// 根据关键字搜索工作流程请求
export interface ListByKeywordReq {
  keyword: string // 搜索关键字
  offset?: number // 偏移量
  limit?: number // 限制数量
}
