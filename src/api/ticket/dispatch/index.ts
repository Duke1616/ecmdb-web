import type * as dispatch from "./types/dispatch"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建自动派发 */
export function createDispatchApi(data: dispatch.createOrUpdateDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/create`,
    data: data
  })
}

/** 更新自动派发 */
export function updateDispatchApi(data: dispatch.createOrUpdateDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/update`,
    data: data
  })
}

/** 删除自动派发 */
export function deleteDispatchApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/delete`,
    data: { id: id }
  })
}

/** 同步自动派发 */
export function syncDispatchApi(data: dispatch.syncDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/sync`,
    data: data
  })
}

/** 按模板查询自动派发配置 */
export function listDispatchByTemplateIdApi(data: dispatch.listDispatchByTemplateIdReq) {
  return instance.post<dispatch.dispatchListRes>({
    url: `${API_SERVICE.TICKET}/dispatch/list/by_template_id`,
    data
  })
}
