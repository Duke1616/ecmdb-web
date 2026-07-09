import { computed, type MaybeRefOrGetter, toValue } from "vue"
import type { RGJsonData } from "relation-graph-vue3"
import {
  PLUGIN_ACTION_PLACEMENT,
  PLUGIN_CARDINALITY,
  PLUGIN_DIRECTION,
  PLUGIN_RELATION_TYPE,
  type ActionSpec,
  type BindingGraphEdge,
  type BindingGraphNode,
  type PluginBindingDetail,
  type PluginModelOption
} from "@/api/cmdb/plugin/types/plugin"
import type { TopologyMode, TopologyNodeData } from "./types"

export const directionLabelMap: Record<string, string> = {
  [PLUGIN_DIRECTION.Source]: "源端关联",
  [PLUGIN_DIRECTION.Target]: "目标端关联"
}

export const relationLabelMap: Record<string, string> = {
  [PLUGIN_RELATION_TYPE.Default]: "默认关系",
  [PLUGIN_RELATION_TYPE.Group]: "分组关系",
  [PLUGIN_RELATION_TYPE.Belong]: "归属关系",
  [PLUGIN_RELATION_TYPE.Run]: "运行关系"
}

const relationShortLabelMap: Record<string, string> = {
  [PLUGIN_RELATION_TYPE.Default]: "默认",
  [PLUGIN_RELATION_TYPE.Group]: "分组",
  [PLUGIN_RELATION_TYPE.Belong]: "归属",
  [PLUGIN_RELATION_TYPE.Run]: "运行"
}

export const cardinalityLabelMap: Record<string, string> = {
  [PLUGIN_CARDINALITY.One]: "单个",
  [PLUGIN_CARDINALITY.Many]: "多个"
}

export const actionPlacementLabelMap: Record<string, string> = {
  [PLUGIN_ACTION_PLACEMENT.ResourceDetailActions]: "资源详情动作"
}

const resolveActionIcon = (icon?: string) => {
  const normalized = String(icon || "")
    .trim()
    .toLowerCase()

  if (normalized === "terminal") return "fa-terminal"
  if (normalized === "folder") return "Folder"
  if (normalized === "connection") return "Connection"
  return icon || "Box"
}

const buildNodeLineText = (node: BindingGraphNode, edge?: BindingGraphEdge, isRoot = false) => {
  if (isRoot) {
    return node.required ? "主资源输入" : "可选输入"
  }

  const relation = relationShortLabelMap[edge?.relation_type || ""] || edge?.relation_type || "关联"
  const cardinality = cardinalityLabelMap[node.cardinality] || node.cardinality
  return [relation, cardinality].filter(Boolean).join(" · ")
}

export const usePluginTopologyGraph = (source: {
  binding: MaybeRefOrGetter<PluginBindingDetail | null>
  models: MaybeRefOrGetter<PluginModelOption[] | undefined>
  actions: MaybeRefOrGetter<ActionSpec[] | undefined>
  mode: MaybeRefOrGetter<TopologyMode | undefined>
  selectedNodeId: MaybeRefOrGetter<string>
}) => {
  const modelMap = computed(() => {
    const binding = toValue(source.binding)
    const map = new Map<string, PluginModelOption | { uid: string; name: string; icon?: string }>()

    for (const item of toValue(source.models) || []) {
      map.set(item.uid, item)
    }

    if (binding?.model_uid) {
      map.set(binding.model_uid, {
        uid: binding.model_uid,
        name: binding.model_name || binding.model_uid,
        icon: binding.model_icon
      })
    }

    return map
  })

  const resolveModelName = (modelUid?: string) => {
    if (!modelUid) return "-"
    return modelMap.value.get(modelUid)?.name || modelUid
  }

  const resolveModelIcon = (modelUid?: string) => {
    if (!modelUid) return "Box"
    return modelMap.value.get(modelUid)?.icon || "Box"
  }

  const graphBundle = computed(() => {
    const binding = toValue(source.binding)
    const mode = toValue(source.mode)
    const nodes: RGJsonData["nodes"] = []
    const lines: RGJsonData["lines"] = []
    const nodeMap = new Map<string, TopologyNodeData>()

    if (!binding) {
      return {
        data: { rootId: "", nodes: [], lines: [] } as RGJsonData,
        nodeMap,
        preferredNodeId: ""
      }
    }

    const rootId = `binding:${binding.uid}`
    const rootData: TopologyNodeData = {
      kind: "binding",
      model_uid: binding.model_uid,
      model_name: binding.model_name || binding.model_uid,
      icon: binding.model_icon || resolveModelIcon(binding.model_uid)
    }

    nodes.push({
      id: rootId,
      text: binding.model_name || binding.model_uid,
      data: rootData
    })
    nodeMap.set(rootId, rootData)

    let firstResourceNodeId = ""
    let firstActionNodeId = ""

    const graph = binding.graph
    const entryNode = graph?.nodes?.find((node) => node.id === graph.entry_node_id)
    if (entryNode) {
      rootData.rootGraphNode = entryNode
      rootData.subtitle = entryNode.required ? "主资源输入" : entryNode.name
    }

    const walkGraph = (
      node: BindingGraphNode,
      edge: BindingGraphEdge | undefined,
      parentId: string,
      isRoot = false
    ) => {
      const nodeId = `${binding.uid}:${node.id}`
      if (!firstResourceNodeId) {
        firstResourceNodeId = nodeId
      }

      const nodeData: TopologyNodeData = {
        kind: "spec",
        graphNode: node,
        relationEdge: edge,
        model_uid: node.model_uid,
        model_name: resolveModelName(node.model_uid),
        subtitle: resolveModelName(node.model_uid),
        icon: resolveModelIcon(node.model_uid),
        cardinality: node.cardinality,
        relation_type: edge?.relation_type,
        direction: edge?.direction
      }

      nodes.push({
        id: nodeId,
        text: node.name,
        data: nodeData
      })
      nodeMap.set(nodeId, nodeData)

      lines.push({
        from: parentId,
        to: nodeId,
        text: buildNodeLineText(node, edge, isRoot),
        color: isRoot ? "#38bdf8" : "#94a3b8",
        fontColor: isRoot ? "#0369a1" : "#64748b"
      })

      const childEdges = graph?.edges?.filter((item) => item.from === node.id) || []
      childEdges.forEach((childEdge) => {
        const childNode = graph?.nodes?.find((item) => item.id === childEdge.to)
        if (!childNode) return
        walkGraph(childNode, childEdge, nodeId)
      })
    }

    if (mode !== "action") {
      const childEdges = graph?.edges?.filter((item) => item.from === entryNode?.id) || []
      childEdges.forEach((childEdge) => {
        const childNode = graph?.nodes?.find((item) => item.id === childEdge.to)
        if (!childNode) return
        walkGraph(childNode, childEdge, rootId, true)
      })
    }

    if (mode !== "binding") {
      ;(toValue(source.actions) || []).forEach((action) => {
        const actionId = `action:${binding.uid}:${action.action}`
        if (!firstActionNodeId) {
          firstActionNodeId = actionId
        }

        const actionData: TopologyNodeData = {
          kind: "action",
          action,
          model_uid: binding.model_uid,
          model_name: action.name,
          subtitle: action.permission || action.action,
          icon: resolveActionIcon(action.icon)
        }

        nodes.push({
          id: actionId,
          text: action.name,
          data: actionData
        })
        nodeMap.set(actionId, actionData)

        lines.push({
          from: rootId,
          to: actionId,
          text: "动作",
          color: "#a78bfa",
          fontColor: "#7c3aed"
        })
      })
    }

    return {
      data: {
        rootId,
        nodes,
        lines
      } as RGJsonData,
      nodeMap,
      preferredNodeId: mode === "action" ? firstActionNodeId || rootId : firstResourceNodeId || rootId
    }
  })

  const graphData = computed(() => graphBundle.value.data)
  const selectedNodeData = computed(() => graphBundle.value.nodeMap.get(toValue(source.selectedNodeId)))
  const selectedGraphNode = computed(() => selectedNodeData.value?.graphNode || null)
  const selectedRootGraphNode = computed(() => selectedNodeData.value?.rootGraphNode || null)

  return {
    actionNodeCount: computed(() => {
      let count = 0
      graphBundle.value.nodeMap.forEach((node) => {
        if (node.kind === "action") count += 1
      })
      return count
    }),
    fieldEntries: computed(() =>
      (selectedGraphNode.value?.field_mappings || []).map(
        (mapping) => [mapping.input, mapping.resource_field] as [string, string]
      )
    ),
    graphBundle,
    graphData,
    rootFieldEntries: computed(() =>
      (selectedRootGraphNode.value?.field_mappings || []).map(
        (mapping) => [mapping.input, mapping.resource_field] as [string, string]
      )
    ),
    rootNodeId: computed(() => graphData.value.rootId || ""),
    selectedNodeData,
    selectedGraphNode,
    selectedRootGraphNode,
    specNodeCount: computed(() => Math.max(graphBundle.value.nodeMap.size - 1, 0)),
    resolveModelName
  }
}
