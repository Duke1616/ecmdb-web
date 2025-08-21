import { localCache } from "@@/utils/cache"
import HyRequest from "@@/utils/request"

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  interceptors: {
    requestInterceptor: (config) => {
      const token = localCache.getCache("access_token")
      if (config.headers && token) {
        config.headers.Authorization = "Bearer " + localCache.getCache("access_token")
      }
      return config
    }
  }
})

export default instance
