import { setToken } from "@@/utils/cache/cookies"
import HyRequest from "@@/utils/request"

export type ApiService = keyof typeof API_SERVICE
export const API_SERVICE = {
  CMDB: import.meta.env.VITE_ECMDB_API_PREFIX,
  ALERT: import.meta.env.VITE_ALERT_API_PREFIX
}

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  interceptors: {
    // requestInterceptor: (config) => {
    //   const token = localCache.getCache("access_token")
    //   if (config.headers && token) {
    //     config.headers.Authorization = "Bearer " + localCache.getCache("access_token")
    //   }
    //   return config
    // }
    responseInterceptor: (response) => {
      const token = response.headers?.["x-access-token"] || response.headers?.["X-Access-Token"]
      if (token) {
        setToken(token)
      }
      return response
    }
  }
})

export default instance
