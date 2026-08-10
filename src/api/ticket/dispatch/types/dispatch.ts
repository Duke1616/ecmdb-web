export interface dispatch {
  id: number
  template_id: number
  automation_node_id: string
  runner_id: number
  field: string
  value: string
  priority: number
}

export interface createOrUpdateDispatchReq {
  id?: number
  template_id: number
  automation_node_id: string
  runner_id: number
  field: string
  value: string
  priority: number
}

export interface syncDispatchReq {
  template_id?: number
  sync_template_id?: number
}

export interface listDispatchByTemplateIdReq {
  template_id: number
  offset?: number
  limit?: number
}

export interface dispatchListRes {
  dispatches: dispatch[]
  total: number
}
