import { describe, expect, it } from "vitest"
import { GATEWAY_TYPE_LIST, isGatewayType, getGatewayTypeConfig } from "./constants"

describe("gateway constants", () => {
  it("should contain exactly 4 gateway types", () => {
    expect(GATEWAY_TYPE_LIST).toHaveLength(4)
    const types = GATEWAY_TYPE_LIST.map((item) => item.type)
    expect(types).toEqual(["condition", "parallel", "selective", "inclusion"])
  })

  it("should correctly identify gateway types", () => {
    expect(isGatewayType("condition")).toBe(true)
    expect(isGatewayType("parallel")).toBe(true)
    expect(isGatewayType("inclusion")).toBe(true)
    expect(isGatewayType("selective")).toBe(true)

    expect(isGatewayType("start")).toBe(false)
    expect(isGatewayType("user")).toBe(false)
    expect(isGatewayType("automation")).toBe(false)
    expect(isGatewayType(undefined)).toBe(false)
  })

  it("should retrieve specific gateway config by type", () => {
    const conditionConfig = getGatewayTypeConfig("condition")
    expect(conditionConfig).toBeDefined()
    expect(conditionConfig?.name).toBe("排他网关")
    expect(conditionConfig?.badgeText).toBe("互斥单选")
    expect(conditionConfig?.needEdgeCondition).toBe(true)

    const selectiveConfig = getGatewayTypeConfig("selective")
    expect(selectiveConfig).toBeDefined()
    expect(selectiveConfig?.name).toBe("条件网关")
    expect(selectiveConfig?.badgeText).toBe("条件分流")

    const parallelConfig = getGatewayTypeConfig("parallel")
    expect(parallelConfig).toBeDefined()
    expect(parallelConfig?.name).toBe("并行网关")
    expect(parallelConfig?.badgeText).toBe("全量并发")
    expect(parallelConfig?.needEdgeCondition).toBe(false)

    expect(getGatewayTypeConfig("unknown" as any)).toBeUndefined()
  })

  it("each gateway config must have valid SVG paths", () => {
    GATEWAY_TYPE_LIST.forEach((item) => {
      expect(item.viewBox).toBe("0 0 1126 1024")
      expect(item.paths.length).toBeGreaterThan(0)
      item.paths.forEach((p) => {
        expect(p.d).toBeTruthy()
      })
    })
  })
})
