import type * as Login from "./types"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import { localCache } from "@@/utils/cache"
import { setToken } from "@@/utils/cache/cookies"

/** 登录并返回 Token */
export function systemLoginApi(data: Login.LoginRequestData) {
  return instance
    .requestHader<Login.LoginResponseData>({
      url: `${API_SERVICE.CMDB}/user/system/login`,
      method: "post",
      data
    })
    .then((response) => {
      const accessToken = response.headers["x-access-token"]
      const refreshToken = response.headers["x-refresh-token"]

      if (accessToken && refreshToken) {
        // 自动保存 token 到缓存
        localCache.setCache("access_token", accessToken)
        localCache.setCache("refresh_token", refreshToken)
        localCache.setCache("username", data.username)
        setToken(accessToken)

        // 同时设置到响应数据中，保持兼容性
        response.data.access_token = accessToken
        response.data.refresh_token = refreshToken
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
      const accessToken = response.headers["x-access-token"]
      const refreshToken = response.headers["x-refresh-token"]

      if (accessToken && refreshToken) {
        // 自动保存 token 到缓存
        localCache.setCache("access_token", accessToken)
        localCache.setCache("refresh_token", refreshToken)
        localCache.setCache("username", data.username)
        setToken(accessToken)

        // 同时设置到响应数据中，保持兼容性
        response.data.access_token = accessToken
        response.data.refresh_token = refreshToken
        response.data.username = data.username
      }

      return response
    })
}
