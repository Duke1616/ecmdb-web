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
  enabled?: boolean // 添加 enabled 字段，因为模板中使用了
}

export interface RetrieveNoiseConfig {
  aggregate_rule: AggregateRule
}

export interface GetNoiseConfigReq {
  workspace_id: number
}

export interface GetNoiseConfigResponse {
  data: RetrieveNoiseConfig
}
