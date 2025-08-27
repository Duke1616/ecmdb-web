import type * as discovery from "./types/discovery"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 自动发现列表 */
export function listDiscoveriesByTemplateIdApi(data: discovery.listByTemplateIdReq) {
  return instance.post<discovery.discoveries>({
    url: `${API_SERVICE.CMDB}/discovery/list/by_template_id`,
    data: data
  })
}

/** 创建自动发现 */
export function createDiscoveryApi(data: discovery.createOrUpdateDiscoveryReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/discovery/create`,
    data: data
  })
}

/** 更新自动发现 */
export function updateDiscoveryApi(data: discovery.createOrUpdateDiscoveryReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/discovery/update`,
    data: data
  })
}

/** 删除自动发现 */
export function deleteDiscoveryApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/discovery/delete`,
    data: { id: id }
  })
}

/** 删除自动发现 */
export function syncDiscoveryApi(data: discovery.syncDiscoveryReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/discovery/sync`,
    data: data
  })
}
