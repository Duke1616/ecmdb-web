import type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"

// 拦截器接口
export interface HYRequesInterceptors {
  // 请求
  requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  requestInterceptorCath?: (error: any) => any
  // 响应
  responseInterceptor?: (res: AxiosResponse) => AxiosResponse
  responseInterceptorCath?: (error: any) => any
}

// 单独的拦截器接口
export interface HYRequesInterceptorsToOnce {
  // 请求
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig
  // requestInterceptorCath?: (error: any) => any
  // 响应
  responseInterceptor?: (res: AxiosResponse) => AxiosResponse
  // responseInterceptorCath?: (error: any) => any
}

// 配置接口
export interface HYRequestConfig extends AxiosRequestConfig {
  /** 指定本次请求的执行租户，由公共拦截器转换为 X-Active-Tenant-ID。 */
  activeTenantId?: number
  interceptors?: HYRequesInterceptors
  interceptorsToOnce?: HYRequesInterceptorsToOnce
}
