// 聚合组规则相关类型定义

export interface Matcher {
  type: number
  name: string
  value: string
}

export type Matchers = Matcher[]

export interface CreateAggregateGroupRuleReq {
  id?: number
  type: number
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  matchers: Matchers
  group_wait: number
  group_interval: number
  repeat_interval: number
}

export interface AggregateGroupRule {
  id: number
  type: number
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  matchers: Matchers
  group_wait: number
  group_interval: number
  repeat_interval: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ListAggregateRulesReq {
  workspace_id: number
  offset: number
  limit: number
  keyword?: string
}

export interface ListAggregateRulesResponse {
  rules: AggregateGroupRule[]
  total: number
}

export interface DeleteAggregateRuleReq {
  id: number
}

export interface DeleteAggregateRuleResponse {
  success: boolean
}
