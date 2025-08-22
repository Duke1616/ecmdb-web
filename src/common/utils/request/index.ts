import axios from "axios"
import type { AxiosInstance } from "axios"
import type { HYRequesInterceptors, HYRequestConfig } from "./type"
import { ElMessage } from "element-plus"
import { get } from "lodash-es"
import { localCache } from "@@/utils/cache"
import { removeToken } from "@@/utils/cache/cookies"

/** 退出登录并重定向到登录页 */
async function logout() {
  // 防止重复调用logout
  if (isLoggingOut) {
    return
  }
  isLoggingOut = true
  
  // 清除token
  localCache.removeCache("access_token")
  localCache.removeCache("refresh_token")
  localCache.removeCache("username")
  
  // 清除cookie中的token
  removeToken()
  
  // 重定向到登录页，而不是刷新整个页面
  console.log("重定向到登录页")
  setTimeout(() => {
    window.location.href = "/login"
  }, 1000)
}

// 创建一个锁来确保只有一个 token 刷新操作在执行
let isRefreshing = false
let failedQueue: any[] = []
// 防止刷新token请求本身也触发401循环
let isRefreshRequest = false
// 防止logout被频繁调用导致无限刷新
let isLoggingOut = false

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

class HyRequest {
  // axios的实力方法
  instance: AxiosInstance
  // 传过来的请求与响应拦截
  interceptors?: HYRequesInterceptors

  // 构造器
  constructor(config: HYRequestConfig) {
    this.instance = axios.create(config)
    this.interceptors = config.interceptors

    // 当前实例的请求拦截
    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptor,
      this.interceptors?.requestInterceptorCath
    )
    // 当前实例的响应拦击
    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptor,
      this.interceptors?.responseInterceptorCath
    )

    // 所有实例的请求拦截
    this.instance.interceptors.request.use(
      (config) => {
        // console.log('所有实例的请求拦截')
        return config
      },
      (error) => {
        // console.log('所有实例的请求失败拦截')
        return Promise.reject(error)
      }
    )
    // 所有实例的响应拦截
    this.instance.interceptors.response.use(
      (response) => {
        // 返回结果包括了响应数据和响应头信息
        // apiData 是 api 返回的数据
        const apiData = response.data
        // 二进制数据则直接返回
        const responseType = response.request?.responseType
        if (responseType === "blob" || responseType === "arraybuffer") return apiData
        // 这个 code 是和后端约定的业务 code
        const code = apiData.code
        // 如果没有 code, 代表这不是项目后端开发的 api
        if (code === undefined) {
          ElMessage.error("非本系统的接口")
          return Promise.reject(new Error("非本系统的接口"))
        }
        switch (code) {
          case 0:
            // 本系统采用 code === 0 来表示没有业务错误
            return response
          default:
            // 不是正确的 code
            ElMessage.error(apiData.msg || "Error")
            return Promise.reject(new Error("Error"))
        }
      },
      (error) => {        
        // 处理网络错误（如网络断开、服务器不可达等）
        if (!error.response) {
          // 网络错误时不立即登出，只显示错误信息
          ElMessage.error("网络连接失败，请检查网络设置")
          return Promise.reject(error)
        }
        
        if (error.response.data !== "") {
          const message = get(error, "response.data.msg")
          ElMessage.error(message)
        } else {
          const status = get(error, "response.status")
          const originalRequest = error.config
          switch (status) {
            case 400:
              error.message = "请求错误"
              break
            case 401:
              // 如果是刷新token的请求本身返回401，直接登出
              if (isRefreshRequest) {
                logout().catch(console.error)
                ElMessage.error("刷新token失败, 请重新登录")
                return Promise.reject(error)
              }
              
              // 如果正在刷新token，将请求添加到队列中
              if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                  failedQueue.push({ resolve, reject })
                })
                  .then((token) => {
                    originalRequest.headers["Authorization"] = `Bearer ${token}`
                    return this.instance(originalRequest)
                  })
                  .catch((err) => {
                    return Promise.reject(err)
                  })
              }

              isRefreshing = true
              isRefreshRequest = true

              // 使用原生axios，避免使用HyRequest实例（打破循环）
              return axios
                .create({
                  baseURL: import.meta.env.VITE_BASE_API,
                  timeout: 5000,
                  headers: {
                    Authorization: `Bearer ${localCache.getCache("refresh_token")}`
                  }
                })
                .post("/user/refresh")
                .then((response) => {
                  // 从响应头获取新的token
                  const newAccessToken = response.headers["x-access-token"]
                  const newRefreshToken = response.headers["x-refresh-token"]
                  
                  if (newAccessToken) {
                    localCache.setCache("access_token", newAccessToken)
                    if (newRefreshToken) {
                      localCache.setCache("refresh_token", newRefreshToken)
                    }
                    
                    this.instance.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`
                    originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`
                    processQueue(null, newAccessToken)
                    return this.instance(originalRequest)
                  } else {
                    throw new Error("刷新token失败：未获取到新的access_token")
                  }
                })
                .catch((error) => {
                  processQueue(error, null)
                  // 检查是否是网络错误或服务器错误
                  if (!error.response || error.response.status >= 500) {
                    logout().catch(console.error)
                    ElMessage.error("服务器暂时不可用，请稍后重试")
                    return Promise.reject(error)
                  }
                  
                  // 只有真正的认证错误才登出
                  if (error.response.status === 401) {
                    logout().catch(console.error)
                    ElMessage.error("认证过期，请重新登录")
                  } else {
                    ElMessage.error("刷新token失败，请重新登录")
                  }
                  
                  return Promise.reject(error)
                })
                .finally(() => {
                  isRefreshing = false
                  isRefreshRequest = false
                })

            // return refreshAccessTokenApi()
            //   .then((token) => {
            //     // 刷新成功，处理队列中的请求
            //     this.instance.defaults.headers["Authorization"] = `Bearer ${token}`
            //     originalRequest.headers["Authorization"] = `Bearer ${token}`
            //     processQueue(null, localCache.getCache("access_token"))
            //     return this.instance(originalRequest)
            //   })
            //   .catch((error) => {
            //     // 刷新失败，处理队列并登出
            //     processQueue(error, null)
            //     logout()
            //     ElMessage.error("认证过期，请重新登录")
            //     return Promise.reject(error)
            //   })
            //   .finally(() => {
            //     isRefreshing = false
            //   })

            // 动态导入，打破循环依赖
            // return import("@@/apis/users")
            //   .then(({ refreshAccessTokenApi }) => {
            //     return refreshAccessTokenApi()
            //   })
            //   .then((token) => {
            //     this.instance.defaults.headers["Authorization"] = `Bearer ${token}`
            //     originalRequest.headers["Authorization"] = `Bearer ${token}`
            //     processQueue(null, localCache.getCache("access_token"))
            //     return this.instance(originalRequest)
            //   })
            //   .catch((error) => {
            //     processQueue(error, null)
            //     logout()
            //     ElMessage.error("认证过期，请重新登录")
            //     return Promise.reject(error)
            //   })
            //   .finally(() => {
            //     isRefreshing = false
            //   })
            case 403:
              error.message = "拒绝访问"
              break
            case 404:
              error.message = "请求地址出错"
              break
            case 408:
              error.message = "请求超时"
              break
            case 500:
              error.message = "服务器内部错误"
              break
            case 501:
              error.message = "服务未实现"
              break
            case 502:
              error.message = "网关错误"
              break
            case 503:
              error.message = "服务不可用"
              break
            case 504:
              error.message = "网关超时"
              break
            case 505:
              error.message = "HTTP 版本不受支持"
              break
            default:
              break
          }
          ElMessage.error(error.message)
        }
        return Promise.reject(error)
      }
    )
  }

  // 请求方法
  request<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
    headers: any
  }> {
    return new Promise((resolve, reject) => {
      // 单独的请求拦截
      if (config.interceptorsToOnce?.requestInterceptor) {
        config = config.interceptorsToOnce.requestInterceptor(config)
      }

      this.instance
        .request(config)
        .then((res) => {
          // 单独的响应拦截
          if (config.interceptorsToOnce?.responseInterceptor) {
            res = config.interceptorsToOnce.responseInterceptor(res)
          }
          resolve(res.data)
        })
        .catch((error) => {
          reject(error.response ? error.response.data : error)
        })
    })
  }

  requestHader<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
    headers: any
  }> {
    return new Promise((resolve, reject) => {
      // 单独的请求拦截
      if (config.interceptorsToOnce?.requestInterceptor) {
        config = config.interceptorsToOnce.requestInterceptor(config)
      }

      this.instance
        .request(config)
        .then((res) => {
          // 单独的响应拦截
          if (config.interceptorsToOnce?.responseInterceptor) {
            res = config.interceptorsToOnce.responseInterceptor(res)
          }
          // 将 header 信息添加到返回的数据对象中
          const response = {
            code: res.data.code,
            data: res.data,
            message: res.data.message,
            headers: res.headers
          }
          resolve(response)
        })
        .catch((error) => {
          reject(error.response ? error.response.data : error)
        })
    })
  }

  get<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: "get" })
  }
  post<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: "post" })
  }
  delete<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: "delete" })
  }
  put<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: "put" })
  }
  patch<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: "patch" })
  }
}

export default HyRequest
