import { type App } from "vue"
import formCreate from "@form-create/element-ui"
import FcDesigner from "@form-create/designer"
import type { FetchOption } from "@form-create/core"
import { getAccessToken } from "@/common/auth/credential"
import { activeTenantHeaders, authHeaders, getActiveTenantId } from "@/common/utils/service"

/**
 * 从 document.cookie 读取指定名称的 Cookie 值
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function loadFromCreate(app: App) {
  // NOTE: 全局拦截 formCreate.fetch 远程数据加载，对齐项目的身份认证与多租户请求规范
  const globalFetch = formCreate.fetch
  formCreate.fetch = (option: FetchOption, effectArgs: Object = {}) => {
    // 确保 headers 对象存在
    if (!option.headers) {
      option.headers = {}
    }

    // 1. 注入多租户请求头与全局标准认证头
    Object.assign(option.headers, {
      ...authHeaders(),
      ...activeTenantHeaders(getActiveTenantId())
    })

    // 2. 跨微服务凭据兜底（通过 Header 传递，避免开启 withCredentials 触发严格 CORS 限制）：
    // 若未注入 Authorization，优先从 AccessToken 或本地 Cookie 提取 Token 注入 Header
    const headersRecord = option.headers as Record<string, string>
    if (!headersRecord.Authorization) {
      const fallbackToken = getAccessToken() || getCookie("ecmdb-token-key") || getCookie("eiam-token")
      if (fallbackToken) {
        headersRecord.Authorization = `Bearer ${fallbackToken}`
      }
    }

    // 调用原始的 fetch 方法
    return globalFetch(option, effectArgs)
  }

  app.use(formCreate)
  app.use(FcDesigner)
}
