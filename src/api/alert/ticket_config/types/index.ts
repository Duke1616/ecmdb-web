// 工单配置相关类型定义

// 匹配类型枚举
export enum MatchType {
  Equal = 1, // 等于
  NotEqual = 2, // 不等于
  Regexp = 3 // 正则
}

// 标签匹配器
export interface Matcher {
  type: MatchType
  name: string
  value: string
}

export type Matchers = Matcher[]

// 工单配置接口
export interface TicketConfig {
  id: number
  workspace_id: number
  name: string
  description: string
  enabled: boolean
  priority: number
  levels: number[]
  matchers: Matchers
  duration: number // 持续时间（秒）
  eval_count: number // 评估次数
  template_id: number // 工单模板ID
  ctime: number // 创建时间
  utime: number // 更新时间
}

// 创建工单配置请求
export interface CreateTicketConfigReq {
  workspace_id: number
  name: string
  description: string
  enabled: boolean
  priority: number
  levels: number[]
  matchers: Matchers
  duration: number
  eval_count: number
  template_id: number
}

// 更新工单配置请求
export interface UpdateTicketConfigReq {
  id: number
  name: string
  description: string
  levels: number[]
  matchers: Matchers
  duration: number
  eval_count: number
  template_id: number
}

// 工单配置保存请求（统一创建和更新）
export interface SaveTicketConfigReq {
  id?: number
  workspace_id: number
  name: string
  description: string
  enabled: boolean
  priority: number
  levels: number[]
  matchers: Matchers
  duration: number
  eval_count: number
  template_id: number
}

// 工单配置保存响应
export interface SaveTicketConfigResponse {
  id: number
}

// 工单配置列表响应
export interface ListTicketConfigsResponse {
  ticket_configs: TicketConfig[]
}

// 删除工单配置响应
export interface DeleteTicketConfigResponse {
  success: boolean
}

// 切换工单配置状态响应
export interface ToggleTicketConfigStatusResponse {
  success: boolean
}

// 交换优先级请求
export interface SwapPrioritiesReq {
  src_id: number
  dst_id: number
}

// 交换优先级响应
export interface SwapPrioritiesResponse {
  success: boolean
}
