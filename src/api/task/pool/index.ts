import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as pool from "./type"

const POOL_API_PREFIX = `${API_SERVICE.TASK}/execution-pool`
const POOL_ADMIN_API_PREFIX = `${POOL_API_PREFIX}/admin`

export function listExecutionPoolsAdminApi(data: pool.ListPoolsReq) {
  return instance.post<pool.ListPoolsResp>({
    url: `${POOL_ADMIN_API_PREFIX}/list`,
    data
  })
}

export function listExecutionPoolBindingsAdminApi(data: pool.ListBindingsReq) {
  return instance.post<pool.ListBindingsResp>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/list`,
    data
  })
}

export function bindExecutionPoolAdminApi(data: pool.BindPoolReq) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/bind`,
    data
  })
}

export function unbindExecutionPoolAdminApi(data: pool.BindingKeyReq) {
  return instance.delete<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/unbind`,
    data
  })
}

export function enableExecutionPoolBindingAdminApi(data: pool.BindingKeyReq) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/enable`,
    data
  })
}

export function disableExecutionPoolBindingAdminApi(data: pool.BindingKeyReq) {
  return instance.post<void>({
    url: `${POOL_ADMIN_API_PREFIX}/bindings/disable`,
    data
  })
}
