import axios from "axios"
import type { AxiosInstance } from "axios"
import type { HYRequesInterceptors, HYRequestConfig } from "./type"
import { ElMessage } from "element-plus"
import { get } from "lodash-es"
import { useUserStoreHook } from "@/pinia/stores/user"

// 退出登录并重定向到登录页
let isLoggingOut = false
async function logout() {
  if (isLoggingOut) return
  isLoggingOut = true
  useUserStoreHook().logout()

  // 重定向到登录页，而不是刷新整个页面
  window.location.href = "/login"
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
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    // 所有实例的响应拦截
    this.instance.interceptors.response.use(
      (response) => {
        const apiData = response.data
        const responseType = response.request?.responseType
        if (responseType === "blob" || responseType === "arraybuffer") return apiData

        const code = apiData.code
        if (code === undefined) {
          // ElMessage.error("非本系统的接口")
          // return Promise.reject(new Error("非本系统的接口"))
          return response
        }
        switch (code) {
          case 0:
            return response
          default:
            ElMessage.error(apiData.msg || "Error")
            return Promise.reject(apiData)
        }
      },
      (error) => {
        if (!error.response) {
          ElMessage.error("网络连接失败，请检查网络设置")
          return Promise.reject(error)
        }

        const message = get(error, "response.data.msg")
        if (message) {
          ElMessage.error(message)
        } else {
          const status = get(error, "response.status")
          switch (status) {
            case 400:
              error.message = "请求错误"
              break
            case 401:
              error.message = "认证拒绝"
              logout()
              break
            case 403:
              error.message = "拒绝访问"
              break
            case 404:
              error.message = "请求地址出错"
              break
            case 500:
              error.message = "服务器内部错误"
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
          if (config.responseType === "blob" || config.responseType === "arraybuffer") {
            resolve(res as any)
          } else {
            resolve(res.data)
          }
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
