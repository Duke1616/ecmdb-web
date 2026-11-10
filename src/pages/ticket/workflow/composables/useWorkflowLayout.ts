import { type Ref } from "vue"
import { ElNotification, ElMessage } from "element-plus"
import ELK, { type ElkNode, type ElkPort, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js"
import { isGatewayType } from "@@/components/workflow/RegisterNode/gateway/constants"

/**
 * 工作流自动排版配置选项
 */
export interface WorkflowLayoutOptions {
  /** 垂直方向（同一层级节点间）安全间距，默认根据节点规模自适应（130~160） */
  nodesep?: number
  /** 水平方向（跨层级流转间）层级间距，默认根据节点规模自适应（125~150） */
  ranksep?: number
  /** 排版主方向：LR（自左向右）或 TB（自顶向下），默认 LR */
  rankdir?: "LR" | "TB"
  /** 是否弹出操作完成通知消息，默认 true */
  showNotification?: boolean
}

/** 全局单例 ELK 正交图布局引擎 */
const elkEngine = new ELK()

/**
 * 判断指定节点类型是否为网关类型
 * @param type 节点类型标识
 */
export const isWorkflowGateway = (type?: string): boolean => {
  if (!type) return false
  return isGatewayType(type) || type.includes("gateway")
}

/**
 * 清除图中重复的连接线
 * 保证任意两个节点之间同方向最多只保留一条连接线，彻底杜绝重叠分叉与脏数据干扰
 * @param edges 原始连接线列表
 * @returns 去重后的干净连接线列表
 */
export const deduplicateWorkflowEdges = (edges: any[]): any[] => {
  if (!Array.isArray(edges)) return []

  const seenPairKeys = new Set<string>()
  const cleanEdges: any[] = []

  for (const edge of edges) {
    if (!edge || !edge.sourceNodeId || !edge.targetNodeId) continue
    // 过滤指向自身的非法自环连线
    if (edge.sourceNodeId === edge.targetNodeId) continue

    const pairKey = `${edge.sourceNodeId}->${edge.targetNodeId}`
    if (seenPairKeys.has(pairKey)) {
      continue
    }

    seenPairKeys.add(pairKey)
    cleanEdges.push(edge)
  }

  return cleanEdges
}

/**
 * 将 LogicFlow 拓扑数据转换为基于四向极点端口约束的正交图结构
 * @param nodes 原始节点列表
 * @param edges 已去重的连接线列表
 * @param options 排版选项
 * @param getNodeSize 自定义节点尺寸探测函数
 */
export const convertLfToElkGraph = (
  nodes: any[],
  edges: any[],
  options: WorkflowLayoutOptions = {},
  getNodeSize?: (node: any) => { width: number; height: number }
): ElkNode => {
  const nodeCount = nodes.length
  const defaultRanksep = nodeCount <= 8 ? 150 : 125
  const defaultNodesep = nodeCount <= 8 ? 160 : 130

  const rankdir = options.rankdir || "LR"
  const nodesep = options.nodesep || defaultNodesep
  const ranksep = options.ranksep || defaultRanksep

  // 构建节点映射与出入边收集，用于网关多分支四向极点分流与汇聚分配
  const nodeMap = new Map<string, any>(nodes.map((n) => [String(n.id), n]))
  const incomingMap = new Map<string, any[]>()
  const outgoingMap = new Map<string, any[]>()

  edges.forEach((edge) => {
    const tid = String(edge.targetNodeId)
    const sid = String(edge.sourceNodeId)

    if (!incomingMap.has(tid)) incomingMap.set(tid, [])
    incomingMap.get(tid)!.push(edge)

    if (!outgoingMap.has(sid)) outgoingMap.set(sid, [])
    outgoingMap.get(sid)!.push(edge)
  })

  // 1. 构建带有正交极点端口的 ELK 节点
  const children: ElkNode[] = nodes.map((node) => {
    const nid = String(node.id)
    const isGw = isWorkflowGateway(node.type)
    const isEnd = node.type === "end"
    const isStart = node.type === "start"

    // 为包含下挂文本标签的业务任务预留 96px 真实包围盒高度，给连线与文字保留充足留白
    const size = getNodeSize
      ? getNodeSize(node)
      : {
          width: isGw ? 50 : isEnd || isStart ? 48 : 80,
          height: isGw ? 50 : isEnd || isStart ? 48 : 96
        }

    const ports: ElkPort[] = []
    if (isGw) {
      // 菱形网关定义 4 向标准极点端口：西(入), 东(出), 北(上汇聚), 南(下汇聚)
      ports.push(
        { id: `${nid}:w`, layoutOptions: { "port.side": "WEST" } },
        { id: `${nid}:e`, layoutOptions: { "port.side": "EAST" } },
        { id: `${nid}:n`, layoutOptions: { "port.side": "NORTH" } },
        { id: `${nid}:s`, layoutOptions: { "port.side": "SOUTH" } }
      )
    } else {
      // 普通业务节点与开始/结束节点统一配置西进东出端口，结束节点保持纯平正交入靶
      ports.push(
        { id: `${nid}:w`, layoutOptions: { "port.side": "WEST" } },
        { id: `${nid}:e`, layoutOptions: { "port.side": "EAST" } }
      )
    }

    return {
      id: nid,
      width: size.width,
      height: size.height,
      layoutOptions: { "elk.portConstraints": "FIXED_SIDE" },
      ports
    }
  })

  // 2. 将连线精准接入对应的网关四向极点端口（北/南/东分流与汇聚）
  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => {
    const sid = String(edge.sourceNodeId)
    const tid = String(edge.targetNodeId)

    let sourcePort = `${sid}:e`
    let targetPort = `${tid}:w`

    const sourceNode = nodeMap.get(sid)
    const targetNode = nodeMap.get(tid)

    // 核心优化 1：网关出线端统一从东极点东向引出，形成规范的正交总线分流
    // （规避因未排版前节点 Y 坐标随机排序导致的多分支交叉倒错）
    if (sourceNode && isWorkflowGateway(sourceNode.type)) {
      sourcePort = `${sid}:e`
    }

    // 核心优化 2：网关汇聚端多路极点归集（上分支北极点入、下分支南极点入、中轴东极点入）
    if (targetNode && isWorkflowGateway(targetNode.type)) {
      const incEdges = incomingMap.get(tid) || []
      if (incEdges.length === 2) {
        incEdges.sort((a, b) => {
          const sa = nodeMap.get(String(a.sourceNodeId))
          const sb = nodeMap.get(String(b.sourceNodeId))
          return (sa?.y || 0) - (sb?.y || 0)
        })
        const idx = incEdges.findIndex((item) => item.id === edge.id)
        targetPort = idx === 0 ? `${tid}:n` : `${tid}:s`
      } else if (incEdges.length >= 3) {
        incEdges.sort((a, b) => {
          const sa = nodeMap.get(String(a.sourceNodeId))
          const sb = nodeMap.get(String(b.sourceNodeId))
          return (sa?.y || 0) - (sb?.y || 0)
        })
        const idx = incEdges.findIndex((item) => item.id === edge.id)
        if (idx === 0) {
          targetPort = `${tid}:n`
        } else if (idx === incEdges.length - 1) {
          targetPort = `${tid}:s`
        } else {
          targetPort = `${tid}:w`
        }
      }
    }

    return {
      id: String(edge.id),
      sources: [sourcePort],
      targets: [targetPort]
    }
  })

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": rankdir === "TB" ? "DOWN" : "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL", // 强制正交直角折线走法
      "elk.spacing.nodeNode": String(nodesep), // 阔朗高挑的上下垂直开合度
      "elk.layered.spacing.nodeNodeBetweenLayers": String(ranksep),
      "elk.spacing.edgeEdge": "24", // 连线通道安全间距，杜绝多线共轨重合
      "elk.spacing.edgeNode": "75", // 连线与节点文字之间强制保留 75px 安全垂直净空
      "elk.layered.spacing.edgeNodeBetweenLayers": "75",
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED", // 保证多分枝上下严格对称平衡
      "elk.layered.cycleBreaking.strategy": "GREEDY" // 健壮环路回环处理
    },
    children,
    edges: elkEdges
  }
}

/**
 * 根据折线折点序列智能计算连线文本标签的最佳展示坐标
 * 优先选取目标节点前方的专属车道水平线段，彻底规避在中轴分流公用段的文字堆叠碰撞
 * @param pointsList 折线拐点序列
 * @param textValue 文字内容
 */
export const calculateEdgeTextPosition = (
  pointsList: Array<{ x: number; y: number }>,
  textValue?: string
): { x: number; y: number } | null => {
  if (!pointsList || pointsList.length < 2) return null

  // 1. 拆解所有线段并搜集所有有效水平段（Y 轴差值 <= 3px 视为水平段）
  const horizontalSegments: Array<{
    p1: { x: number; y: number }
    p2: { x: number; y: number }
    length: number
    isLast: boolean
    isFirst: boolean
  }> = []

  for (let i = 0; i < pointsList.length - 1; i++) {
    const p1 = pointsList[i]
    const p2 = pointsList[i + 1]
    const isHorizontal = Math.abs(p1.y - p2.y) <= 3
    const len = Math.abs(p2.x - p1.x)

    if (isHorizontal && len >= 20) {
      horizontalSegments.push({
        p1,
        p2,
        length: len,
        isLast: i === pointsList.length - 2,
        isFirst: i === 0
      })
    }
  }

  // 2. 优先级判定：
  // 核心原则：如果存在直通目标节点的专属入靶段（isLast），优先使用该专属车道段，
  // 确保上方分支文字在上方、下方分支文字在下方，绝不挤在出门中轴的 isFirst 段打架！
  let selectedSegment = horizontalSegments.find((s) => s.isLast && s.length >= 25)

  // 若入靶段过短，则选择除第一段（公用出门段）之外的最长水平专属段
  if (!selectedSegment) {
    const branchSegments = horizontalSegments.filter((s) => !s.isFirst)
    if (branchSegments.length > 0) {
      branchSegments.sort((a, b) => b.length - a.length)
      selectedSegment = branchSegments[0]
    }
  }

  // 若仍无匹配（如单段直连线），则取全局最长水平段
  if (!selectedSegment && horizontalSegments.length > 0) {
    horizontalSegments.sort((a, b) => b.length - a.length)
    selectedSegment = horizontalSegments[0]
  }

  // 3. 计算文字坐标并实施防贴脸留白
  if (selectedSegment) {
    const minX = Math.min(selectedSegment.p1.x, selectedSegment.p2.x)
    const maxX = Math.max(selectedSegment.p1.x, selectedSegment.p2.x)
    const midY = Math.round((selectedSegment.p1.y + selectedSegment.p2.y) / 2)

    const textLen = (textValue || "").length || 3
    const cardHalfWidth = Math.round((textLen * 12 + 16) / 2)

    let textX = Math.round((minX + maxX) / 2)

    // 入靶段防贴脸：距目标节点左顶点预留安全间距
    if (selectedSegment.isLast && maxX - textX < cardHalfWidth + 20) {
      textX = Math.max(minX + cardHalfWidth + 8, maxX - cardHalfWidth - 20)
    }

    return { x: textX, y: midY }
  }

  // 4. 兜底策略：首末折点空间中点
  const pStart = pointsList[0]
  const pEnd = pointsList[pointsList.length - 1]
  return {
    x: Math.round((pStart.x + pEnd.x) / 2),
    y: Math.round((pStart.y + pEnd.y) / 2)
  }
}

/**
 * 将 ELK 计算生成的正交几何结果映射回 LogicFlow 数据结构
 * @param originalNodes 原始节点列表
 * @param originalEdges 原始连接线列表
 * @param computedElkGraph ELK 计算后的图对象
 * @returns 包含更新后坐标与拐点列表的 LogicFlow 数据
 */
export const applyElkResultToLfData = (
  originalNodes: any[],
  originalEdges: any[],
  computedElkGraph: ElkNode
): { nodes: any[]; edges: any[] } => {
  const elkNodeMap = new Map<string, ElkNode>()
  computedElkGraph.children?.forEach((child) => {
    elkNodeMap.set(child.id, child)
  })

  const newNodes = originalNodes.map((n) => {
    const computed = elkNodeMap.get(String(n.id))
    if (!computed || computed.x === undefined || computed.y === undefined) return n

    // ELK 坐标以左上角为锚点，LogicFlow 以几何中心点为锚点
    const centerX = Math.round(computed.x + (computed.width || 0) / 2)
    const centerY = Math.round(computed.y + (computed.height || 0) / 2)
    const cloned = { ...n, x: centerX, y: centerY }

    // 同步更新文本标签坐标，紧凑贴合在节点图标下方，避免侵占连线车道
    if (cloned.text && typeof cloned.text === "object") {
      const textOffsetY = isWorkflowGateway(cloned.type) ? 34 : cloned.type === "user" ? 32 : 28
      cloned.text = {
        ...cloned.text,
        x: centerX,
        y: centerY + textOffsetY
      }
    }
    return cloned
  })

  const elkEdgeMap = new Map<string, ElkExtendedEdge>()
  computedElkGraph.edges?.forEach((e) => {
    elkEdgeMap.set(e.id, e)
  })

  const newEdges = originalEdges.map((e) => {
    const computed = elkEdgeMap.get(String(e.id))
    const section = computed?.sections?.[0]
    if (!section || !section.startPoint || !section.endPoint) return e

    const pointsList = [
      { x: Math.round(section.startPoint.x), y: Math.round(section.startPoint.y) },
      ...(section.bendPoints || []).map((bp) => ({
        x: Math.round(bp.x),
        y: Math.round(bp.y)
      })),
      { x: Math.round(section.endPoint.x), y: Math.round(section.endPoint.y) }
    ]

    const updatedEdge: any = {
      ...e,
      pointsList,
      startPoint: pointsList[0],
      endPoint: pointsList[pointsList.length - 1]
    }

    // 智能校准连线文本标签坐标并持久化同步，避免贴脸与刷新跳动
    if (updatedEdge.text) {
      const textVal = typeof updatedEdge.text === "object" ? updatedEdge.text.value : String(updatedEdge.text)
      if (textVal) {
        const textPos = calculateEdgeTextPosition(pointsList, textVal)
        if (textPos) {
          updatedEdge.text = {
            ...(typeof updatedEdge.text === "object" ? updatedEdge.text : {}),
            value: textVal,
            x: textPos.x,
            y: textPos.y
          }
        }
      }
    }

    return updatedEdge
  })

  return { nodes: newNodes, edges: newEdges }
}

/**
 * 工作流画布自动排版与自适应缩放 Composable
 * 基于工业级正交图布局引擎 ELK (Eclipse Layout Kernel)
 * 具备连线前置去重、四向极点精准对齐、上下高挑对称与纯净正交走线特性
 * @param lfRef LogicFlow 实例引用
 * @param containerRef 画布 DOM 容器引用
 * @param onCanvasChange 布局数据同步回调函数
 */
export const useWorkflowLayout = (
  lfRef: Ref<any>,
  containerRef: Ref<HTMLElement | undefined>,
  onCanvasChange?: () => void
) => {
  /**
   * 画布智能居中与自适应缩放
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
   * 执行正交排版并回写画布（自动连线去重 + 四向极点正交约束）
   */
  const runAutoLayout = async (options: WorkflowLayoutOptions = {}): Promise<boolean> => {
    const lf = lfRef.value
    if (!lf) return false

    const graphData = lf.getGraphData() as any
    const nodes = Array.isArray(graphData?.nodes) ? [...graphData.nodes] : []
    // 关键：在排版计算前自动清理重复连线与自环连线
    const edges = deduplicateWorkflowEdges(Array.isArray(graphData?.edges) ? [...graphData.edges] : [])

    if (nodes.length === 0) return false

    try {
      const getNodeSize = (node: any) => {
        const model = lf.getNodeModelById ? lf.getNodeModelById(node.id) : null
        const isGw = isWorkflowGateway(node.type)
        const isEnd = node.type === "end"
        const isStart = node.type === "start"
        const width = model?.width || (isGw ? 50 : isEnd || isStart ? 48 : 80)
        const height = model?.height || (isGw ? 50 : isEnd || isStart ? 48 : 96)
        return { width, height }
      }

      const elkGraph = convertLfToElkGraph(nodes, edges, options, getNodeSize)
      const computedGraph = await elkEngine.layout(elkGraph)
      const { nodes: newNodes, edges: newEdges } = applyElkResultToLfData(nodes, edges, computedGraph)

      // 一次性渲染纯净去重后的节点与正交折线
      lf.renderRawData({ nodes: newNodes, edges: newEdges })
      smartCenterAndZoom()

      if (onCanvasChange) {
        onCanvasChange()
      }

      return true
    } catch (err) {
      console.error("执行工作流正交排版失败:", err)
      return false
    }
  }

  /**
   * 自动排版并自适应缩放（带用户操作通知提示）
   */
  const autoLayoutAndCenter = async (options: WorkflowLayoutOptions = {}): Promise<boolean> => {
    const success = await runAutoLayout(options)

    if (options.showNotification !== false) {
      if (success) {
        ElNotification({
          title: "智能拓扑排版已完成",
          message: "已优化流程图拓扑结构，重复连线已自动清理，分支车道已自动规避重叠",
          type: "success",
          duration: 2500,
          position: "top-right",
          showClose: true
        })
      } else {
        ElMessage.warning("自动排版未能完成，请检查画布节点状态")
      }
    }

    return success
  }

  return {
    smartCenterAndZoom,
    runAutoLayout,
    runElkLayout: runAutoLayout, // 向后兼容别名
    autoLayoutAndCenter
  }
}
