import { type Ref } from "vue"
import { ElNotification, ElMessage } from "element-plus"
import { isGatewayType } from "@@/components/workflow/RegisterNode/gateway/constants"

export interface WorkflowLayoutOptions {
  nodesep?: number
  ranksep?: number
  rankdir?: "LR" | "TB"
  align?: "UL" | "UR" | "DL" | "DR" | undefined
  showNotification?: boolean
}

/**
 * 增强 Dagre 插件的折线路径计算能力
 * 解决原生 Dagre 在多路分支汇聚时（如多个并行分支汇入网关或结束节点），
 * 传统折线算法导致的“迎面相撞合流”或“插在菱形斜边”的严重美学缺陷。
 *
 * 核心优化策略：
 * 1. 【BPMN 国际规范网关四向顶点汇聚】：当汇流目标是菱形网关时，上方分支直角扎入【北顶点(上)】，
 *    下方分支直角扎入【南顶点(下)】，中间分支平直扎入【西顶点(左)】，四向受力对称工整；
 * 2. 【多轨平行避让】：当目标为任务或结束节点时，分配独立垂直入靶高度与错峰转折横坐标，绝不共线打结。
 */
export const enhanceDagrePointsList = (dagre: any) => {
  if (!dagre || typeof dagre.calcPointsList !== "function" || (dagre as any).__converge_enhanced) return
  ;(dagre as any).__converge_enhanced = true

  const originalCalcPointsList = dagre.calcPointsList.bind(dagre)

  dagre.calcPointsList = function (model: any, nodes: any[]) {
    // 仅在从左至右(LR)布局且为正交折线(polyline)时介入多路汇流消歧
    if (this.option?.rankdir !== "LR" || model.modelType !== "polyline-edge") {
      return originalCalcPointsList(model, nodes)
    }

    const sourceNodeModel = this.lf.getNodeModelById(model.sourceNodeId)
    const targetNodeModel = this.lf.getNodeModelById(model.targetNodeId)
    const newSourceNodeData = nodes.find((node: any) => node.id === model.sourceNodeId)
    const newTargetNodeData = nodes.find((node: any) => node.id === model.targetNodeId)

    if (!sourceNodeModel || !targetNodeModel || !newSourceNodeData || !newTargetNodeData) {
      return originalCalcPointsList(model, nodes)
    }

    // 仅针对正向连线（源节点在目标节点左侧）处理汇流
    if (newSourceNodeData.x >= newTargetNodeData.x) {
      return originalCalcPointsList(model, nodes)
    }

    // 获取图中所有正向流向当前目标节点的边
    const allEdges = this.lf.graphModel.edges || []
    const incomingEdges = allEdges.filter((edge: any) => {
      if (edge.targetNodeId !== model.targetNodeId) return false
      const sNode = nodes.find((n: any) => n.id === edge.sourceNodeId)
      return sNode && sNode.x < newTargetNodeData.x
    })

    // 单边汇入时保持原有标准路径
    if (incomingEdges.length <= 1) {
      return originalCalcPointsList(model, nodes)
    }

    // 多路汇入：按源节点纵坐标从上到下排序
    incomingEdges.sort((a: any, b: any) => {
      const sa = nodes.find((n: any) => n.id === a.sourceNodeId)
      const sb = nodes.find((n: any) => n.id === b.sourceNodeId)
      return (sa?.y || 0) - (sb?.y || 0)
    })

    const index = incomingEdges.findIndex((e: any) => e.id === model.id)
    if (index === -1) {
      return originalCalcPointsList(model, nodes)
    }

    const N = incomingEdges.length
    const targetH = targetNodeModel.height || 60
    const targetW = targetNodeModel.width || 60
    const sourceW = sourceNodeModel.width || 120
    const startX = newSourceNodeData.x + sourceW / 2
    const startY = newSourceNodeData.y

    const isTargetSpecial = isGatewayType(targetNodeModel.type) || targetNodeModel.type === "end"

    // ==========================================
    // 方案 1：目标为菱形网关或圆形结束节点（BPMN 四向极点智能吸附，绝不悬空扎偏）
    // ==========================================
    if (isTargetSpecial) {
      // 2条分支汇聚（如：领导、产品 -> 并行网关，或多任务汇入结束圆圈）
      if (N === 2) {
        if (index === 0) {
          // 上方分支 -> 垂直向下 90° 直角扎入【北(上)顶点/极点锚点】
          const endX = newTargetNodeData.x
          const endY = newTargetNodeData.y - targetH / 2
          const pointsList = [
            { x: startX, y: startY },
            { x: endX, y: startY },
            { x: endX, y: endY }
          ]
          return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
        } else {
          // 下方分支 -> 垂直向上 90° 直角扎入【南(下)顶点/极点锚点】
          const endX = newTargetNodeData.x
          const endY = newTargetNodeData.y + targetH / 2
          const pointsList = [
            { x: startX, y: startY },
            { x: endX, y: startY },
            { x: endX, y: endY }
          ]
          return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
        }
      }

      // 3条分支汇聚（如：后端、算法、前端 -> 网关或结束圆圈）
      if (N === 3) {
        if (index === 0) {
          // 上方分支 -> 垂直扎入【北(上)极点】
          const endX = newTargetNodeData.x
          const endY = newTargetNodeData.y - targetH / 2
          const pointsList = [
            { x: startX, y: startY },
            { x: endX, y: startY },
            { x: endX, y: endY }
          ]
          return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
        } else if (index === 1) {
          // 中间分支 -> 笔直平射直入【西(左)极点】
          const endX = newTargetNodeData.x - targetW / 2
          const endY = newTargetNodeData.y
          const pointsList = [
            { x: startX, y: startY },
            { x: endX, y: endY }
          ]
          return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
        } else {
          // 下方分支 -> 垂直扎入【南(下)极点】
          const endX = newTargetNodeData.x
          const endY = newTargetNodeData.y + targetH / 2
          const pointsList = [
            { x: startX, y: startY },
            { x: endX, y: startY },
            { x: endX, y: endY }
          ]
          return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
        }
      }
    }

    // ==========================================
    // 方案 2：目标为普通矩形任务节点 —— 多轨平行分流入靶
    // ==========================================
    let edgeTargetY = newTargetNodeData.y
    if (N === 2) {
      edgeTargetY = index === 0 ? newTargetNodeData.y - 14 : newTargetNodeData.y + 14
    } else {
      const step = Math.min(18, (targetH - 16) / (N - 1))
      edgeTargetY = newTargetNodeData.y - ((N - 1) / 2) * step + index * step
    }

    // 转折横坐标错峰避让
    const offset = 38 + index * 22
    const turnX = newSourceNodeData.x + sourceW / 2 + offset
    const endX = newTargetNodeData.x - targetW / 2

    const pointsList = [
      { x: startX, y: startY },
      { x: turnX, y: startY },
      { x: turnX, y: edgeTargetY },
      { x: endX, y: edgeTargetY }
    ]

    return typeof this.pointFilter === "function" ? this.pointFilter(pointsList) : pointsList
  }
}

/**
 * 对分流分支节点执行严格水平中轴对称平衡
 * 解决 Dagre 算法在偶数分支时“一侧走平、一侧折下”的视觉失衡
 */
export const balanceSymmetricalBranches = (nodes: any[], edges: any[]) => {
  const outgoingMap = new Map<string, string[]>()
  edges.forEach((e) => {
    if (!outgoingMap.has(e.sourceNodeId)) {
      outgoingMap.set(e.sourceNodeId, [])
    }
    outgoingMap.get(e.sourceNodeId)!.push(e.targetNodeId)
  })

  const nodeMap = new Map<string, any>(nodes.map((n) => [n.id, n]))

  outgoingMap.forEach((targetIds, sourceId) => {
    const sourceNode = nodeMap.get(sourceId)
    if (!sourceNode) return

    // 筛选同层下游正向节点
    const uniqueTargetNodes = Array.from(new Set(targetIds))
      .map((id) => nodeMap.get(id))
      .filter((n) => n && n.x > sourceNode.x)

    // 2条分支（如领导、产品）
    if (uniqueTargetNodes.length === 2) {
      const [n1, n2] = uniqueTargetNodes
      if (Math.abs(n1.x - n2.x) < 40) {
        uniqueTargetNodes.sort((a, b) => a.y - b.y)
        const currentDist = Math.max(75, Math.abs(uniqueTargetNodes[1].y - uniqueTargetNodes[0].y) / 2)
        uniqueTargetNodes[0].y = Math.round(sourceNode.y - currentDist)
        uniqueTargetNodes[1].y = Math.round(sourceNode.y + currentDist)
      }
    } else if (uniqueTargetNodes.length === 3) {
      const xs = uniqueTargetNodes.map((n) => n.x)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      if (maxX - minX < 40) {
        uniqueTargetNodes.sort((a, b) => a.y - b.y)
        const dist = Math.max(85, (uniqueTargetNodes[2].y - uniqueTargetNodes[0].y) / 2)
        uniqueTargetNodes[0].y = Math.round(sourceNode.y - dist)
        uniqueTargetNodes[1].y = Math.round(sourceNode.y)
        uniqueTargetNodes[2].y = Math.round(sourceNode.y + dist)
      }
    }
  })

  return nodes
}

/**
 * 工作流画布自动排版与自适应缩放 Composable
 * 基于 LogicFlow 官方深度集成的 @logicflow/layout (Dagre 拓扑分层算法)
 * 并深度增强 BPMN 四向网关拓扑与多轨汇聚，消除分支合流处的连线打结共线与斜坡插线
 * @param lfRef LogicFlow 实例引用
 * @param containerRef 画布 DOM 容器引用
 * @param onCanvasChange 布局变更后数据同步回调
 */
export const useWorkflowLayout = (
  lfRef: Ref<any>,
  containerRef: Ref<HTMLElement | undefined>,
  onCanvasChange?: () => void
) => {
  /**
   * 智能居中与自适应缩放
   */
  const smartCenterAndZoom = () => {
    const lf = lfRef.value
    const container = containerRef.value
    if (!lf || !container) return

    const graphData = lf.getGraphData() as any
    const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : []
    if (nodes.length === 0) return

    if (nodes.length <= 2) {
      lf.translateCenter()
      return
    }

    const minX = Math.min(...nodes.map((node: any) => Number(node.x || 0)))
    const maxX = Math.max(...nodes.map((node: any) => Number(node.x || 0)))
    const minY = Math.min(...nodes.map((node: any) => Number(node.y || 0)))
    const maxY = Math.max(...nodes.map((node: any) => Number(node.y || 0)))

    const nodesWidth = maxX - minX
    const nodesHeight = maxY - minY
    const canvasWidth = container.clientWidth
    const canvasHeight = container.clientHeight

    if (canvasWidth > 0 && canvasHeight > 0 && nodesWidth > 0 && nodesHeight > 0) {
      let scale = Math.min(canvasWidth / (nodesWidth * 1.2), canvasHeight / (nodesHeight * 1.2))
      scale = Math.max(0.4, Math.min(scale, 1))
      lf.zoom(scale)
    }

    lf.translateCenter()
  }

/**
 * 执行 LogicFlow 原生 Dagre 拓扑分层排版（含智能汇聚防撞车与中轴镜像对称）
 */
  const runDagreLayout = (options: WorkflowLayoutOptions = {}): boolean => {
    const lf = lfRef.value
    if (!lf) return false

    const dagre = lf.extension?.dagre
    if (!dagre || typeof dagre.layout !== "function") {
      console.warn("LogicFlow Dagre 插件未成功挂载，无法执行自动排版")
      return false
    }

    // 动态增强汇聚连线计算，错开转折点与入靶高度
    enhanceDagrePointsList(dagre)

    const graphData = lf.getGraphData() as any
    const nodeCount = graphData?.nodes?.length || 0
    // 节点较少时给予更加舒展大气的呼吸间距，彻底消除拥挤窒息感
    const defaultRanksep = nodeCount <= 8 ? 170 : 140
    const defaultNodesep = nodeCount <= 8 ? 110 : 90

    const {
      rankdir = "LR",
      align = undefined,
      nodesep = defaultNodesep,
      ranksep = defaultRanksep
    } = options

    try {
      dagre.layout({
        rankdir,
        align,
        ranker: "network-simplex",
        nodesep,
        ranksep,
        isDefaultAnchor: true
      })

      // 中轴镜像对称平衡矫正与连线折点重算
      const currentData = lf.getGraphData() as any
      if (currentData?.nodes?.length && currentData?.edges?.length) {
        const balancedNodes = balanceSymmetricalBranches(currentData.nodes, currentData.edges)
        currentData.edges.forEach((edge: any) => {
          const model = lf.getEdgeModelById(edge.id)
          if (model && typeof dagre.calcPointsList === "function") {
            const pts = dagre.calcPointsList(model, balancedNodes)
            if (pts && pts.length >= 2) {
              edge.pointsList = pts
              edge.startPoint = { x: pts[0].x, y: pts[0].y }
              edge.endPoint = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y }
            }
          }
        })
        lf.renderRawData({ nodes: balancedNodes, edges: currentData.edges })
      }

      smartCenterAndZoom()

      if (onCanvasChange) {
        onCanvasChange()
      }

      return true
    } catch (err) {
      console.error("执行工作流自动排版失败:", err)
      return false
    }
  }

  /**
   * 自动排版并居中缩放（带用户操作通知）
   */
  const autoLayoutAndCenter = (options: WorkflowLayoutOptions = {}) => {
    const success = runDagreLayout(options)

    if (options.showNotification !== false) {
      if (success) {
        ElNotification({
          title: "智能拓扑排版已完成",
          message: "已重新梳理流程图结构，连线与节点锚点已完整校准对齐",
          type: "success",
          duration: 2500,
          position: "top-right",
          showClose: true
        })
      } else {
        ElMessage.warning("自动排版未能完成，请检查画布节点状态")
      }
    }
  }

  return {
    smartCenterAndZoom,
    runDagreLayout,
    autoLayoutAndCenter
  }
}
