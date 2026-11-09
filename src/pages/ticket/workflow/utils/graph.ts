import { getNodeConfig } from "@@/components/workflow/RegisterNode/index"
import { isGatewayType } from "@@/components/workflow/RegisterNode/gateway/constants"

/**
 * 节点类型友好中文映射表
 */
export const NODE_TYPE_LABELS: Record<string, string> = {
  start: "开始",
  end: "结束",
  condition: "排他网关",
  parallel: "并行网关",
  selective: "条件网关",
  inclusion: "包容网关",
  user: "人工审批",
  automation: "自动化任务",
  chat: "群聊推送"
}

/**
 * 获取节点类型的中文可读标签
 */
export const getNodeTypeLabel = (type: string): string => {
  return NODE_TYPE_LABELS[type] || getNodeConfig(type)?.text || type || "未知节点"
}

/**
 * 统一提取节点的显示名称
 * 规避 LogicFlow 中 text 既可能是 string 又可能是 { x, y, value } 对象的格式碎片
 * @param node 节点数据
 */
export const getNodeDisplayName = (node?: any): string => {
  if (!node) return "未知节点"
  if (node.properties?.name && String(node.properties.name).trim()) {
    return String(node.properties.name).trim()
  }
  if (typeof node.text === "string" && node.text.trim()) {
    return node.text.trim()
  }
  if (typeof node.text === "object" && node.text?.value && String(node.text.value).trim()) {
    return String(node.text.value).trim()
  }
  return getNodeTypeLabel(node.type)
}

/**
 * 统一提取连线的分支名称
 * @param edge 连线数据
 */
export const getEdgeDisplayName = (edge?: any): string => {
  if (!edge) return ""
  if (edge.properties?.name && String(edge.properties.name).trim()) {
    return String(edge.properties.name).trim()
  }
  if (typeof edge.text === "string" && edge.text.trim()) {
    return edge.text.trim()
  }
  if (typeof edge.text === "object" && edge.text?.value && String(edge.text.value).trim()) {
    return String(edge.text.value).trim()
  }
  return ""
}

/**
 * 深度清洗工作流图数据
 * 剔除前端画布预览使用的内部临时属性（如 isDebug），保证持久化数据纯净
 * @param graphData 原始图数据
 */
export const cleanGraphData = <T = any>(graphData: T): T => {
  if (!graphData) return graphData
  const data = JSON.parse(JSON.stringify(graphData))

  data.nodes?.forEach((node: any) => {
    if (node.properties?.isDebug !== undefined) {
      delete node.properties.isDebug
    }
  })

  data.edges?.forEach((edge: any) => {
    if (edge.properties?.isDebug !== undefined) {
      delete edge.properties.isDebug
    }
  })

  return data
}

export interface WorkflowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 校验工作流图的完整性与合法性（Workflow Linter）
 * 检查项包括：
 * 1. 是否具备开始与结束节点
 * 2. 是否存在孤立未连线节点
 * 3. 是否存在无流出连线的中间节点
 * 4. 网关节点分支规则是否满足
 * @param graphData 图数据
 */
export const validateWorkflowGraph = (graphData?: any): WorkflowValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  const nodes: any[] = Array.isArray(graphData?.nodes) ? graphData.nodes : []
  const edges: any[] = Array.isArray(graphData?.edges) ? graphData.edges : []

  if (nodes.length === 0) {
    errors.push("画布为空，请添加节点后继续")
    return { valid: false, errors, warnings }
  }

  const startNodes = nodes.filter((n) => n.type === "start")
  const endNodes = nodes.filter((n) => n.type === "end")

  if (startNodes.length === 0) {
    errors.push("流程缺少【开始节点】作为触发入口")
  } else if (startNodes.length > 1) {
    warnings.push("流程包含多个【开始节点】，建议收敛为单一触发源")
  }

  if (endNodes.length === 0) {
    errors.push("流程缺少【结束节点】作为归档终点")
  }

  // 检查孤立节点
  nodes.forEach((node) => {
    const nodeName = getNodeDisplayName(node)
    const inCount = edges.filter((e) => e.targetNodeId === node.id).length
    const outCount = edges.filter((e) => e.sourceNodeId === node.id).length

    if (inCount === 0 && outCount === 0) {
      warnings.push(`节点「${nodeName}」处于悬空孤立状态，未连入任何流转`)
    } else if (inCount === 0 && node.type !== "start") {
      warnings.push(`节点「${nodeName}」缺少前驱连入来源`)
    } else if (outCount === 0 && node.type !== "end") {
      warnings.push(`节点「${nodeName}」缺少后续流转出口`)
    }

    // 网关节点分支合理性检查
    if (isGatewayType(node.type)) {
      const isMergeGateway = inCount >= 2 // 汇聚网关 (多进一出或多进多出)
      const isForkGateway = outCount >= 2 // 分流网关 (一进多出)

      // 仅当网关既非多路汇聚，又非多路分流时提示检查
      if (!isMergeGateway && !isForkGateway) {
        warnings.push(`网关「${nodeName}」既未聚合多路输入，也未分流多个输出，建议检查分支走向`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
