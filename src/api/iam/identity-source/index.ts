import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as idp from "./type"

/** 保存身份源配置 */
export function saveIdentitySourceApi(data: idp.SaveIdentitySourceReq) {
  return instance.post<number | string>({
    url: `${API_SERVICE.IAM}/identity_source/save`,
    data
  })
}

/** 获取身份源列表 */
export function listIdentitySourcesApi() {
  return instance.post<idp.IdentitySourceListData>({
    url: `${API_SERVICE.IAM}/identity_source/list`,
    data: {}
  })
}

/** 获取已启用的提供商类型 */
export function getEnabledProvidersApi() {
  return instance.get<string[]>({
    url: `${API_SERVICE.IAM}/identity_source/enabled_providers`
  })
}

/** 删除身份源 */
export function deleteIdentitySourceApi(id: number | string) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/identity_source/delete/${id}`
  })
}

/** 获取身份源详情 */
export function getIdentitySourceDetailApi(id: number | string) {
  return instance.get<idp.IdentitySourceVO>({
    url: `${API_SERVICE.IAM}/identity_source/detail/${id}`
  })
}

/** 切换身份源启用状态 */
export function toggleIdentitySourceApi(id: number | string) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/identity_source/toggle/${id}`
  })
}

/** 测试身份源连接 */
export function testIdentitySourceApi(data: idp.SaveIdentitySourceReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/identity_source/test`,
    data
  })
}
