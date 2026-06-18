export interface ListResourceReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
  model_uid: string
}

export interface detailResource {
  id: number
  model_uid: string
}
export interface setCustomFieldReq {
  id: number
  field: string
  data: any
}

export interface canBeRelationFilterReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
  resource_id: number
  model_uid: string
  relation_name: string
  filter_name?: string
  filter_condition?: string
  filter_input?: string
}

export interface Resource {
  id: number
  name: string
  model_uid: string
  data: any
}

export interface CreateOrUpdateResourceReq {
  id?: number
  name: string
  model_uid: string
  data: any
}

export interface ResourceData {
  total: number
  resources: Resource[]
}

export interface findGraphReq {
  model_uid: string
  resource_id: number
  resource_name: string
}

export interface findSecureReq {
  id: number
  field_uid: string
}

export interface globalSearchData {
  model_uid: string
  total: number
  data: any[]
}
