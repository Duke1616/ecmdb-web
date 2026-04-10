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
export function listUsersApi(params: { offset: number; limit: number }) {
  return instance.post<user.UserListData>({
    url: `${API_SERVICE.IAM}/user/list`,
    data: params
  })
}

/** 退出登录 */
export function logoutApi() {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/user/logout`
  })
}

/** 更新用户信息 (根据 RetrieveUser/UpdateUserReq 推断) */
export function updateUserApi(data: user.UpdateUserReq) {
  return instance.post<user.User>({
    url: `${API_SERVICE.IAM}/user/update`,
    data
  })
}
