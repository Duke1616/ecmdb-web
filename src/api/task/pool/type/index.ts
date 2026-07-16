export enum ExecutionPoolKind {
  Executor = "EXECUTOR",
  Agent = "AGENT"
}

/** 执行资源池使用的任务传输通道。 */
export enum ExecutionPoolTransport {
  GRPC = "GRPC",
  MQ = "MQ"
}

/** Executor 资源池的任务派发方式。 */
export enum ExecutionPoolDispatchMode {
  Push = "PUSH",
  Pull = "PULL"
}

export enum ExecutionPoolStatus {
  Enabled = "ENABLED",
  Disabled = "DISABLED"
}

export enum ExecutionPoolIsolation {
  Shared = "SHARED",
  Dedicated = "DEDICATED"
}

export enum ExecutionPoolBindingStatus {
  Enabled = "ENABLED",
  Disabled = "DISABLED"
}

export interface ExecutionPool {
  id: number
  name: string
  kind: ExecutionPoolKind
  transport: ExecutionPoolTransport
  dispatch_mode: ExecutionPoolDispatchMode
  isolation_level: ExecutionPoolIsolation
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
  transport?: ExecutionPoolTransport | ""
  dispatch_mode?: ExecutionPoolDispatchMode | ""
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
