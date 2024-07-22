import type * as Login from "./types/login"

import instanceRefersh from "@/utils/refersh_service"
import instance from "@/utils/hy_service"
import { localCache } from "@/utils/cache"

/** 登录并返回 Token */
export function loginApi(data: Login.LoginRequestData) {
  return instance
    .requestHader<Login.LoginResponseData>({
      url: "user/ldap/login",
      method: "post",
      data
    })
    .then((response) => {
      if (response.headers && response.headers["x-access-token"]) {
        response.data.access_token = response.headers["x-access-token"]
        response.data.refresh_token = response.headers["x-refresh-token"]
      }

      return response
    })
}

/** 获取用户详情 */
export function refreshAccessTokenApi() {
  return instanceRefersh
    .requestHader({
      url: "user/refresh",
      method: "post"
    })
    .then((response) => {
      if (response.headers && response.headers["x-access-token"]) {
        localCache.setCache("access_token", response.headers["x-access-token"])
        localCache.setCache("refresh_token", response.headers["x-refresh-token"])
      }

      return response
    })
}

/** 获取用户详情 */
export function getUserInfoApi() {
  return instance.post<Login.UserInfoResponseData>({
    url: "user/info"
  })
}
