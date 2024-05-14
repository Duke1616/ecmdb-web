export interface ListResourceReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
  model_uid: string
}

export interface Resource {
  id: number
  name: string
  model_uid: string
  data: object
}

export interface CreateResourceReq {
  name: string
  data: object
}

export interface ResourceData {
  total: number
  resources: Resource[]
}
