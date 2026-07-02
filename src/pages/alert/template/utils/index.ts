/**
 * 模板集合相关工具函数
 */

export const SYSTEM_TENANT_ID = 1
export const SYSTEM_RESOURCE_SCOPE = 2
export const SYSTEM_RESOURCE_READONLY_MESSAGE = "系统资源仅系统租户可修改"

interface TenantLike {
  id?: number | string | null
  name?: string | null
  code?: string | null
  domain?: string | null
}

const SYSTEM_TENANT_CODES = new Set(["system", "root", "system_root", "system-root"])
const SYSTEM_TENANT_NAMES = new Set(["系统根管理空间", "系统租户", "系统管理空间"])

export const isSystemTenant = (
  currentTenantId: number | string | null | undefined,
  currentTenant?: TenantLike | null
) => {
  const tenantId = Number(currentTenant?.id ?? currentTenantId)
  if (tenantId === SYSTEM_TENANT_ID) return true

  const code = currentTenant?.code?.trim().toLowerCase()
  const domain = currentTenant?.domain?.trim().toLowerCase()
  const name = currentTenant?.name?.trim()

  return Boolean(
    (code && SYSTEM_TENANT_CODES.has(code)) ||
      (domain && SYSTEM_TENANT_CODES.has(domain)) ||
      (name && SYSTEM_TENANT_NAMES.has(name))
  )
}

export const isReadonlySystemResource = (
  resource: { scope?: number | null } | null | undefined,
  currentTenantId: number | string | null | undefined,
  currentTenant?: TenantLike | null
) => Number(resource?.scope) === SYSTEM_RESOURCE_SCOPE && !isSystemTenant(currentTenantId, currentTenant)

/**
 * 格式化时间戳
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * 格式化 JSON 内容
 * @param content JSON 字符串
 * @returns 格式化后的 JSON 字符串
 */
export const formatJsonContent = (content: string): string => {
  try {
    const jsonObj = JSON.parse(content)
    return JSON.stringify(jsonObj, null, 2)
  } catch {
    return content
  }
}
