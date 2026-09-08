import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as idp from "./type"

/**
 * 检查当前浏览器是否存在有效的 EIAM 主站 Session（Cookie 模式）
 * 用于路由守卫的静默 SSO 探查，不抛出错误时说明已登录
 */
export function checkSessionApi() {
  return instance.get<idp.SessionCheckResponse>({
    url: `${API_SERVICE.IAM}/user/profile`
  })
}

/** 查询接入应用列表 */
export function listApplicationsApi(data: idp.ListApplicationReq) {
  return instance.post<idp.ListApplicationResp>({
    url: `${API_SERVICE.IAM}/idp/application/list`,
    data
  })
}
export const listOAuthClientsApi = listApplicationsApi

/** 创建接入应用 */
export function createApplicationApi(data: idp.CreateApplicationReq) {
  return instance.post<idp.Application>({
    url: `${API_SERVICE.IAM}/idp/application/create`,
    data
  })
}
export const createOAuthClientApi = createApplicationApi

/** 更新接入应用 */
export function updateApplicationApi(data: idp.UpdateApplicationReq) {
  return instance.post<{ msg: string }>({
    url: `${API_SERVICE.IAM}/idp/application/update`,
    data
  })
}
export const updateOAuthClientApi = updateApplicationApi

/** 重置应用密钥 */
export function resetApplicationSecretApi(id: number) {
  return instance.post<idp.ResetSecretResp>({
    url: `${API_SERVICE.IAM}/idp/application/reset_secret/${id}`
  })
}
export const resetOAuthClientSecretApi = resetApplicationSecretApi

/** 删除接入应用 */
export function deleteApplicationApi(id: number) {
  return instance.delete<{ msg: string }>({
    url: `${API_SERVICE.IAM}/idp/application/delete/${id}`
  })
}
export const deleteOAuthClientApi = deleteApplicationApi

/** 获取应用详情 */
export function getApplicationDetailApi(id: number) {
  return instance.get<idp.Application>({
    url: `${API_SERVICE.IAM}/idp/application/detail/${id}`
  })
}
export const getOAuthClientDetailApi = getApplicationDetailApi

/** 获取待确认授权详情 */
export function getConsentInfoApi(consentId: string) {
  return instance.get<idp.ConsentInfo>({
    url: `${API_SERVICE.IAM}/idp/consent`,
    params: { consent_id: consentId }
  })
}
