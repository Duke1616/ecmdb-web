import instance from "@@/utils/service"
import { API_SERVICE, withActiveTenant } from "@@/utils/service"
import type * as pool from "./type"

const POOL_API_PREFIX = `${API_SERVICE.TASK}/execution-pool`
const POOL_ADMIN_API_PREFIX = `${POOL_API_PREFIX}/admin`

export function listExecutionPoolsAdminApi(data: pool.ListPoolsReq) {
  return instance.post<pool.ListPoolsResp>({
    url: `${POOL_ADMIN_API_PREFIX}/list`,
    data
  })
}

/** 查询绑定；指定 tenantId 时通过 X-Active-Tenant-ID 选择租户。 */
export function listExecutionPoolBindingsAdminApi(data: pool.ListBindingsReq, tenantId?: number) {
  return instance.post<pool.ListBindingsResp>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/list`,
    data,
    ...withActiveTenant(tenantId)
  })
}

/** 创建资源池绑定，tenantId 会写入 X-Active-Tenant-ID 请求头。 */
export function bindExecutionPoolAdminApi(data: pool.BindPoolReq, tenantId: number) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/bind`,
    data,
    ...withActiveTenant(tenantId)
  })
}

/** 删除资源池绑定，tenantId 会写入 X-Active-Tenant-ID 请求头。 */
export function unbindExecutionPoolAdminApi(data: pool.BindingKeyReq, tenantId: number) {
  return instance.delete<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/unbind`,
    data,
    ...withActiveTenant(tenantId)
  })
}

/** 启用资源池绑定，tenantId 会写入 X-Active-Tenant-ID 请求头。 */
export function enableExecutionPoolBindingAdminApi(data: pool.BindingKeyReq, tenantId: number) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/enable`,
    data,
    ...withActiveTenant(tenantId)
  })
}

/** 禁用资源池绑定，tenantId 会写入 X-Active-Tenant-ID 请求头。 */
export function disableExecutionPoolBindingAdminApi(data: pool.BindingKeyReq, tenantId: number) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/disable`,
    data,
    ...withActiveTenant(tenantId)
  })
}
