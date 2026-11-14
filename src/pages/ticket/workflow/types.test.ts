import { describe, it, expect } from "vitest"
import { getDefaultFlowPolicy, createDefaultWorkflowFormData } from "./types"

describe("getDefaultFlowPolicy", () => {
  it("FlowX 引擎默认退回上一环节，允许驳回、禁止转签", () => {
    expect(getDefaultFlowPolicy("flowx")).toEqual({
      allow_transfer: false,
      allow_reject: true,
      reject_modes: ["history"]
    })
  })

  it("EasyFlow 引擎仅支持办结终止驳回", () => {
    expect(getDefaultFlowPolicy("easy-workflow")).toEqual({
      allow_transfer: false,
      allow_reject: true,
      reject_modes: ["terminate"]
    })
  })

  it("未指定引擎时兜底为 FlowX 默认策略", () => {
    expect(getDefaultFlowPolicy()).toEqual(getDefaultFlowPolicy("flowx"))
  })

  it("每次调用返回独立对象与数组，避免调用方 mutate 相互污染", () => {
    const a = getDefaultFlowPolicy("flowx")
    const b = getDefaultFlowPolicy("flowx")
    expect(a).not.toBe(b)
    expect(a.reject_modes).not.toBe(b.reject_modes)
  })
})

describe("createDefaultWorkflowFormData", () => {
  it("默认表单采用 FlowX 引擎与其默认流转策略", () => {
    const data = createDefaultWorkflowFormData(() => "id")
    expect(data.engine_type).toBe("flowx")
    expect(data.flow_policy).toEqual(getDefaultFlowPolicy("flowx"))
  })
})