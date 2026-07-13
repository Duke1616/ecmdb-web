import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as tenant from "./type"

/** 租户空间创建 */
export function createTenantApi(data: tenant.CreateTenantReq) {
  return instance.post<tenant.Tenant>({
    url: `${API_SERVICE.IAM}/tenant/create`,
    data
  })
}

/** 获取我所属的所有租户列表 (用于下拉框展示) */
export function listMyTenantsApi() {
  return instance.get<tenant.Tenant[]>({
    url: `${API_SERVICE.IAM}/tenant/list/mine`
  })
}

/** 租户上下文切换 */
export function switchTenantApi(tenantId: number) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/switch`,
    headers: { "X-Active-Tenant-ID": String(tenantId) }
  })
}

/** 租户管理 (全量列表) */
export function listTenantsApi(data: tenant.ListTenantReq) {
  return instance.post<tenant.ListTenantRes>({
    url: `${API_SERVICE.IAM}/tenant/list`,
    data
  })
}

/** 按租户 ID 批量查询 */
export function listTenantsByIdsApi(data: tenant.ListTenantsByIdsReq) {
  return instance.post<tenant.ListTenantsByIdsRes>({
    url: `${API_SERVICE.IAM}/tenant/list/by-ids`,
    data
  })
}

/** 修改租户信息 */
export function updateTenantApi(data: tenant.UpdateTenantReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/update`,
    data
  })
}

/** 删除租户空间 */
export function deleteTenantApi(id: number) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/tenant/delete/${id}`
  })
}

/** 查看租户详情 */
export function getTenantDetailApi(id: number) {
  return instance.get<tenant.Tenant>({
    url: `${API_SERVICE.IAM}/tenant/detail/${id}`
  })
}

/** 查询特定用户的关联租户 (管理侧使用) */
export function listUserTenantsApi(data: tenant.ListUserTenantsReq) {
  return instance.post<tenant.ListTenantRes>({
    url: `${API_SERVICE.IAM}/tenant/list/attached/user`,
    data
  })
}

/** 租户成员列表 (治理侧) */
export function listTenantMembersApi(data: tenant.ListMembersReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<tenant.ListMembersRes>({
    url: `${API_SERVICE.IAM}/tenant/members`,
    data,
    headers
  })
}

/** 分配用户到租户 */
export function assignTenantUserApi(data: tenant.AssignUserReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/assign`,
    data,
    headers
  })
}
/** 移除租户成员 */
export function removeTenantMemberApi(data: tenant.RemoveMemberReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/unassign`,
    data,
    headers
  })
}

/** 批量分配租户到用户 */
export function batchAssignTenantsApi(data: tenant.BatchAssignTenantsReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/batch_assign`,
    data
  })
}

/** 批量取消租户分配 (从用户维度) */
export function batchUnassignTenantsApi(data: tenant.BatchUnassignTenantsReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/batch_unassign`,
    data
  })
}

/** 批量删除租户 */
export function batchDeleteTenantsApi(data: tenant.BatchDeleteTenantsReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/batch_delete`,
    data
  })
}
