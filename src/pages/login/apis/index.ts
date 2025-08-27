import type * as Login from "./types"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 登录并返回 Token */
export function systemLoginApi(data: Login.LoginRequestData) {
  return instance
    .requestHader<Login.LoginResponseData>({
      url: `${API_SERVICE.CMDB}/user/system/login`,
      method: "post",
      data
    })
    .then((response) => {
      if (response.headers && response.headers["x-access-token"]) {
        response.data.access_token = response.headers["x-access-token"]
        response.data.refresh_token = response.headers["x-refresh-token"]
        response.data.username = data.username
      }

      return response
    })
}

export function ldapLoginApi(data: Login.LoginRequestData) {
  return instance
    .requestHader<Login.LoginResponseData>({
      url: `${API_SERVICE.CMDB}/user/ldap/login`,
      method: "post",
      data
    })
    .then((response) => {
      if (response.headers && response.headers["x-access-token"]) {
        response.data.access_token = response.headers["x-access-token"]
        response.data.refresh_token = response.headers["x-refresh-token"]
        response.data.username = data.username
      }

      return response
    })
}
