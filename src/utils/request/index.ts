import axios from "axios"
import type { AxiosInstance } from "axios"
import type { HYRequesInterceptors, HYRequestConfig } from "./type"
import { ElMessage } from "element-plus"
import { get } from "lodash-es"

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
          case 401:
            // Token 过期时
            return response
          default:
            // 不是正确的 code
            ElMessage.error(apiData.msg || "Error")
            return Promise.reject(new Error("Error"))
        }
      },
      (error) => {
        const message = get(error, "response.data.msg")
        ElMessage.error(message)
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
