export interface dispatch {
  id: number
  template_id: number
  runner_id: number
  field: string
  value: string
}

export interface createOrUpdateDispatchReq {
  id?: number
  template_id: number
  runner_id: number
  field: string
  value: string
}

export interface syncDispatchReq {
  /** 模版ID */
  template_group_id: number | undefined
  /** 模版ID */
  template_id: number | undefined
  /** 同步模版ID */
  sync_template_id: number | undefined
}
