// 路由规则相关类型定义

// 重新导出通用的 MatchType 和 Matcher 类型
export { MatchType } from "@@/constants/match-type"
export type { Matcher, Matchers } from "@@/types/matcher"

// 导入类型用于本文件内使用
import type { Matcher, Matchers } from "@@/types/matcher"

// 路由规则作用域枚举
export enum RoutingScope {
  Global = "global", // 全局生效
  Rule = "rule" // 关联特定告警规则
}

// 路由规则接口
export interface RoutingRule {
  id: number
  name: string
  scope: RoutingScope // 作用域：global/rule
  rule_id?: number // 关联的告警规则ID（仅当 scope=rule 时有效）
  priority: number // 优先级（数字越小优先级越高）
  enabled: boolean // 是否启用
  description: string // 规则描述
  levels: number[] // 告警级别列表
  matchers: Matchers // 标签匹配器
  workspace_id: number // 目标工作空间ID
  metadata?: Record<string, any> // 元数据
  ctime: number // 创建时间
  utime: number // 更新时间
}

// 创建路由规则请求
export interface CreateRoutingRuleReq {
  name: string
  scope: RoutingScope
  rule_id?: number
  priority: number
  enabled: boolean
  description: string
  levels: number[]
  matchers: Matcher[]
  workspace_id: number
  metadata?: Record<string, any>
}

// 更新路由规则请求
export interface UpdateRoutingRuleReq {
  id: number
  name: string
  rule_id?: number
  description: string
  levels: number[]
  matchers: Matcher[]
  workspace_id: number
  metadata?: Record<string, any>
}

// 路由规则保存请求（统一创建和更新）
export interface SaveRoutingRuleReq {
  id?: number
  name: string
  scope: RoutingScope
  rule_id?: number
  priority: number
  enabled: boolean
  description: string
  levels: number[]
  matchers: Matcher[]
  workspace_id: number
  metadata?: Record<string, any>
}

// 路由规则保存响应
export interface SaveRoutingRuleResponse {
  id: number
}

// 路由规则列表响应
export interface ListRoutingRulesResponse {
  routing_rules: RoutingRule[]
}

// 删除路由规则响应
export interface DeleteRoutingRuleResponse {
  success: boolean
}

// 根据作用域获取路由规则请求
export interface ListRoutingRulesByScopeReq {
  scope: RoutingScope
}

// 根据规则ID获取路由规则请求
export interface ListRoutingRulesByRuleReq {
  rule_id: number
}

// 切换路由规则状态响应
export interface ToggleRoutingRuleStatusResponse {
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

// 查找匹配的路由规则请求
export interface FindMatchingRulesReq {
  scopes: string[] // 作用域列表（global/rule）
  rule_id?: number // 告警规则ID
}

// 查找匹配的路由规则响应
export interface FindMatchingRulesResponse {
  routing_rules: RoutingRule[]
}
