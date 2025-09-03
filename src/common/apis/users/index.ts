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
      const accessToken = response.headers["x-access-token"]
      const refreshToken = response.headers["x-refresh-token"]
      
      if (accessToken && refreshToken) {
        // 更新缓存中的 token
        localCache.setCache("access_token", accessToken)
        localCache.setCache("refresh_token", refreshToken)
        
        console.log("Token 刷新成功")
        return response
      } else {
        throw new Error("刷新 token 失败：未获取到新的 token")
      }
    })
    .catch((error) => {
      console.error("刷新 token 失败:", error)
      throw error
    })
}
