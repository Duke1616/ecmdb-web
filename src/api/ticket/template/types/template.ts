export interface createOrUpdateTemplateReq {
  id?: number
  name: string
  rules?: any
  options?: any
  desc: string
  icon: string
  workflow_id?: number
  group_id?: number
  schedule_overrides?: ScheduleOverrides
}

/** 模板针对单个自动化节点配置的执行时间覆盖。 */
export type ScheduleOverride =
  | { type: "delay"; field: string; unit: "minute" | "hour" | "day" }
  | { type: "at"; field: string; time_field?: string }

export type ScheduleOverrides = Record<string, ScheduleOverride>

export interface PageReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface ListTemplateReq extends PageReq {
  /** 模板分组 ID，不传表示全部 */
  group_id?: number
  /** 关键字 */
  keyword?: string
}

export interface rule {
  type: string
  title: string
  field: string
  props?: Record<string, any>
}

export interface templateRule {
  id: number
  name: string
  rules: rule[]
}

export interface templateRules {
  template_rules: templateRule[]
}

export interface template {
  id: number
  name: string
  rules: any
  options: any
  create_type: number
  desc: string
  icon: string
  workflow_id: number
  group_id: number
  schedule_overrides?: ScheduleOverrides
}

export interface templates {
  total: number
  templates: template[]
}

export interface createTemplateGroupReq {
  name: string
  icon: string
}

export interface updateTemplateGroupReq extends createTemplateGroupReq {
  id: number
}

export interface templateGroup {
  id: number
  name: string
  icon: string
}

export interface templateGroups {
  total: number
  template_groups: templateGroup[]
}

export interface templateGroupSummary extends templateGroup {
  total: number
}

export interface templateGroupSummaries {
  total: number
  template_groups: templateGroupSummary[]
}

export interface favoriteTemplates {
  templates: template[]
}

export interface toggleFavoriteReq {
  template_id: number
}
