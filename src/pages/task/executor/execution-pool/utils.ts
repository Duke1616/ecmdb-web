import type { TenantSelectValue } from "./types"

export const normalizeTenantId = (value: TenantSelectValue) => {
  const tenantId = Number(value)
  return Number.isFinite(tenantId) && tenantId > 0 ? tenantId : undefined
}

export const isValidTenantId = (value: TenantSelectValue) => normalizeTenantId(value) !== undefined
