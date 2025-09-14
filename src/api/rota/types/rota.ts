export interface page {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface createOrUpdateRotaReq {
  id?: number
  name: string
  desc: string
  owner: string
  enabled: boolean
}

export interface addRuleReq {
  id: number
  rota_rule: rotaRule
}

export interface updateOrDeleteRuleReq {
  id: number
  rota_rules: rotaRule[]
}

export interface previewScheduleReq {
  id: number
  start_time: number
  end_time: number
}

// Rota 值班信息
export interface rota {
  id: number // 排班 ID
  name: string // 名称
  desc: string // 描述
  enabled: boolean // 是否启用
  owner: string // 所有者 ID
  rules: rotaRule[] // 值班规则
  temp_rules: rotaRule[] // 临时调班规则
}

// RotaRule 值班规则
export interface rotaRule {
  start_time: number // 开始时间 (timestamp)
  end_time: number // 结束时间 (timestamp)
  rota_groups: rotaGroup[] // 值班组
  rotate: rotate // 轮换参数
}

// addOrUpdateAdjustmentRuleReq 临时值班组
export interface addOrUpdateAdjustmentRuleReq {
  id: number
  group_id: number
  rota_rule: rotaAdjustmentRule
}

// rotaAdjustmentRule 临时值班规则
export interface rotaAdjustmentRule {
  start_time: number // 开始时间 (timestamp)
  end_time: number // 结束时间 (timestamp)
  rota_group: rotaGroup // 值班组
}

// RotaGroup 值班组
export interface rotaGroup {
  id: number
  name: string // 组名
  members: string[] // 成员 ID 数组
}

// Rotate 轮换相关参数
export interface rotate {
  time_unit: number // 轮换时间单位 (例如天、周等)
  time_duration: number // 轮换时长 (例如：每 3 天一次)
}

export interface rotas {
  rotas: rota[]
  total: number
}

// RotaRule 值班规则
export interface rotaRule {
  start_time: number // 开始时间 (timestamp)
  end_time: number // 结束时间 (timestamp)
  rota_groups: rotaGroup[] // 值班组
  rotate: rotate // 轮换参数
}

// shiftRostered 排班表
export interface shiftRostered {
  final_schedule: schedule[]
  current_schedule: schedule
  next_schedule: schedule
  members: string[]
}

export interface schedule {
  title: string
  start_time: number
  end_time: number
  rota_group: rotaGroup
}

export interface deleteAdjustmentReq {
  id: number
  group_id: number
}
