import { setToken } from "@@/utils/cache/cookies"
import HyRequest from "@@/utils/request"

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
