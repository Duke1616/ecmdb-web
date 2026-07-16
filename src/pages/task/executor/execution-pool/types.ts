import type {
  ExecutionPoolBindingStatus,
  ExecutionPoolDispatchMode,
  ExecutionPoolKind,
  ExecutionPoolStatus
} from "@/api/task/pool/type"

export type TenantSelectValue = number | string | undefined

export interface PoolHandler {
  name: string
  desc?: string
}

export interface PoolFilters {
  kind: ExecutionPoolKind
  dispatch_mode: ExecutionPoolDispatchMode | ""
  status: ExecutionPoolStatus | ""
}

export interface BindingFilters {
  tenant_id?: TenantSelectValue
  status: ExecutionPoolBindingStatus | ""
}

export interface BindForm {
  tenant_id?: TenantSelectValue
  pool_name: string
  handler_names: string[]
  desc: string
}
