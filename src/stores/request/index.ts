import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { HYRequesInterceptors, HYRequestConfig } from './type'

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
      (config) => {
        // console.log('所有实例的响应拦截')
        return config
      },
      (error) => {
        // console.log('所有实例的响应失败拦截')
        return Promise.reject(error)
      }
    )
  }

  // 请求方法
  request<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return new Promise((resolve) => {
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
          // 返回结果
          resolve(res.data)
        })
        .catch((err) => {
          resolve(err.response ? err.response.data : err)
        })
    })
  }

  get<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: 'get' })
  }
  post<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: 'post' })
  }
  delete<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: 'delete' })
  }
  put<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: 'put' })
  }
  patch<T>(config: HYRequestConfig): Promise<{
    code: number
    data: T
    message: string
  }> {
    return this.request<T>({ ...config, method: 'patch' })
  }
}

export default HyRequest
