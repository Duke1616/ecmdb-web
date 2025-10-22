// 抑制规则相关类型定义

// 匹配类型枚举
export enum MatchType {
  Equal = 1, // 等于
  NotEqual = 2, // 不等于
  Regexp = 3, // 正则
  NotRegexp = 4 // 非正则
}

// 抑制规则生效范围枚举
export enum InhibitScope {
  Global = "global", // 全局生效
  Workspace = "workspace" // 工作空间下生效
}

export interface TimeRange {
  start: number
  end: number
}

export interface Matcher {
  type: number
  name: string
  value: string
}

export type Matchers = Matcher[]

export interface InhibitRule {
  id: number
  name: string
  source_match: Matchers
  target_match: Matchers
  source_matchers?: Matchers // API 返回的字段名
  target_matchers?: Matchers // API 返回的字段名
  equal_labels: string[]
  time_window: TimeRange | null
  enabled: boolean
  scope: InhibitScope // 生效范围
  workspace_id?: number // 工作空间ID
}

// 抑制规则保存请求
export interface SaveInhibitRuleReq {
  id?: number
  name: string
  source_matchers: Matcher[]
  target_matchers: Matcher[]
  equal_labels: string[]
  time_window: TimeRange | null
  enabled: boolean
  scope: InhibitScope // 生效范围
  workspace_id?: number // 工作空间ID
}

// 抑制规则保存响应
export interface SaveInhibitRuleResponse {
  id: number
}

// 抑制规则列表响应
export interface ListInhibitRulesResponse {
  inhibit_rules: InhibitRule[]
}

// 删除抑制规则响应
export interface DeleteInhibitRuleResponse {
  success: boolean
}

// 续期时间窗口请求
export interface RenewalTimeWindowReq {
  id: number // 抑制规则ID
  start_time: number // 开始时间
  end_time: number // 结束时间
}

// 续期时间窗口响应
export interface RenewalTimeWindowResponse {
  success: boolean
}

// 根据工作空间获取抑制规则请求
export interface ListInhibitRuleByWorkspaceReq {
  workspace_id: number // 工作空间ID
}

// 根据工作空间获取抑制规则响应
export interface ListInhibitRuleByWorkspaceResponse {
  inhibit_rules: InhibitRule[]
}

// 切换抑制规则状态响应
export interface ToggleInhibitRuleStatusResponse {
  success: boolean
}
