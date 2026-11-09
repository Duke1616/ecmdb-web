import { describe, it, expect } from "vitest"
import {
  WORKFLOW_TEMPLATES,
  createFlowXOrBranchGraph,
  createEasyFlowOrBranchGraph,
  createFlowXComprehensiveGraph,
  createEasyFlowComprehensiveGraph,
  createStandardBranchGraph,
  createLinearApprovalGraph,
  getEngineDefaultTemplateGraph
} from "./templates"

describe("Workflow Templates", () => {
  let counter = 0
  const mockCreateId = () => `mock-id-${++counter}`

  const validateGraphIntegrity = (graph: any) => {
    expect(graph).toBeDefined()
    expect(Array.isArray(graph.nodes)).toBe(true)
    expect(Array.isArray(graph.edges)).toBe(true)

    const nodeIds = new Set(graph.nodes.map((n: any) => n.id))

    // 验证所有边均连接有效节点，杜绝断线与悬空脱靶
    graph.edges.forEach((edge: any) => {
      expect(nodeIds.has(edge.sourceNodeId)).toBe(true)
      expect(nodeIds.has(edge.targetNodeId)).toBe(true)
    })
  }

  it("FlowX 双分支竞争或签流拓扑正确(包容分流 + 排他汇聚)", () => {
    const graph = createFlowXOrBranchGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(6)
    expect(graph.edges!.length).toBe(6)
    validateGraphIntegrity(graph)

    const nodeTypes = graph.nodes!.map((n: any) => n.type)
    expect(nodeTypes).toContain("inclusion")
    expect(nodeTypes).toContain("condition")
  })

  it("EasyFlow 双分支或签协同流拓扑正确(包容分流 + 包容汇聚)", () => {
    const graph = createEasyFlowOrBranchGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(6)
    expect(graph.edges!.length).toBe(6)
    validateGraphIntegrity(graph)

    const inclusionNodes = graph.nodes!.filter((n: any) => n.type === "inclusion")
    expect(inclusionNodes.length).toBe(2)
  })

  it("FlowX 综合发布模板拓扑结构完整无悬空边", () => {
    const graph = createFlowXComprehensiveGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(14)
    expect(graph.edges!.length).toBe(16)
    validateGraphIntegrity(graph)

    // 验证包含包容网关与并行网关
    const nodeTypes = graph.nodes!.map((n: any) => n.type)
    expect(nodeTypes).toContain("inclusion")
    expect(nodeTypes).toContain("parallel")
    expect(nodeTypes).toContain("automation")
    expect(nodeTypes).toContain("chat")
  })

  it("EasyFlow 综合模板包含条件网关与排他网关阵列且无断边", () => {
    const graph = createEasyFlowComprehensiveGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(16)
    expect(graph.edges!.length).toBe(18)
    validateGraphIntegrity(graph)

    const nodeTypes = graph.nodes!.map((n: any) => n.type)
    expect(nodeTypes).toContain("selective")
    expect(nodeTypes).toContain("condition")
    expect(nodeTypes).toContain("parallel")
  })

  it("标准排他分支模板生成正确", () => {
    const graph = createStandardBranchGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(5)
    expect(graph.edges!.length).toBe(5)
    validateGraphIntegrity(graph)
  })

  it("轻量串行模板生成正确", () => {
    const graph = createLinearApprovalGraph(mockCreateId)
    expect(graph.nodes!.length).toBe(5)
    expect(graph.edges!.length).toBe(4)
    validateGraphIntegrity(graph)
  })

  it("getEngineDefaultTemplateGraph 按引擎返回对应复杂示范拓扑", () => {
    const flowxGraph = getEngineDefaultTemplateGraph(mockCreateId, "flowx")
    const easyflowGraph = getEngineDefaultTemplateGraph(mockCreateId, "easyflow")

    expect(flowxGraph.nodes!.some((n: any) => n.type === "condition")).toBe(true)
    expect(easyflowGraph.nodes!.filter((n: any) => n.type === "inclusion").length).toBe(2)
  })

  it("WORKFLOW_TEMPLATES 导出列表完备且每项均可成功执行 createGraph", () => {
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThanOrEqual(4)
    WORKFLOW_TEMPLATES.forEach((tpl) => {
      const graph = tpl.createGraph(mockCreateId)
      validateGraphIntegrity(graph)
    })
  })
})
