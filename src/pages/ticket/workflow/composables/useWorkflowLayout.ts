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
 * 工作流画布自动排版与自适应缩放 Composable
 * 基于 LogicFlow 官方深度集成的 @logicflow/layout (Dagre 拓扑分层算法)
 * 深度联动 LogicFlow 内部图模型与连线锚点计算，杜绝任何连线脱靶、断裂悬空现象
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
   * 确保布局完成后所有节点完整呈现于视野中央，保留舒适的呼吸边距
   */
  const smartCenterAndZoom = () => {
    const lf = lfRef.value
    const container = containerRef.value
    if (!lf || !container) return

    const graphData = lf.getGraphData() as any
    const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : []
    if (nodes.length === 0) return

    // 节点极少时直接居中，不作放大或缩小
    if (nodes.length <= 2) {
      lf.translateCenter()
      return
    }

    // 计算实际节点最大范围
    const minX = Math.min(...nodes.map((node: any) => Number(node.x || 0)))
    const maxX = Math.max(...nodes.map((node: any) => Number(node.x || 0)))
    const minY = Math.min(...nodes.map((node: any) => Number(node.y || 0)))
    const maxY = Math.max(...nodes.map((node: any) => Number(node.y || 0)))

    const nodesWidth = maxX - minX
    const nodesHeight = maxY - minY
    const canvasWidth = container.clientWidth
    const canvasHeight = container.clientHeight

    if (canvasWidth > 0 && canvasHeight > 0 && nodesWidth > 0 && nodesHeight > 0) {
      // 预留 20% 边距，避免边缘紧贴
      let scale = Math.min(canvasWidth / (nodesWidth * 1.2), canvasHeight / (nodesHeight * 1.2))
      // 上限不超过 100% 原始比例，下限不低于 40%
      scale = Math.max(0.4, Math.min(scale, 1))
      lf.zoom(scale)
    }

    lf.translateCenter()
  }

  /**
   * 执行 LogicFlow 原生 Dagre 拓扑分层排版
   */
  const runDagreLayout = (options: WorkflowLayoutOptions = {}): boolean => {
    const lf = lfRef.value
    if (!lf) return false

    const dagre = lf.extension?.dagre
    if (!dagre || typeof dagre.layout !== "function") {
      console.warn("LogicFlow Dagre 插件未成功挂载，无法执行自动排版")
      return false
    }

    const {
      rankdir = "LR",
      align = undefined,
      // 优化间距参数：同级分支间距 80，层级跨度 100，视觉紧凑协调，不再过度拉伸
      nodesep = 80,
      ranksep = 100
    } = options

    try {
      // 调用 LogicFlow 原生深度集成的 Dagre 插件，内部自动触发 adjustPoint 与连线锚点吸附
      dagre.layout({
        rankdir,
        align,
        ranker: "network-simplex",
        nodesep,
        ranksep,
        isDefaultAnchor: true
      })

      // 布局后自动调整视野居中
      smartCenterAndZoom()

      // 同步数据变更
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
