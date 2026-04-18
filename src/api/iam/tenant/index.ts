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
export function switchTenantApi(data: tenant.SwitchTenantReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/tenant/switch`,
    data
  })
}

/** 租户管理 (全量列表) */
export function listTenantsApi(data: tenant.ListTenantReq) {
  return instance.post<tenant.ListTenantRes>({
    url: `${API_SERVICE.IAM}/tenant/list`,
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
