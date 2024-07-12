export interface createOrUpdateTemplateReq {
  id?: number
  name: string
  rules?: any
  options?: any
  desc: string
  icon: string
  flow_id?: number
  group_id?: number
}

export interface PageReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface template {
  id: number
  name: string
  rules: any
  options: any
  create_type: number
  desc: string
  icon: string
  flow_id: number
  group_id: number
}

export interface templates {
  total: number
  templates: template[]
}

export interface createTemplateGroupReq {
  name: string
  icon: string
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

export interface templateCombination {
  id: number
  name: string
  icon: string
  total: number
  templates: template[]
}

export interface templateCombinations {
  template_combinations: templateCombination[]
}
