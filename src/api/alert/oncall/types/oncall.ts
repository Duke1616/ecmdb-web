export interface Page {
  offset?: number
  limit: number
}

export interface CreateOrUpdateOnCallReq {
  id?: number
  name: string
  desc: string
  owner: string
  enabled: boolean
}

export interface AddRuleReq {
  id: number
  oncall_rule: OnCallRule
}

export interface UpdateOrDeleteRuleReq {
  id: number
  oncall_rules: OnCallRule[]
}

export interface ActiveRuleReq {
  id: number
  rule_id: number
}

export interface PreviewScheduleReq {
  id: number
  start_time: number
  end_time: number
}

// OnCall 值班信息
export interface OnCall {
  id: number // 排班 ID
  name: string // 名称
  desc: string // 描述
  enabled: boolean // 是否启用
  owner: string // 所有者 ID
  rules: OnCallRule[] // 值班规则
  adjustment_rules: OnCallAdjustmentRule[] // 临时调班规则
}

// OnCallRule 值班规则
export interface OnCallRule {
  id: number // 规则 ID
  rule_id?: number // 兼容部分接口返回的规则 ID 字段
  rule_type: number // 规则类型: 1 常规排班
  enabled: boolean // 是否启用
  start_time: number // 开始时间 (timestamp)
  end_time: number // 结束时间 (timestamp)
  oncall_groups: OnCallGroup[] // 值班组
  rotate: Rotate // 轮换参数
}

// AddOrUpdateAdjustmentRuleReq 临时值班组
export interface AddOrUpdateAdjustmentRuleReq {
  id: number
  group_id: number
  oncall_rule: OnCallAdjustmentRule
}

// OnCallAdjustmentRule 临时值班规则
export interface OnCallAdjustmentRule {
  id: number // 规则 ID
  rule_type: number // 规则类型: 2 临时调班
  start_time: number // 开始时间 (timestamp)
  end_time: number // 结束时间 (timestamp)
  oncall_group: OnCallGroup // 值班组
}

// OnCallGroup 值班组
export interface OnCallGroup {
  id: number
  name: string // 组名
  members: string[] // 成员 ID 数组
}

// Rotate 轮换相关参数
export interface Rotate {
  time_unit: number // 轮换时间单位 (例如天、周等)
  time_duration: number // 轮换时长 (例如：每 3 天一次)
}

export interface OnCalls {
  oncalls: OnCall[]
  total: number
}

// ShiftRostered 排班表
export interface ShiftRostered {
  final_schedule: Schedule[]
  current_schedule: Schedule
  next_schedule: Schedule
  members: string[]
}

export interface Schedule {
  title: string
  start_time: number
  end_time: number
  oncall_group: OnCallGroup
}

export interface DeleteAdjustmentReq {
  id: number
  group_id: number
}
