import type * as dispatch from "./types/dispatch"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 自动派发列表 */
export function listDispatchesByTemplateIdApi(data: dispatch.listByTemplateIdReq) {
  return instance.post<dispatch.dispatches>({
    url: `${API_SERVICE.TICKET}/dispatch/list/by_template_id`,
    data: data
  })
}

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
