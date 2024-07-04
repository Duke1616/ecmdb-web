export interface createWorkflowReq {
  id?: number
  name: string
  template_id: number
  icon: string
  desc: string
  owner: string
  flow_data: any
}

export interface createInfoReq {
  name: string
  template_id: number
  icon: string
  desc: string
  owner: string
}

export interface createSettingReq {
  name: string
}

export interface listWorkflowReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface createLFReq {}

export interface workflow {
  id: number
  template_id: number
  name: string
  desc: string
  onwer: string
  icon: string
  flow_data: any
}
export interface workflows {
  workflows: workflow[]
  total: number
}
