import { localCache } from '@/utils/cache'
import { BASE_URL, TIME_OUT } from '../config'
import HyRequest from '@/utils/request'
import { LOGIN_TOKEN } from '@/global/constants'

const hyRequest = new HyRequest({
  baseURL: BASE_URL,
  timeout: TIME_OUT,
  interceptors: {
    requestInterceptor: (config) => {
      const token = localCache.getCache(LOGIN_TOKEN)
      if (config.headers && token) {
        config.headers.Authorization = 'Bearer ' + localCache.getCache(LOGIN_TOKEN)
      }
      return config
    }
  }
})

export default hyRequest
