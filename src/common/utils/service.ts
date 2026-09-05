import { ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import HyRequest from "@@/utils/request"
import type { HYRequestConfig } from "@/common/utils/request/type"
import {
  acceptCredentialResponse,
  clearCredential,
  authHeaders,
  getAccessToken,
  shouldUseBearerCredential
} from "@/common/auth/credential"

export { authHeaders }

export type ApiService = keyof typeof API_SERVICE
export const API_SERVICE = {
  CMDB: import.meta.env.VITE_ECMDB_API_PREFIX,
  TASK: import.meta.env.VITE_TASK_API_PREFIX,
  IAM: import.meta.env.VITE_IAM_API_PREFIX,
  ALERT: import.meta.env.VITE_ALERT_API_PREFIX,
  TICKET: import.meta.env.VITE_TICKET_API_PREFIX
}

/** 激活租户请求头名称，由 eiam 中间件统一解析。 */
export const ACTIVE_TENANT_HEADER = "X-Active-Tenant-ID"

export interface TenantScopeItem {
  scopeId: symbol
  tenantId: number
}

// 活跃租户作用域上下文栈，支持 useTenantScope 的临时交互作用域隔离
export const activeTenantStack = ref<TenantScopeItem[]>([])

/** 按统一优先级获取当前请求应使用的租户。 */
export function getActiveTenantId(): number | undefined {
  const tenantId = activeTenantStack.value.at(-1)?.tenantId ?? useUserStore().currentTenantId
  return tenantId || undefined
}

/** 为非 Axios 请求（例如 SSE）构造租户请求头。 */
export function activeTenantHeaders(tenantId?: number): Record<string, string> {
  return tenantId === undefined ? {} : { [ACTIVE_TENANT_HEADER]: String(tenantId) }
}

/** 构造指定执行租户的请求选项，避免业务 API 直接操作 Header。 */
export function withActiveTenant(tenantId?: number): Pick<HYRequestConfig, "activeTenantId"> {
  return tenantId === undefined ? {} : { activeTenantId: tenantId }
}

function isSessionEstablishingRequest(url?: string) {
  return Boolean(
    url &&
      /\/user\/(?:system|ldap)\/login(?:[?#].*)?$|\/user\/login\/mfa\/verify(?:[?#].*)?$|\/user\/bind\/confirm(?:[?#].*)?$|\/user\/passkey\/login\/finish(?:[?#].*)?$|\/user\/oidc\/callback(?:[?#].*)?$|\/tenant\/switch(?:[?#].*)?$/.test(
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

      // 2. 业务可以通过 activeTenantId 指定本次请求的执行租户，公共层统一转换为 Header。
      const tenantAwareConfig = config as typeof config & { activeTenantId?: number }
      const requestedTenantId = tenantAwareConfig.activeTenantId
      delete tenantAwareConfig.activeTenantId

      // 3. 如果请求配置中本身已显式声明了 X-Active-Tenant-ID 头部，则予以尊重，不予覆盖。
      if (config.headers[ACTIVE_TENANT_HEADER] !== undefined) {
        return config
      }

      // 4. 自上而下自动感知：显式请求租户 -> 声明式上下文栈 -> Pinia 全局选择的租户空间。
      const targetTenantId = requestedTenantId ?? getActiveTenantId()

      if (targetTenantId) {
        config.headers[ACTIVE_TENANT_HEADER] = String(targetTenantId)
      }

      return config
    },
    responseInterceptor: (response) => {
      const data = response.data?.data
      // 核心安全防线：无论是 MFA 挑战 还是 待选租户，均属于未决状态，绝不标记会话建立！
      const isPendingAuth = Boolean(data?.mfa_required || data?.must_select_tenant)

      const isEstablished = isSessionEstablishingRequest(response.config.url) && !isPendingAuth
      acceptCredentialResponse(
        response.headers as Record<string, unknown>,
        isEstablished
      )
      return response
    }
  }
})

export default instance
