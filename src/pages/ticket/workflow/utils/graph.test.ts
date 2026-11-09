import { describe, it, expect } from "vitest"
import { validateWorkflowGraph, cleanGraphData, getNodeDisplayName } from "./graph"

describe("graph utils", () => {
  it("汇聚网关 (inCount >= 2, outCount === 1) 不应产生错误或警告", () => {
    const graphData = {
      nodes: [
        { id: "start", type: "start", text: "开始" },
        { id: "backend", type: "user", text: "后端" },
        { id: "algo", type: "user", text: "算法" },
        { id: "frontend", type: "user", text: "前端" },
        { id: "inc-gw", type: "inclusion", text: "包容网关" },
        { id: "end", type: "end", text: "结束" }
      ],
      edges: [
        { id: "e1", sourceNodeId: "start", targetNodeId: "backend" },
        { id: "e2", sourceNodeId: "start", targetNodeId: "algo" },
        { id: "e3", sourceNodeId: "start", targetNodeId: "frontend" },
        // 三路汇入网关
        { id: "e4", sourceNodeId: "backend", targetNodeId: "inc-gw" },
        { id: "e5", sourceNodeId: "algo", targetNodeId: "inc-gw" },
        { id: "e6", sourceNodeId: "frontend", targetNodeId: "inc-gw" },
        // 网关一路输出到结束
        { id: "e7", sourceNodeId: "inc-gw", targetNodeId: "end" }
      ]
    }

    const result = validateWorkflowGraph(graphData)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it("分流网关 (inCount === 1, outCount >= 2) 不应产生警告", () => {
    const graphData = {
      nodes: [
        { id: "start", type: "start", text: "开始" },
        { id: "cond-gw", type: "condition", text: "排他网关" },
        { id: "user1", type: "user", text: "分支1" },
        { id: "user2", type: "user", text: "分支2" },
        { id: "end", type: "end", text: "结束" }
      ],
      edges: [
        { id: "e1", sourceNodeId: "start", targetNodeId: "cond-gw" },
        { id: "e2", sourceNodeId: "cond-gw", targetNodeId: "user1" },
        { id: "e3", sourceNodeId: "cond-gw", targetNodeId: "user2" },
        { id: "e4", sourceNodeId: "user1", targetNodeId: "end" },
        { id: "e5", sourceNodeId: "user2", targetNodeId: "end" }
      ]
    }

    const result = validateWorkflowGraph(graphData)

    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it("单进单出网关应提示分支走向建议", () => {
    const graphData = {
      nodes: [
        { id: "start", type: "start", text: "开始" },
        { id: "cond-gw", type: "condition", text: "排他网关" },
        { id: "end", type: "end", text: "结束" }
      ],
      edges: [
        { id: "e1", sourceNodeId: "start", targetNodeId: "cond-gw" },
        { id: "e2", sourceNodeId: "cond-gw", targetNodeId: "end" }
      ]
    }

    const result = validateWorkflowGraph(graphData)

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes("既未聚合多路输入，也未分流多个输出"))).toBe(true)
  })

  it("cleanGraphData 应剔除内部 isDebug 属性", () => {
    const raw = {
      nodes: [{ id: "1", properties: { isDebug: true, name: "node1" } }],
      edges: [{ id: "e1", properties: { isDebug: true, label: "line" } }]
    }

    const cleaned = cleanGraphData(raw)

    expect(cleaned.nodes[0].properties.isDebug).toBeUndefined()
    expect(cleaned.nodes[0].properties.name).toBe("node1")
    expect(cleaned.edges[0].properties.isDebug).toBeUndefined()
  })

  it("getNodeDisplayName 支持对象 text 和 string text", () => {
    expect(getNodeDisplayName({ text: "普通文本" })).toBe("普通文本")
    expect(getNodeDisplayName({ text: { value: "对象文本" } })).toBe("对象文本")
    expect(getNodeDisplayName({ properties: { name: "属性名称" } })).toBe("属性名称")
  })
})
