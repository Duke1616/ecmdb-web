import type * as Login from "./types"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 登录并返回 Token */
export function systemLoginApi(data: Login.LoginRequestData) {
  return instance.request<Login.LoginResponseData>({
    url: `${API_SERVICE.CMDB}/user/system/login`,
    method: "post",
    data
  })
}

export function ldapLoginApi(data: Login.LoginRequestData) {
  return instance.request<Login.LoginResponseData>({
    url: `${API_SERVICE.CMDB}/user/ldap/login`,
    method: "post",
    data
  })
}

export function logoutApi() {
  return instance.request({
    url: `${API_SERVICE.CMDB}/user/logout`,
    method: "post"
  })
}
