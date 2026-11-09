import { describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import { useWorkflowLayout } from "./useWorkflowLayout"

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

  it("当节点数小于等于2时 smartCenterAndZoom 仅居中不强制缩放", () => {
    const mockZoom = vi.fn()
    const mockTranslateCenter = vi.fn()

    const lfRef = ref({
      getGraphData: () => ({
        nodes: [
          { id: "1", x: 100, y: 100 },
          { id: "2", x: 200, y: 100 }
        ]
      }),
      zoom: mockZoom,
      translateCenter: mockTranslateCenter
    })

    const containerRef = ref({
      clientWidth: 800,
      clientHeight: 500
    } as any)

    const { smartCenterAndZoom } = useWorkflowLayout(lfRef, containerRef)
    smartCenterAndZoom()

    expect(mockTranslateCenter).toHaveBeenCalled()
    expect(mockZoom).not.toHaveBeenCalled()
  })
})
