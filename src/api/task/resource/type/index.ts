export enum ResourceKind {
  Executor = "EXECUTOR",
  Agent = "AGENT"
}

/** 资源池使用的任务传输通道。 */
export enum ResourceTransport {
  GRPC = "GRPC",
  MQ = "MQ"
}

/** Executor 资源池声明的任务派发方式。 */
export enum ResourceDispatchMode {
  Pull = "PULL",
  Push = "PUSH"
}

export enum ResourceIsolation {
  Shared = "SHARED",
  Dedicated = "DEDICATED"
}

export interface BindingOption {
  component: string
  config: Record<string, string>
  placeholder: string
  label: string
}

export interface Parameter {
  key: string
  desc: string
  secret?: boolean
  required: boolean
  bindings: Record<string, BindingOption>
  default: string
}

export interface HandlerDetail {
  name: string
  desc: string
  metadata?: Parameter[]
}

export interface NodeDetail {
  id: string
  address: string
}

export interface Resource {
  name: string
  desc: string
  kind: ResourceKind
  transport: ResourceTransport
  dispatch_mode: ResourceDispatchMode
  isolation_level: ResourceIsolation
  topic?: string
  handlers: HandlerDetail[]
  nodes: NodeDetail[]
}

export interface Executor {
  name: string
  desc: string
  handlers: HandlerDetail[]
  nodes: NodeDetail[]
  dispatch_mode: ResourceDispatchMode
}

export interface ListResourcesReq {
  offset?: number
  limit?: number
  keyword?: string
  kind?: ResourceKind
}

export interface ListResourcesResp {
  resources: Resource[]
  total: number
}
