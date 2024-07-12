export interface startTaskReq {
  process_id: number
  business_id: string
  comment: string
  variables: variables[]
}

export interface variables {
  key: string
  value: string
}

export interface createTaskReq {
  template_id: number
  flow_id: number
  data: any
}
