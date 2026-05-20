export interface Tenant {
  id: number
  name: string
  code: string
  domain: string
  status: number
  ctime?: number
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

/** 租户列表请求 */
export interface ListTenantReq {
  offset: number
  limit: number
  keyword?: string
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

/** 租户成员列表请求 (tenant_id 通过 X-Active-Tenant-ID Header 传递) */
export interface ListMembersReq {
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

/** 分配用户到租户请求 (tenant_id 通过 X-Active-Tenant-ID Header 传递) */
export interface AssignUserReq {
  user_id: number
}
/** 移除租户成员请求 (tenant_id 通过 X-Active-Tenant-ID Header 传递) */
export interface RemoveMemberReq {
  user_id: number
}

/** 批量分配租户到用户请求 */
export interface BatchAssignTenantsReq {
  user_ids: number[]
  tenant_ids: number[]
}

/** 批量取消租户分配请求 */
export interface BatchUnassignTenantsReq {
  user_ids: number[]
  tenant_ids: number[]
}

/** 批量删除租户请求 */
export interface BatchDeleteTenantsReq {
  ids: number[]
}
