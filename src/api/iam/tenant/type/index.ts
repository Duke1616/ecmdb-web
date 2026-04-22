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

/** 租户成员列表请求 */
export interface ListMembersReq {
  tenant_id: number
  offset: number
  limit: number
  keyword?: string
}

/** 租户成员列表响应 */
export interface ListMembersRes {
  total: number
  members: TenantMember[]
}

/** 租户成员信息 (增强版用户资料) */
export interface TenantMember {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  status: number
  job_title: string
  last_login_at: number
  ctime: number
}

/** 分配用户到租户请求 */
export interface AssignUserReq {
  tenant_id: number
  user_id: number
}
