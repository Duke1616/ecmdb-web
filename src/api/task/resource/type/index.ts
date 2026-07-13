export enum ResourceKind {
  Executor = "EXECUTOR",
  Agent = "AGENT"
}

export enum ResourceMode {
  Pull = "PULL",
  Push = "PUSH",
  MQ = "MQ"
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
  mode?: ResourceMode | ""
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
  mode?: ResourceMode.Pull | ResourceMode.Push
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
