import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as user from "./type"

/** 用户注册 (公开) */
export function signupApi(data: user.SignupRequest) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/signup`,
    data
  })
}

/** 创建用户 (管理侧) */
export function createUserApi(data: user.SignupRequest) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/create`,
    data
  })
}

/** LDAP 登录 */
export function loginLdapApi(data: user.LoginLdapRequest, headers?: Record<string, string>) {
  return instance.post<user.UserData>({
    url: `${API_SERVICE.IAM}/user/ldap/login`,
    data,
    headers
  })
}

/** 系统登录 */
export function loginSystemApi(data: user.LoginSystemRequest, headers?: Record<string, string>) {
  return instance.post<user.UserData>({
    url: `${API_SERVICE.IAM}/user/system/login`,
    data,
    headers
  })
}

/** 获取个人资料 */
export function getProfileApi() {
  return instance.get<user.UserData>({
    url: `${API_SERVICE.IAM}/user/profile`
  })
}

/** 获取用户列表 */
export function listUsersApi(data: user.ListUserRequest) {
  return instance.post<user.UserListData>({
    url: `${API_SERVICE.IAM}/user/list`,
    data
  })
}

/** 退出登录 */
export function logoutApi() {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/logout`
  })
}

/** 更新用户信息 */
export function updateUserApi(data: user.UpdateUserReq) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/update`,
    data
  })
}

/** 修改密码 */
export function updatePasswordApi(data: user.UpdatePasswordRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/password/update`,
    data
  })
}

/** 获取用户详情 */
export function userDetailApi(params: { id?: number | string; username?: string }) {
  return instance.get<user.UserData>({
    url: `${API_SERVICE.IAM}/user/detail`,
    params
  })
}

/** 删除用户 */
export function deleteUserApi(id: number) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/user/delete/${id}`
  })
}

/** 批量删除用户 */
export function batchDeleteUsersApi(data: user.BatchDeleteReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/batch_delete`,
    data
  })
}

/** 搜索 LDAP 用户 */
export function searchLdapUserApi(data: user.SearchLdapUserReq) {
  return instance.post<user.LdapUserListData>({
    url: `${API_SERVICE.IAM}/user/ldap/search`,
    data
  })
}

/** 同步 LDAP 用户 */
export function syncLdapUserApi(data: user.SyncLdapUserReq) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/ldap/sync`,
    data
  })
}

/** 刷新 LDAP 缓存 */
export function refreshLdapCacheApi() {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/ldap/refresh_cache`
  })
}

/** 获取关联了特定角色的用户列表 */
export function listRoleUsersApi(data: user.ListRoleUsersReq) {
  return instance.post<user.UserListData>({
    url: `${API_SERVICE.IAM}/user/list/attached/role`,
    data
  })
}

/** 解绑外部身份 */
export function unbindIdentityApi(data: user.UnbindIdentityRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/identity/unbind`,
    data
  })
}

/** 批量治理外部身份 */
export function manageIdentitiesApi(data: user.ManageIdentitiesRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/identity/manage`,
    data
  })
}

/** 获取 OIDC 授权渲染 URL */
export function getOidcRenderApi(providerType: string) {
  return instance.get<user.OidcRenderResponse>({
    url: `${API_SERVICE.IAM}/user/oidc/render`,
    params: { provider_type: providerType }
  })
}

/** OIDC 回调登录 */
export function oidcCallbackApi(data: user.OidcCallbackRequest) {
  return instance.get<user.UserData>({
    url: `${API_SERVICE.IAM}/user/oidc/callback`,
    params: data
  })
}

/** 获取 Passkey 登录选项 (Challenge) */
export function passkeyLoginStartApi() {
  return instance.post<user.PasskeyOptionsResponse>({
    url: `${API_SERVICE.IAM}/user/passkey/login/start`
  })
}

import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/browser"

/** 验证 Passkey 登录 (Assertion) */
export function passkeyLoginFinishApi(data: AuthenticationResponseJSON, headers?: Record<string, string>) {
  return instance.post<user.UserData>({
    url: `${API_SERVICE.IAM}/user/passkey/login/finish`,
    data,
    headers
  })
}

/** 获取 Passkey 注册选项 (Challenge) */
export function passkeyRegisterStartApi() {
  return instance.post<user.PasskeyOptionsResponse>({
    url: `${API_SERVICE.IAM}/user/passkey/register/start`
  })
}

/** 验证并保存 Passkey 凭据 (Attestation) */
export function passkeyRegisterFinishApi(data: RegistrationResponseJSON, headers?: Record<string, string>) {
  return instance.post<any>({
    url: `${API_SERVICE.IAM}/user/passkey/register/finish`,
    data,
    headers
  })
}

/** 获取我的身份绑定列表 */
export function listMyIdentitiesApi(params: { provider?: string }) {
  return instance.get<user.IdentityVo[]>({
    url: `${API_SERVICE.IAM}/user/identity/list`,
    params
  })
}

/** 获取 TOTP 绑定配置 (二维码) */
export function mfaTotpSetupApi() {
  return instance.get<user.MfaTotpSetupResponse>({
    url: `${API_SERVICE.IAM}/user/mfa/totp/setup`
  })
}

/** 绑定 TOTP */
export function mfaTotpBindApi(data: user.MfaTotpBindRequest) {
  return instance.post<any>({
    url: `${API_SERVICE.IAM}/user/mfa/totp/bind`,
    data
  })
}

/** 关闭 MFA */
export function mfaDisableApi() {
  return instance.post<any>({
    url: `${API_SERVICE.IAM}/user/mfa/disable`
  })
}

/** 登录时的 MFA 校验 */
export function loginMfaVerifyApi(data: user.MfaLoginVerifyRequest) {
  return instance.post<user.UserData>({
    url: `${API_SERVICE.IAM}/user/login/mfa/verify`,
    data
  })
}
