import { ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import HyRequest from "@@/utils/request"

export type ApiService = keyof typeof API_SERVICE
export const API_SERVICE = {
  CMDB: import.meta.env.VITE_ECMDB_API_PREFIX,
  TASK: import.meta.env.VITE_TASK_API_PREFIX,
  IAM: import.meta.env.VITE_IAM_API_PREFIX,
  ALERT: import.meta.env.VITE_ALERT_API_PREFIX,
  TICKET: import.meta.env.VITE_TICKET_API_PREFIX
}

export interface TenantScopeItem {
  scopeId: symbol
  tenantId: number
}

// 活跃租户作用域上下文栈，支持 useTenantScope 的临时交互作用域隔离
export const activeTenantStack = ref<TenantScopeItem[]>([])

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  withCredentials: true,
  interceptors: {
    requestInterceptor: (config) => {
      // 1. 如果请求配置中本身已显式声明了 X-Active-Tenant-ID 头部，则予以尊重，不予覆盖
      config.headers = config.headers || {}
      if (config.headers["X-Active-Tenant-ID"] !== undefined) {
        return config
      }

      // 2. 自上而下自动感知：声明式上下文栈 (at(-1) 栈顶) -> Pinia 全局选择的租户空间
      const targetTenantId = activeTenantStack.value.at(-1)?.tenantId ?? useUserStore().currentTenantId

      if (targetTenantId) {
        config.headers["X-Active-Tenant-ID"] = String(targetTenantId)
      }

      return config
    },
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
