import type * as dispatch from "./types/dispatch"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 创建执行单元路由规则 */
export function createDispatchApi(data: dispatch.createOrUpdateDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/create`,
    data: data
  })
}

/** 更新执行单元路由规则 */
export function updateDispatchApi(data: dispatch.createOrUpdateDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/update`,
    data: data
  })
}

/** 删除执行单元路由规则 */
export function deleteDispatchApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/delete`,
    data: { id: id }
  })
}

/** 从同一工作流的模板复制路由规则 */
export function syncDispatchApi(data: dispatch.syncDispatchReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/dispatch/sync`,
    data: data
  })
}

/** 按模板查询执行单元路由规则 */
export function listDispatchByTemplateIdApi(data: dispatch.listDispatchByTemplateIdReq) {
  return instance.post<dispatch.dispatchListRes>({
    url: `${API_SERVICE.TICKET}/dispatch/list/by_template_id`,
    data
  })
}
