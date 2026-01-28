import { v4 as uuidv4 } from "uuid"

/**
 * 刷新 LogicFlow 图数据 ID
 * 用于克隆流程时，重新生成所有节点和连线的 ID，避免 ID 冲突
 * @param graphData 原始图数据
 * @returns 刷新 ID 后的新图数据
 */
export const refreshGraphId = (graphData: any) => {
  if (!graphData) return graphData

  // 深拷贝数据，避免修改原对象
  const clonedGraph = JSON.parse(JSON.stringify(graphData))
  const { nodes = [], edges = [] } = clonedGraph
  const idMap = new Map<string, string>()

  // 1. 重生成节点 ID
  if (Array.isArray(nodes)) {
    clonedGraph.nodes = nodes.map((node: any) => {
      const oldId = node.id
      const newId = uuidv4()
      idMap.set(oldId, newId)

      // 更新节点 ID
      const newNode = { ...node, id: newId }

      // 如果节点包含 text 对象且 text.id 存在，通常 LF 会自动处理，
      // 但为了保险，我们可以根据 LF 的习惯，如果 textId 与 nodeId 相同或者是其衍生，
      // 这里暂时只处理 node.id。LogicFlow 渲染时会自动修正 text 关联。

      return newNode
    })
  }

  // 2. 更新连线 ID 和 source/target
  if (Array.isArray(edges)) {
    clonedGraph.edges = edges.map((edge: any) => {
      // 检查 source 和 target 是否在 idMap 中（即是否是本次克隆的节点）
      // 如果不在（可能是跨图引用或其他情况），则保持原样，但在克隆场景下通常都在
      const newSourceId = idMap.get(edge.sourceNodeId) || edge.sourceNodeId
      const newTargetId = idMap.get(edge.targetNodeId) || edge.targetNodeId

      return {
        ...edge,
        id: uuidv4(),
        sourceNodeId: newSourceId,
        targetNodeId: newTargetId
      }
    })
  }

  return clonedGraph
}
