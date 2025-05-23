export interface discovery {
  id: number
  template_id: number
  runner_id: number
  field: string
  value: string
}

export interface createOrUpdateDiscoveryReq {
  id?: number
  template_id: number
  runner_id: number
  field: string
  value: string
}

export interface discoveries {
  discoveries: discovery[]
  total: number
}

export interface listByTemplateIdReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
  /** 模版ID */
  template_id: number
}

export interface syncDiscoveryReq {
  /** 模版ID */
  template_group_id: number | undefined
  /** 模版ID */
  template_id: number | undefined
  /** 同步模版ID */
  sync_template_id: number | undefined
}
