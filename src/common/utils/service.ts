import { setToken, removeToken } from "@@/utils/cache/cookies"
import HyRequest from "@@/utils/request"
import { localCache } from "@@/utils/cache"
import { refreshAccessTokenApi } from "@@/apis/users"
import { ElMessage } from "element-plus"

export type ApiService = keyof typeof API_SERVICE
export const API_SERVICE = {
  CMDB: import.meta.env.VITE_ECMDB_API_PREFIX,
  ALERT: import.meta.env.VITE_ALERT_API_PREFIX
}

// 是否正在刷新token
let isRefreshing = false
// 存储待重试的请求
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
  config: any
}> = []

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  interceptors: {
    requestInterceptor: (config) => {
      const token = localCache.getCache("access_token")
      if (config.headers && token) {
        config.headers.Authorization = "Bearer " + token
      }
      return config
    },
    responseInterceptor: (response) => {
      // 自动更新 token
      const accessToken = response.headers?.["x-access-token"] || response.headers?.["X-Access-Token"]
      const refreshToken = response.headers?.["x-refresh-token"] || response.headers?.["X-Refresh-Token"]
      
      if (accessToken) {
        localCache.setCache("access_token", accessToken)
        setToken(accessToken)
      }
      if (refreshToken) {
        localCache.setCache("refresh_token", refreshToken)
      }
      
      return response
    },
    responseInterceptorCath: async (error) => {
      const originalRequest = error.config
      
      // 处理 401 错误
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // 如果正在刷新，将请求加入队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // 尝试刷新 token
          await refreshAccessTokenApi()
          
          // 处理队列中的请求
          failedQueue.forEach(({ resolve, config }) => {
            resolve(instance.request(config))
          })
          failedQueue = []
          
          // 重试原始请求
          const token = localCache.getCache("access_token")
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = "Bearer " + token
          }
          
          return instance.request(originalRequest)
        } catch (refreshError) {
          // 刷新失败，清除所有 token 并跳转登录
          failedQueue.forEach(({ reject }) => {
            reject(refreshError)
          })
          failedQueue = []
          
          localCache.removeCache("access_token")
          localCache.removeCache("refresh_token")
          localCache.removeCache("username")
          removeToken()
          
          ElMessage.error("登录已过期，请重新登录")
          window.location.href = "/login"
          
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      
      return Promise.reject(error)
    }
  }
})

export default instance
