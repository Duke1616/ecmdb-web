import type { ActionSpec, BindingGraphEdge, BindingGraphNode } from "@/api/cmdb/plugin/types/plugin"

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
  subtitle?: string
  graphNode?: BindingGraphNode
  relationEdge?: BindingGraphEdge
  action?: ActionSpec
  rootGraphNode?: BindingGraphNode
}

export type TopologyNodeCommand = "detail" | "edit" | "focus-root" | "fit"
