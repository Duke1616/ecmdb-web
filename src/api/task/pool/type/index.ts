export enum ExecutionPoolKind {
  Executor = "EXECUTOR",
  Agent = "AGENT"
}

export enum ExecutionPoolMode {
  Push = "PUSH",
  Pull = "PULL",
  MQ = "MQ"
}

export enum ExecutionPoolStatus {
  Enabled = "ENABLED",
  Disabled = "DISABLED"
}

export enum ExecutionPoolBindingStatus {
  Enabled = "ENABLED",
  Disabled = "DISABLED"
}

export interface ExecutionPool {
  id: number
  name: string
  kind: ExecutionPoolKind
  mode: ExecutionPoolMode
  isolation_level: string
  desc: string
  status: ExecutionPoolStatus
  metadata: Record<string, string>
  ctime: number
  utime: number
}

export interface ExecutionPoolBinding {
  id: number
  tenant_id: number
  pool_name: string
  handler_name: string
  status: ExecutionPoolBindingStatus
  desc: string
  ctime: number
  utime: number
}

export interface ListPoolsReq {
  offset?: number
  limit?: number
  keyword?: string
  kind?: ExecutionPoolKind | ""
  mode?: ExecutionPoolMode | ""
  status?: ExecutionPoolStatus | ""
}

export interface ListPoolsResp {
  total: number
  pools: ExecutionPool[]
}

export interface ListBindingsReq {
  tenant_id?: number
  pool_name?: string
  status?: ExecutionPoolBindingStatus | ""
}

export interface ListBindingsResp {
  bindings: ExecutionPoolBinding[]
}

export interface BindPoolReq {
  tenant_id: number
  pool_name: string
  handler_name?: string
  handler_names?: string[]
  desc?: string
}

export interface BindingKeyReq {
  tenant_id: number
  pool_name: string
  handler_name: string
}
