// 分发规则相关类型定义

// 匹配类型枚举（复用抑制规则的匹配类型）
export enum MatchType {
  Equal = 1, // 等于
  NotEqual = 2, // 不等于
  Regexp = 3, // 正则
  NotRegexp = 4 // 非正则
}

// 分发规则作用域枚举
export enum DispatchScope {
  Global = "global", // 全局生效
  Rule = "rule" // 关联特定告警规则
}

// 匹配类型枚举
export enum DispatchMatchType {
  Routing = "routing", // 路由分发
  Ticket = "ticket" // 创建工单
}

// 标签匹配器
export interface Matcher {
  type: MatchType
  name: string
  value: string
}

export type Matchers = Matcher[]

// 分发规则接口
export interface DispatchRule {
  id: number
  name: string
  scope: DispatchScope // 作用域：global/rule
  rule_id?: number // 关联的告警规则ID（仅当 scope=rule 时有效）
  priority: number // 优先级（数字越小优先级越高）
  enabled: boolean // 是否启用
  description: string // 规则描述
  match_type: DispatchMatchType // 匹配类型：routing/ticket
  levels: number[] // 告警级别列表
  matchers: Matchers // 标签匹配器
  duration: number // 持续时间（秒）
  firing_count: number // 触发次数
  workspace_id: number // 目标工作空间ID
  metadata: Record<string, any> // 元数据
  ctime: number // 创建时间
  utime: number // 更新时间
}

// 创建分发规则请求
export interface CreateDispatchRuleReq {
  name: string
  scope: DispatchScope
  rule_id?: number
  priority: number
  enabled: boolean
  description: string
  match_type: DispatchMatchType
  levels: number[]
  matchers: Matcher[]
  duration: number
  firing_count: number
  workspace_id: number
  metadata?: Record<string, any>
}

// 更新分发规则请求
export interface UpdateDispatchRuleReq {
  id: number
  name?: string
  scope?: DispatchScope
  rule_id?: number
  priority?: number
  enabled?: boolean
  description?: string
  match_type?: DispatchMatchType
  levels?: number[]
  matchers?: Matcher[]
  duration?: number
  firing_count?: number
  workspace_id?: number
  metadata?: Record<string, any>
}

// 分发规则保存请求（统一创建和更新）
export interface SaveDispatchRuleReq {
  id?: number
  name: string
  scope: DispatchScope
  rule_id?: number
  priority: number
  enabled: boolean
  description: string
  match_type: DispatchMatchType
  levels: number[]
  matchers: Matcher[]
  duration: number
  firing_count: number
  workspace_id: number
  metadata?: Record<string, any>
}

// 分发规则保存响应
export interface SaveDispatchRuleResponse {
  id: number
}

// 分发规则列表响应
export interface ListDispatchRulesResponse {
  dispatch_rules: DispatchRule[]
}

// 删除分发规则响应
export interface DeleteDispatchRuleResponse {
  success: boolean
}

// 根据作用域获取分发规则请求
export interface ListDispatchRulesByScopeReq {
  scope: DispatchScope
}

// 根据规则ID获取分发规则请求
export interface ListDispatchRulesByRuleReq {
  rule_id: number
}

// 切换分发规则状态响应
export interface ToggleDispatchRuleStatusResponse {
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

// 查找匹配的分发规则请求
export interface FindMatchingRulesReq {
  scopes: string[] // 作用域列表（global/rule）
  rule_id?: number // 告警规则ID
  match_type: string // 匹配类型（routing/ticket）
}

// 查找匹配的分发规则响应
export interface FindMatchingRulesResponse {
  dispatch_rules: DispatchRule[]
}
