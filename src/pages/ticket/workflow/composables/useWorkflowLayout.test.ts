import { describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import {
  useWorkflowLayout,
  deduplicateWorkflowEdges,
  calculateEdgeTextPosition,
  convertLfToElkGraph,
  applyElkResultToLfData
} from "./useWorkflowLayout"

describe("useWorkflowLayout (现代 ELK 正交排版架构)", () => {
  it("deduplicateWorkflowEdges 应安全剔除节点间重复连线与自环连线", () => {
    const rawEdges = [
      { id: "e1", sourceNodeId: "gw", targetNodeId: "end" },
      { id: "e2_duplicate", sourceNodeId: "gw", targetNodeId: "end" },
      { id: "e3_self", sourceNodeId: "gw", targetNodeId: "gw" },
      { id: "e4", sourceNodeId: "start", targetNodeId: "gw" }
    ]

    const cleanEdges = deduplicateWorkflowEdges(rawEdges)

    expect(cleanEdges.length).toBe(2)
    expect(cleanEdges.map((e) => e.id)).toEqual(["e1", "e4"])
  })

  it("convertLfToElkGraph 应正确转换节点 ports 与极点端点绑定", () => {
    const nodes = [
      { id: "start", type: "start", y: 100 },
      { id: "gateway1", type: "condition", y: 100 },
      { id: "taskTop", type: "user", y: 50 },
      { id: "taskBottom", type: "user", y: 150 },
      { id: "gateway2", type: "condition", y: 100 }
    ]
    const edges = [
      { id: "e1", sourceNodeId: "start", targetNodeId: "gateway1" },
      { id: "e2", sourceNodeId: "gateway1", targetNodeId: "taskTop" },
      { id: "e3", sourceNodeId: "gateway1", targetNodeId: "taskBottom" },
      { id: "e4", sourceNodeId: "taskTop", targetNodeId: "gateway2" },
      { id: "e5", sourceNodeId: "taskBottom", targetNodeId: "gateway2" }
    ]

    const elkGraph = convertLfToElkGraph(nodes, edges, { rankdir: "LR" })

    expect(elkGraph.id).toBe("root")
    expect(elkGraph.layoutOptions?.["elk.algorithm"]).toBe("layered")
    expect(elkGraph.layoutOptions?.["elk.direction"]).toBe("RIGHT")
    expect(elkGraph.layoutOptions?.["elk.edgeRouting"]).toBe("ORTHOGONAL")
    expect(elkGraph.children?.length).toBe(5)

    // 检查网关是否有 4 向极点 ports
    const gwNode = elkGraph.children?.find((c) => c.id === "gateway1")
    expect(gwNode?.ports?.length).toBe(4)
    expect(gwNode?.ports?.map((p) => p.id)).toContain("gateway1:n")
    expect(gwNode?.ports?.map((p) => p.id)).toContain("gateway1:s")

    // 检查汇聚网关的入边是否精准绑定到北顶点和南顶点
    const edge4 = elkGraph.edges?.find((e) => e.id === "e4")
    const edge5 = elkGraph.edges?.find((e) => e.id === "e5")
    expect(edge4?.targets).toEqual(["gateway2:n"])
    expect(edge5?.targets).toEqual(["gateway2:s"])
  })

  it("calculateEdgeTextPosition 应选取最长水平线段并实施防贴脸留白", () => {
    // 典型正交折线：起点(100, 50) -> 拐点(110, 50) -> 拐点(110, 150) -> 终点(300, 150)
    // 最后一段 (110, 150) 到 (300, 150) 是最长水平段，长 190px
    const pointsList = [
      { x: 100, y: 50 },
      { x: 110, y: 50 },
      { x: 110, y: 150 },
      { x: 300, y: 150 }
    ]

    const pos = calculateEdgeTextPosition(pointsList, "算法负责人")

    expect(pos).toBeDefined()
    // Y 坐标必须准确位于水平段的 Y 轴上
    expect(pos?.y).toBe(150)
    // X 坐标距离右侧终点 300 必须保留防贴脸安全间距
    expect(pos?.x).toBeLessThan(280)
    expect(pos?.x).toBeGreaterThan(150)
  })

  it("针对网关多分支拓扑，各分支文字应各自落在专属水平车道，Y轴隔离防止重叠", () => {
    // 模拟从网关出来的上分支和下分支连线折点
    const topEdgePoints = [
      { x: 100, y: 150 }, // 出门段（中轴）
      { x: 130, y: 150 },
      { x: 130, y: 70 }, // 垂直向上
      { x: 260, y: 70 } // 专属入靶段
    ]
    const bottomEdgePoints = [
      { x: 100, y: 150 }, // 出门段（同在中轴）
      { x: 130, y: 150 },
      { x: 130, y: 230 }, // 垂直向下
      { x: 260, y: 230 } // 专属入靶段
    ]
    const directEdgePoints = [
      { x: 100, y: 150 }, // 中轴直通
      { x: 300, y: 150 }
    ]

    const topPos = calculateEdgeTextPosition(topEdgePoints, "前端组")
    const bottomPos = calculateEdgeTextPosition(bottomEdgePoints, "后端组")
    const directPos = calculateEdgeTextPosition(directEdgePoints, "未匹配")

    // 上、中、下三个分支文字的 Y 坐标必须各自独立隔离，绝不能聚在出门段 (y=150)
    expect(topPos?.y).toBe(70)
    expect(bottomPos?.y).toBe(230)
    expect(directPos?.y).toBe(150)
    // 相互之间 Y 轴距离至少大于 70px，杜绝视觉重叠
    expect(Math.abs(topPos!.y - bottomPos!.y)).toBeGreaterThanOrEqual(150)
  })

  it("applyElkResultToLfData 应正确将左上角坐标转换为中心点并提取正交拐点 pointsList", () => {
    const originalNodes = [
      { id: "n1", type: "user", x: 0, y: 0, text: { value: "技术" } },
      { id: "n2", type: "user", x: 0, y: 0 }
    ]
    const originalEdges = [{ id: "e1", sourceNodeId: "n1", targetNodeId: "n2", text: { value: "前端组" } }]

    const computedElkGraph: any = {
      id: "root",
      children: [
        { id: "n1", x: 100, y: 50, width: 80, height: 60 },
        { id: "n2", x: 260, y: 150, width: 80, height: 60 }
      ],
      edges: [
        {
          id: "e1",
          sections: [
            {
              startPoint: { x: 180, y: 80 },
              bendPoints: [
                { x: 220, y: 80 },
                { x: 220, y: 180 }
              ],
              endPoint: { x: 260, y: 180 }
            }
          ]
        }
      ]
    }

    const { nodes, edges } = applyElkResultToLfData(originalNodes, originalEdges, computedElkGraph)

    expect(nodes[0].x).toBe(140)
    expect(nodes[0].y).toBe(80)
    expect(nodes[0].text.x).toBe(140)
    expect(nodes[1].x).toBe(300)
    expect(nodes[1].y).toBe(180)

    expect(edges[0].pointsList.length).toBe(4)
    expect(edges[0].startPoint).toEqual({ x: 180, y: 80 })
    expect(edges[0].pointsList[1]).toEqual({ x: 220, y: 80 })
    expect(edges[0].pointsList[2]).toEqual({ x: 220, y: 180 })
    expect(edges[0].endPoint).toEqual({ x: 260, y: 180 })
    // 断言连线文本坐标已被计算并显式同步至水平线段
    expect(edges[0].text.x).toBeDefined()
    expect([80, 180]).toContain(edges[0].text.y)
  })

  it("针对复合双级分支拓扑，应实现北极点南极点精准直角扎入且中轴净空", async () => {
    const nodes = [
      { id: "start", type: "start", y: 100 },
      { id: "gw1", type: "condition", y: 100 },
      { id: "tech", type: "user", y: 50 },
      { id: "hr", type: "user", y: 150 },
      { id: "gw2", type: "condition", y: 100 },
      { id: "gw3", type: "parallel", y: 100 },
      { id: "sub1", type: "user", y: 50 },
      { id: "sub2", type: "user", y: 150 },
      { id: "gw4", type: "parallel", y: 100 },
      { id: "end", type: "end", y: 100 }
    ]
    const edges = [
      { id: "e1", sourceNodeId: "start", targetNodeId: "gw1" },
      { id: "e2", sourceNodeId: "gw1", targetNodeId: "tech" },
      { id: "e3", sourceNodeId: "gw1", targetNodeId: "hr" },
      { id: "e4", sourceNodeId: "tech", targetNodeId: "gw2" },
      { id: "e5", sourceNodeId: "hr", targetNodeId: "gw2" },
      { id: "e6", sourceNodeId: "gw2", targetNodeId: "gw3" },
      { id: "e7", sourceNodeId: "gw3", targetNodeId: "sub1" },
      { id: "e8", sourceNodeId: "gw3", targetNodeId: "sub2" },
      { id: "e9", sourceNodeId: "sub1", targetNodeId: "gw4" },
      { id: "e10", sourceNodeId: "sub2", targetNodeId: "gw4" },
      { id: "e11", sourceNodeId: "gw4", targetNodeId: "end" }
    ]

    let finalRenderedData: any = null
    const lfRef = ref({
      getGraphData: () => ({ nodes, edges }),
      renderRawData: (data: any) => {
        finalRenderedData = data
      },
      translateCenter: vi.fn()
    })
    const containerRef = ref({ clientWidth: 1600, clientHeight: 900 } as any)

    const { runAutoLayout } = useWorkflowLayout(lfRef, containerRef)
    const success = await runAutoLayout()

    expect(success).toBe(true)
    expect(finalRenderedData).toBeDefined()

    const nodeMap = new Map<string, any>(finalRenderedData.nodes.map((n: any) => [n.id, n]))
    const gw1 = nodeMap.get("gw1")
    const tech = nodeMap.get("tech")
    const hr = nodeMap.get("hr")
    const gw2 = nodeMap.get("gw2")

    // 主干节点保持在同一水平中轴上
    expect(gw1.y).toBe(gw2.y)
    // 两个分支关于主轴上下对称（允许 1px 像素四舍五入公差）
    expect(Math.abs(Math.abs(tech.y - gw1.y) - Math.abs(hr.y - gw1.y))).toBeLessThanOrEqual(1)

    const edgeMap = new Map<string, any>(finalRenderedData.edges.map((e: any) => [e.id, e]))
    const e4 = edgeMap.get("e4") // 上方分支汇聚
    const e5 = edgeMap.get("e5") // 下方分支汇聚

    // e4 终点应为网关的北(上)顶点 (x = gw2.x, y = gw2.y - 25)
    expect(e4.endPoint.x).toBe(gw2.x)
    expect(e4.endPoint.y).toBe(gw2.y - 25)

    // e5 终点应为网关的南(下)顶点 (x = gw2.x, y = gw2.y + 25)
    expect(e5.endPoint.x).toBe(gw2.x)
    expect(e5.endPoint.y).toBe(gw2.y + 25)
  })

  it("autoLayoutAndCenter 应成功执行去重排版并调用 renderRawData", async () => {
    const mockRenderRawData = vi.fn()
    const lfRef = ref({
      getGraphData: () => ({
        nodes: [{ id: "n1", type: "start", x: 0, y: 0 }],
        edges: []
      }),
      renderRawData: mockRenderRawData,
      translateCenter: vi.fn()
    })
    const containerRef = ref({ clientWidth: 800, clientHeight: 600 } as any)

    const { autoLayoutAndCenter } = useWorkflowLayout(lfRef, containerRef)
    const success = await autoLayoutAndCenter({ showNotification: false })

    expect(success).toBe(true)
    expect(mockRenderRawData).toHaveBeenCalled()
  })
})
