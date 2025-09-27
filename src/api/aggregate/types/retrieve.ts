// 获取聚合分组响应类型（直接使用后端结构）
export interface RetrieveAggregateGroup {
  id: number
  type: number
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  matchers: any[]
  group_wait: number
  group_interval: number
  repeat_interval: number
  template_id: number
}

// 获取聚合分组请求参数
export interface GetAggregateGroupByWorkspaceReq {
  workspace_id: number
}

// 获取聚合分组响应（后端直接返回数据对象）
export type GetAggregateGroupByWorkspaceResp = RetrieveAggregateGroup | null
