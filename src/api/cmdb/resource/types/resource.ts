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

export interface SearchModelItem {
  model_uid: string
  model_name: string
  total: number
}

/** 单租户检索模型概览响应 (阶段一) */
export interface SearchStructureResult {
  total: number
  models: SearchModelItem[]
}

/** 跨租户大盘单个租户节点 */
export interface AdminSearchTenantItem {
  tenant_id: number
  tenant_type: string
  total: number
  models: SearchModelItem[]
}

/** 跨租户检索大盘结构响应 (阶段一) */
export interface AdminSearchStructureResult {
  total: number
  organizations: AdminSearchTenantItem[]
  personals: AdminSearchTenantItem[]
}

/** 模型资产物理分页请求 (阶段二：统一兼容单租户与跨租户大盘指定 tenant_id) */
export interface SearchPagedResourcesReq {
  tenant_id?: number
  model_uid: string
  text: string
  offset: number
  limit: number
}

export type AdminSearchPagedResourcesReq = SearchPagedResourcesReq
