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
export function listOAuthClientsApi(data: idp.ListOAuthClientReq) {
  return instance.post<idp.ListOAuthClientResp>({
    url: `${API_SERVICE.IAM}/idp/client/list`,
    data
  })
}

/** 创建接入应用 */
export function createOAuthClientApi(data: idp.CreateOAuthClientReq) {
  return instance.post<idp.OAuthClient>({
    url: `${API_SERVICE.IAM}/idp/client/create`,
    data
  })
}

/** 更新接入应用 */
export function updateOAuthClientApi(data: idp.UpdateOAuthClientReq) {
  return instance.post<{ msg: string }>({
    url: `${API_SERVICE.IAM}/idp/client/update`,
    data
  })
}

/** 重置应用密钥 */
export function resetOAuthClientSecretApi(id: number) {
  return instance.post<idp.ResetSecretResp>({
    url: `${API_SERVICE.IAM}/idp/client/reset_secret/${id}`
  })
}

/** 删除接入应用 */
export function deleteOAuthClientApi(id: number) {
  return instance.delete<{ msg: string }>({
    url: `${API_SERVICE.IAM}/idp/client/delete/${id}`
  })
}

/** 获取应用详情 */
export function getOAuthClientDetailApi(id: number) {
  return instance.get<idp.OAuthClient>({
    url: `${API_SERVICE.IAM}/idp/client/detail/${id}`
  })
}

/** 获取待确认授权详情 */
export function getConsentInfoApi(consentId: string) {
  return instance.get<idp.ConsentInfo>({
    url: `${API_SERVICE.IAM}/idp/consent`,
    params: { consent_id: consentId }
  })
}
