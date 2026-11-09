import { describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import { useWorkflowLayout, enhanceDagrePointsList } from "./useWorkflowLayout"

describe("useWorkflowLayout", () => {
  it("当 Dagre 插件挂载正常时应正确调用 layout 并触发回调", () => {
    const mockLayout = vi.fn()
    const mockZoom = vi.fn()
    const mockTranslateCenter = vi.fn()
    const mockOnChange = vi.fn()

    const lfRef = ref({
      extension: {
        dagre: {
          layout: mockLayout
        }
      },
      getGraphData: () => ({
        nodes: [
          { id: "1", x: 100, y: 100 },
          { id: "2", x: 300, y: 100 },
          { id: "3", x: 500, y: 200 }
        ],
        edges: []
      }),
      zoom: mockZoom,
      translateCenter: mockTranslateCenter
    })

    const containerRef = ref({
      clientWidth: 1000,
      clientHeight: 600
    } as any)

    const { runDagreLayout } = useWorkflowLayout(lfRef, containerRef, mockOnChange)

    const result = runDagreLayout({ nodesep: 80, ranksep: 100 })

    expect(result).toBe(true)
    expect(mockLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        rankdir: "LR",
        nodesep: 80,
        ranksep: 100,
        isDefaultAnchor: true
      })
    )
    expect(mockTranslateCenter).toHaveBeenCalled()
    expect(mockOnChange).toHaveBeenCalled()
  })

  it("当 Dagre 插件不存在时应安全降级返回 false", () => {
    const lfRef = ref({
      extension: {}
    })
    const containerRef = ref(undefined)

    const { runDagreLayout } = useWorkflowLayout(lfRef, containerRef)
    const result = runDagreLayout()

    expect(result).toBe(false)
  })

  it("多路汇入普通节点时应智能错开折点与入靶高度", () => {
    const mockLf = {
      graphModel: {
        edges: [
          { id: "e1", sourceNodeId: "user", targetNodeId: "end", modelType: "polyline-edge" },
          { id: "e2", sourceNodeId: "auto", targetNodeId: "end", modelType: "polyline-edge" }
        ]
      },
      getNodeModelById(id: string) {
        if (id === "end") return { type: "end", width: 60, height: 60 }
        return { type: "user", width: 120, height: 64 }
      }
    }

    const dagre: any = {
      lf: mockLf,
      option: { rankdir: "LR" },
      calcPointsList: vi.fn(),
      pointFilter: (pts: any) => pts
    }

    enhanceDagrePointsList(dagre)

    const nodes = [
      { id: "user", x: 450, y: 150 },
      { id: "auto", x: 450, y: 350 },
      { id: "end", x: 650, y: 250 }
    ]

    const pts1 = dagre.calcPointsList(mockLf.graphModel.edges[0], nodes)
    const pts2 = dagre.calcPointsList(mockLf.graphModel.edges[1], nodes)

    expect(pts1).toBeDefined()
    expect(pts2).toBeDefined()

    expect(pts1[pts1.length - 1].y).toBe(236)
    expect(pts2[pts2.length - 1].y).toBe(264)
    expect(pts1[1].x).not.toBe(pts2[1].x)
  })

  it("2条分支汇入网关节点时应采用 BPMN 上下顶点汇聚", () => {
    const mockLf = {
      graphModel: {
        edges: [
          { id: "e-leader", sourceNodeId: "leader", targetNodeId: "parallel-gw", modelType: "polyline-edge" },
          { id: "e-product", sourceNodeId: "product", targetNodeId: "parallel-gw", modelType: "polyline-edge" }
        ]
      },
      getNodeModelById(id: string) {
        if (id === "parallel-gw") return { type: "parallel", width: 60, height: 60 }
        return { type: "user", width: 120, height: 64 }
      }
    }

    const dagre: any = {
      lf: mockLf,
      option: { rankdir: "LR" },
      calcPointsList: vi.fn(),
      pointFilter: (pts: any) => pts
    }

    enhanceDagrePointsList(dagre)

    const nodes = [
      { id: "leader", x: 400, y: 150 },
      { id: "product", x: 400, y: 350 },
      { id: "parallel-gw", x: 600, y: 250 }
    ]

    const leaderPts = dagre.calcPointsList(mockLf.graphModel.edges[0], nodes)
    const productPts = dagre.calcPointsList(mockLf.graphModel.edges[1], nodes)

    // 领导直角扎入上(北)顶点: (600, 250 - 30 = 220)
    expect(leaderPts[leaderPts.length - 1]).toEqual({ x: 600, y: 220 })
    // 产品直角扎入下(南)顶点: (600, 250 + 30 = 280)
    expect(productPts[productPts.length - 1]).toEqual({ x: 600, y: 280 })
  })

  it("3条分支汇入网关节点时应采用 BPMN 四向顶点汇聚（上、左、下入靶）", () => {
    const mockLf = {
      graphModel: {
        edges: [
          { id: "e-backend", sourceNodeId: "backend", targetNodeId: "inc-gw", modelType: "polyline-edge" },
          { id: "e-algo", sourceNodeId: "algo", targetNodeId: "inc-gw", modelType: "polyline-edge" },
          { id: "e-frontend", sourceNodeId: "frontend", targetNodeId: "inc-gw", modelType: "polyline-edge" }
        ]
      },
      getNodeModelById(id: string) {
        if (id === "inc-gw") return { type: "inclusion", width: 60, height: 60 }
        return { type: "user", width: 120, height: 64 }
      }
    }

    const dagre: any = {
      lf: mockLf,
      option: { rankdir: "LR" },
      calcPointsList: vi.fn(),
      pointFilter: (pts: any) => pts
    }

    enhanceDagrePointsList(dagre)

    const nodes = [
      { id: "backend", x: 400, y: 130 },
      { id: "algo", x: 400, y: 250 },
      { id: "frontend", x: 400, y: 370 },
      { id: "inc-gw", x: 600, y: 250 }
    ]

    const backendPts = dagre.calcPointsList(mockLf.graphModel.edges[0], nodes)
    const algoPts = dagre.calcPointsList(mockLf.graphModel.edges[1], nodes)
    const frontendPts = dagre.calcPointsList(mockLf.graphModel.edges[2], nodes)

    // 后端扎入北顶点 (600, 220)
    expect(backendPts[backendPts.length - 1]).toEqual({ x: 600, y: 220 })
    // 算法直射西顶点 (600 - 30 = 570, 250)
    expect(algoPts[algoPts.length - 1]).toEqual({ x: 570, y: 250 })
    // 前端扎入南顶点 (600, 280)
    expect(frontendPts[frontendPts.length - 1]).toEqual({ x: 600, y: 280 })
  })
})
