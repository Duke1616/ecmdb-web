import { useUserStore } from "@/pinia/stores/user"
import HyRequest from "@@/utils/request"

export type ApiService = keyof typeof API_SERVICE
export const API_SERVICE = {
  CMDB: import.meta.env.VITE_ECMDB_API_PREFIX,
  ALERT: import.meta.env.VITE_ALERT_API_PREFIX
}

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  withCredentials: true,
  interceptors: {
    responseInterceptor: (response) => {
      const userStore = useUserStore()
      const token = response.headers?.["x-access-token"]
      if (token) {
        userStore.setToken(token)
      }
      return response
    }
  }
})

export default instance
