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

  it("多路汇入同一目标节点时应智能错开折点与入靶高度", () => {
    const mockLf = {
      graphModel: {
        edges: [
          { id: "e1", sourceNodeId: "user", targetNodeId: "end", modelType: "polyline-edge" },
          { id: "e2", sourceNodeId: "auto", targetNodeId: "end", modelType: "polyline-edge" }
        ]
      },
      getNodeModelById(id: string) {
        if (id === "end") return { width: 60, height: 60 }
        return { width: 120, height: 64 }
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

    // 终点 y 坐标应错开（pts1 在上方偏上，pts2 在下方偏下），不再挤在同一条水平线上
    expect(pts1[pts1.length - 1].y).toBe(236)
    expect(pts2[pts2.length - 1].y).toBe(264)
    expect(pts1[pts1.length - 1].y).not.toBe(pts2[pts2.length - 1].y)

    // 垂直转折横坐标 x 也应错开，避免迎面相撞
    expect(pts1[1].x).not.toBe(pts2[1].x)
  })
})
