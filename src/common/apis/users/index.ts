import HyRequest from "@@/utils/request"
import { localCache } from "@@/utils/cache"

// 创建专门用于刷新token的实例
const instanceRefersh = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  interceptors: {
    requestInterceptor: (config) => {
      const token = localCache.getCache("refresh_token")
      if (config.headers && token) {
        config.headers.Authorization = "Bearer " + localCache.getCache("refresh_token")
      }
      return config
    }
  }
})

/** 刷新访问令牌 */
export function refreshAccessTokenApi() {
  return instanceRefersh
    .requestHader({
      url: "user/refresh",
      method: "post"
    })
    .then((response) => {
      console.log(response.headers["x-access-token"], "x-access-token")
      console.log(response.headers["x-refresh-token"], "x-refresh-token")
      if (response.headers && response.headers["x-access-token"]) {
        localCache.setCache("access_token", response.headers["x-access-token"])
        localCache.setCache("refresh_token", response.headers["x-refresh-token"])
      }

      return response
    })
}
