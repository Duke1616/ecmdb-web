export interface CreateRealtionTypeReq {
  uid: string
  name: string
  source_describe: string
  target_describe: string
}

export interface UpdateRelationTypeReq {
  id: number
  name: string
  source_describe: string
  target_describe: string
}

export interface DeleteRelationTypeReq {
  id: number
}

export interface CreateModelRelationReq {
  source_model_uid: string
  target_model_uid: string
  relation_type_uid: string
  mapping: string
  description?: string
}

export interface UpdateModelRelationReq {
  id: number
  source_model_uid: string
  target_model_uid: string
  relation_type_uid: string
  mapping: string
}

export interface ModelRelation {
  id: number
  relation_name: string
  source_model_uid: string
  target_model_uid: string
  relation_type_uid: string
  mapping: string
  display_label?: string
}

export interface ListModelRealtionReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
  model_uid: string
}

export type ListModelRelationResult = {
  model_relations: ModelRelation[]
  total: number
}

export interface ListRelationTypeReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface ListRelationTypeData {
  id: number
  uid: string
  name: string
  source_describe: string
  target_describe: string
}

export interface createResourceRelation {
  source_resource_id: number
  target_resource_id: number
  relation_name: string
}

export type ListRelationTypeResult = {
  relation_types: ListRelationTypeData[]
  total: number
}

export interface listRelatedAssetsReq {
  model_uid: string
  resource_id: number
}

export interface relatedAssetsData {
  relation_name: string
  model_uid: string
  total: number
  resource_ids: number[]
  resources: any
  display_field: any
}

export interface deleteResourceRelationReq {
  model_uid: string
  resource_id: number
  relation_name: string
}
