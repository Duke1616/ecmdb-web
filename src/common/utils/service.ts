import { ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import HyRequest from "@@/utils/request"
import { acceptCredentialResponse, getAccessToken, shouldUseBearerCredential } from "@/common/auth/credential"

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

function isSessionEstablishingRequest(url?: string) {
  return Boolean(
    url &&
      /\/user\/(?:system|ldap)\/login(?:[?#].*)?$|\/user\/login\/mfa\/verify(?:[?#].*)?$|\/user\/bind\/confirm(?:[?#].*)?$|\/user\/passkey\/login\/finish(?:[?#].*)?$|\/user\/oidc\/callback(?:[?#].*)?$/.test(
        url
      )
  )
}

const instance = new HyRequest({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000,
  withCredentials: true,
  interceptors: {
    requestInterceptor: (config) => {
      // 1. 仅当后端声明 token 载体时发送 Bearer；显式 Authorization 不覆盖。
      config.headers = config.headers || {}

      if (shouldUseBearerCredential() && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${getAccessToken()}`
      }

      // 2. 如果请求配置中本身已显式声明了 X-Active-Tenant-ID 头部，则予以尊重，不予覆盖
      if (config.headers["X-Active-Tenant-ID"] !== undefined) {
        return config
      }

      // 3. 自上而下自动感知：声明式上下文栈 (at(-1) 栈顶) -> Pinia 全局选择的租户空间
      const targetTenantId = activeTenantStack.value.at(-1)?.tenantId ?? useUserStore().currentTenantId

      if (targetTenantId) {
        config.headers["X-Active-Tenant-ID"] = String(targetTenantId)
      }

      return config
    },
    responseInterceptor: (response) => {
      acceptCredentialResponse(
        response.headers as Record<string, unknown>,
        isSessionEstablishingRequest(response.config.url)
      )
      return response
    }
  }
})

export default instance
