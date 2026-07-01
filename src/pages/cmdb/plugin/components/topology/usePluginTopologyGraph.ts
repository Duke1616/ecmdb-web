import { computed, type MaybeRefOrGetter, toValue } from "vue"
import type { RGJsonData } from "relation-graph-vue3"
import {
  PLUGIN_ACTION_PLACEMENT,
  PLUGIN_CARDINALITY,
  PLUGIN_DIRECTION,
  PLUGIN_RELATION_TYPE,
  PLUGIN_UI,
  type PluginBindingDetail,
  type PluginModelOption,
  type ActionSpec,
  type ResourceSpec
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

export const actionUiLabelMap: Record<string, string> = {
  [PLUGIN_UI.BuiltinTerminal]: "在线终端",
  [PLUGIN_UI.BuiltinSFTP]: "文件管理"
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

const buildLineText = (spec: ResourceSpec, isRoot = false) => {
  if (isRoot) {
    return spec.required ? "主资源输入" : "可选输入"
  }

  const relation = relationShortLabelMap[spec.relation_type || ""] || spec.relation_type || "关联"
  const cardinality = cardinalityLabelMap[spec.cardinality] || spec.cardinality
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

    let firstSpecNodeId = ""
    let firstActionNodeId = ""

    const walk = (spec: ResourceSpec, parentId: string, path: string, isRoot = false) => {
      const nodeId = `${binding.uid}:${path}`
      if (!firstSpecNodeId) {
        firstSpecNodeId = nodeId
      }

      const nodeData: TopologyNodeData = {
        kind: "spec",
        spec,
        path,
        model_uid: spec.model_uid,
        model_name: resolveModelName(spec.model_uid),
        subtitle: resolveModelName(spec.model_uid),
        icon: resolveModelIcon(spec.model_uid),
        cardinality: spec.cardinality,
        relation_type: spec.relation_type,
        direction: spec.direction
      }

      nodes.push({
        id: nodeId,
        text: spec.name,
        data: nodeData
      })
      nodeMap.set(nodeId, nodeData)

      lines.push({
        from: parentId,
        to: nodeId,
        text: buildLineText(spec, isRoot),
        color: isRoot ? "#38bdf8" : "#94a3b8",
        fontColor: isRoot ? "#0369a1" : "#64748b"
      })

      spec.children?.forEach((child) => {
        walk(child, nodeId, `${path}.${child.name}`)
      })
    }

    if (mode !== "action") {
      binding.specs.forEach((spec) => {
        if (spec.model_uid === binding.model_uid) {
          rootData.rootSpec = spec
          rootData.subtitle = spec.required ? "主资源输入" : spec.name
          spec.children?.forEach((child) => {
            walk(child, rootId, `${spec.name}.${child.name}`)
          })
          return
        }

        walk(spec, rootId, spec.name, true)
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
          subtitle: actionUiLabelMap[action.ui] || action.action,
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
      preferredNodeId: mode === "action" ? firstActionNodeId || rootId : firstSpecNodeId || rootId
    }
  })

  const graphData = computed(() => graphBundle.value.data)
  const selectedNodeData = computed(() => graphBundle.value.nodeMap.get(toValue(source.selectedNodeId)))
  const selectedSpecNode = computed(() => selectedNodeData.value?.spec || null)
  const selectedRootSpec = computed(() => selectedNodeData.value?.rootSpec || null)

  return {
    actionNodeCount: computed(() => {
      let count = 0
      graphBundle.value.nodeMap.forEach((node) => {
        if (node.kind === "action") count += 1
      })
      return count
    }),
    fieldEntries: computed(() => Object.entries(selectedSpecNode.value?.fields || {})),
    graphBundle,
    graphData,
    rootFieldEntries: computed(() => Object.entries(selectedRootSpec.value?.fields || {})),
    rootNodeId: computed(() => graphData.value.rootId || ""),
    selectedNodeData,
    selectedRootSpec,
    selectedSpecNode,
    specNodeCount: computed(() => Math.max(graphBundle.value.nodeMap.size - 1, 0)),
    resolveModelName
  }
}
