import { localCache } from "@@/utils/cache"
import HyRequest from "@@/utils/request"

const instanceRefersh = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  interceptors: {
    requestInterceptor: (config) => {
      const token = localCache.getCache("refresh_token")
      if (config.headers && token) {
        config.headers.Authorization = "Bearer " + localCache.getCache("refresh_token")
      }
      return config
    }
  }
})

export default instanceRefersh
