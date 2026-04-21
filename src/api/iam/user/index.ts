import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as user from "./type"

/** 用户注册 */
export function signupApi(data: user.SignupRequest) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/signup`,
    data
  })
}

/** LDAP 登录 */
export function loginLdapApi(data: user.LoginLdapRequest) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/ldap/login`,
    data
  })
}

/** 系统登录 */
export function loginSystemApi(data: user.LoginSystemRequest) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/system/login`,
    data
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
