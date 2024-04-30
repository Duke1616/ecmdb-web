import { localCache } from "@/utils/cache"
import { BASE_URL, TIME_OUT } from "../config"
import HyRequest from "@/utils/request"

const hyRequest = new HyRequest({
  baseURL: BASE_URL,
  timeout: TIME_OUT,
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

export default hyRequest
