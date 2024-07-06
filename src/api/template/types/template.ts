export interface createOrUpdateTemplateReq {
  id?: number
  name: string
  rules?: any
  options?: any
  desc: string
}

export interface listTemplateReq {
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
}

export interface templates {
  total: number
  templates: template[]
}
