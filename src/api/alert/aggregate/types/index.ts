// 聚合路由相关类型定义

export { MatchType } from "@@/constants/match-type"
export type { Matcher, Matchers } from "@@/types/matcher"

import type { Matchers } from "@@/types/matcher"

export type AggregateReceiverType = "user" | "team" | "oncall"
export type TicketMode = "ticket_only" | "ticket_and_notify"

export interface ReceiverRef {
  id: number
  type: AggregateReceiverType
  display_name?: string
  metadata?: Record<string, any>
}

export interface TicketPolicy {
  enabled: boolean
  template_id: number
  duration: number
  eval_count: number
  mode: TicketMode
}

export interface EscalationPolicy {
  enabled: boolean
  config_id: number
}

export enum AggregateType {
  Disabled = 1,
  Rule = 2,
  Intelligent = 3
}

export interface AggregateGroupRule {
  id: number
  name: string
  type: AggregateType
  parent_id: number
  enabled: boolean
  is_default: boolean
  priority: number
  levels: number[]
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  receivers: ReceiverRef[]
  template_id: number
  ticket_policy?: TicketPolicy | null
  escalation_policy?: EscalationPolicy | null
  matchers: Matchers
  group_wait: number
  group_interval: number
  repeat_interval: number
  effective?: EffectiveAggregateRoute
  created_at?: string
  updated_at?: string
}

export interface EffectiveAggregateRoute {
  route_id: number
  route_name: string
  route_path: number[]
  group_by: string[]
  is_diff_data_source: boolean
  receivers: ReceiverRef[]
  template_id: number
  ticket_policy?: TicketPolicy | null
  escalation_policy?: EscalationPolicy | null
  group_wait: number
  group_interval: number
  repeat_interval: number
}

export interface SaveAggregateGroupRuleReq {
  id?: number
  name: string
  type: AggregateType
  parent_id: number
  enabled: boolean
  is_default: boolean
  priority: number
  levels: number[]
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  receivers: ReceiverRef[]
  template_id: number
  ticket_policy?: TicketPolicy | null
  escalation_policy?: EscalationPolicy | null
  matchers: Matchers
  group_wait: number
  group_interval: number
  repeat_interval: number
}

export interface PreviewAggregateRouteReq {
  workspace_id: number
  rule_id?: number
  rule_name?: string
  data_source_id?: number
  cluster?: string
  level: number
  labels: Record<string, string>
}

export interface PreviewAggregateRouteResp {
  route_id: number
  route_name: string
  route_path: number[]
  group_by: string[]
  is_diff_data_source: boolean
  receivers: ReceiverRef[]
  template_id: number
  ticket_policy?: TicketPolicy | null
  escalation_policy?: EscalationPolicy | null
  group_fingerprint: number
  group_wait: number
  group_interval: number
  repeat_interval: number
}

export interface DeleteAggregateRuleResponse {
  success: boolean
}

export type ListAggregateRoutesResponse = AggregateGroupRule[]
export type GetAggregateGroupByWorkspaceResp = AggregateGroupRule | null

// 兼容旧聚合表单文件的类型命名，页面入口已迁移到聚合路由树。
export interface CreateAggregateGroupRuleReq {
  id?: number
  name?: string
  type: number
  parent_id?: number
  enabled?: boolean
  is_default?: boolean
  priority?: number
  levels?: number[]
  labels: string[]
  workspace_id: number
  is_diff_data_source: boolean
  receivers?: ReceiverRef[]
  template_id?: number
  ticket_policy?: TicketPolicy | null
  escalation_policy?: EscalationPolicy | null
  matchers: Matchers
  group_wait?: number
  group_interval?: number
  repeat_interval?: number
  time_window?: unknown
  notification_template?: string
}

export interface ListAggregateRulesReq {
  workspace_id: number
  offset?: number
  limit?: number
  keyword?: string
}

export interface ListAggregateRulesResponse {
  rules: AggregateGroupRule[]
  total: number
}

export interface ReorderAggregateRoutesReq {
  workspace_id: number
  dragged_route_id: number
  target_parent_id: number
  target_position: number
}
