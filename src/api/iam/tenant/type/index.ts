/** 租户主体信息 */
export interface Tenant {
  id: number
  name: string
  code: string
  domain: string
  status: number
}

/** 创建租户请求 */
export interface CreateTenantReq {
  name: string
  code: string
}

/** 更新租户请求 */
export interface UpdateTenantReq {
  id: number
  name: string
  code: string
  domain?: string
  status?: number
}

/** 切换租户请求 */
export interface SwitchTenantReq {
  tenant_id: number
}

/** 租户列表请求 */
export interface ListTenantReq {
  offset: number
  limit: number
}

/** 租户列表响应数据 */
export interface ListTenantRes {
  total: number
  tenants: Tenant[]
}

/** 查询用户所属租户请求 */
export interface ListUserTenantsReq {
  user_id: number
  offset: number
  limit: number
  keyword: string
}
