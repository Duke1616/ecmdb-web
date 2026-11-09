import { type Ref } from "vue"
import { ElNotification, ElMessage } from "element-plus"

export interface WorkflowLayoutOptions {
  nodesep?: number
  ranksep?: number
  rankdir?: "LR" | "TB"
  align?: "UL" | "UR" | "DL" | "DR" | undefined
  showNotification?: boolean
}

/**
 * 增强 Dagre 插件的折线路径计算能力
 * 解决原生 Dagre 在多路分支汇聚到同一目标节点时（如多个并行任务汇入结束节点），
 * 转折点 X 与入靶点 Y 坐标完全相同导致的“迎面相撞、共线打结”缺陷。
 * 通过为多路汇聚边分配独立错开的转折横坐标与垂直入靶高度，实现规整平行的双轨/多轨汇聚。
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
    const targetH = targetNodeModel.height || 50
    const targetW = targetNodeModel.width || 50
    const sourceW = sourceNodeModel.width || 100

    // 计算该汇入分支专属的垂直入靶高度，避免共同挤在水平中轴线上
    let edgeTargetY = newTargetNodeData.y
    if (N === 2) {
      // 双路汇入时，上下各错开 14px，视觉平行且紧贴目标节点左边缘
      edgeTargetY = index === 0 ? newTargetNodeData.y - 14 : newTargetNodeData.y + 14
    } else {
      const step = Math.min(18, (targetH - 16) / (N - 1))
      edgeTargetY = newTargetNodeData.y - ((N - 1) / 2) * step + index * step
    }

    // 计算专属的转折横坐标偏移量，避免两条垂直线在空中相撞
    const offset = 38 + index * 22
    const turnX = newSourceNodeData.x + sourceW / 2 + offset
    const startX = newSourceNodeData.x + sourceW / 2
    const startY = newSourceNodeData.y
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
 * 工作流画布自动排版与自适应缩放 Composable
 * 基于 LogicFlow 官方深度集成的 @logicflow/layout (Dagre 拓扑分层算法)
 * 并深度增强多路汇聚多轨路由，彻底消除分支合流处的连线打结共线
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
   * 执行 LogicFlow 原生 Dagre 拓扑分层排版（含智能汇聚防撞车）
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

    const {
      rankdir = "LR",
      align = undefined,
      nodesep = 80,
      ranksep = 100
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
