export interface createOrderReq {
  template_id: number
  workflow_id: number
  data: object
}

export interface todoOrderReq {
  user_id?: string
  process_name?: string
  sort_by_asc: boolean
  offset: number
  limit: number
}

export interface startByOrderReq {
  user_id?: string
  process_name?: string
  offset: number
  limit: number
}

export interface order {
  task_id: number
  process_instance_id: number
  title: string
  current_step: string
  approved_by: string[]
  proc_inst_create_time: string
  workflow_id: number
  template_id: number
  ctime: number
}

export interface ordersListRes {
  orders: order[]
  total: number
}
