// 抑制规则相关类型定义

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
