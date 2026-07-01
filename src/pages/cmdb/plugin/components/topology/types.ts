import type { ActionSpec, ResourceSpec } from "@/api/cmdb/plugin/types/plugin"

export type TopologyMode = "binding" | "action"

export type TopologyNodeKind = "binding" | "spec" | "action"

export type TopologyNodeData = {
  kind: TopologyNodeKind
  icon?: string
  model_uid: string
  model_name: string
  cardinality?: string
  relation_type?: string
  direction?: string
  path?: string
  subtitle?: string
  spec?: ResourceSpec
  action?: ActionSpec
  rootSpec?: ResourceSpec
}

export type TopologyNodeCommand = "detail" | "focus-root" | "fit"
