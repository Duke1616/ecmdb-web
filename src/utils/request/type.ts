import type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

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
  interceptors?: HYRequesInterceptors
  interceptorsToOnce?: HYRequesInterceptorsToOnce
}
