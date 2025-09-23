// 降噪配置相关类型定义

export interface TimeRange {
  start: number
  end: number
}

export interface Matcher {
  Type: number
  Name: string
  Value: string
}

export type Matchers = Matcher[]

export interface AggregateRule {
  id: number
  type: number
  labels: string[]
  is_diff_data_source: boolean
  group_wait: number
  group_interval: number
  repeat_interval: number
  template_id: number
  enabled?: boolean // 添加 enabled 字段，因为模板中使用了
}

export interface InhibitRule {
  id: number
  name: string
  source_match: Matchers
  target_match: Matchers
  equal_labels: string[]
  time_window: TimeRange | null
  enabled: boolean
}

export interface RetrieveNoiseConfig {
  aggregate_rule: AggregateRule
  inhibit_rules: InhibitRule[]
}

export interface GetNoiseConfigReq {
  workspace_id: number
}

export interface GetNoiseConfigResponse {
  data: RetrieveNoiseConfig
}
