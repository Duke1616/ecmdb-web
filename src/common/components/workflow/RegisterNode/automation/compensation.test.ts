import { describe, expect, it } from "vitest"
import { findCompensationNodeReferences, getCompensationNodeOptions } from "./compensation"

describe("automation compensation", () => {
  it("lists other automation nodes as compensation candidates", () => {
    expect(
      getCompensationNodeOptions(
        [
          { id: "source", type: "automation", properties: { name: "授权" } },
          { id: "compensation", type: "automation", properties: { name: "回收" } },
          { id: "approval", type: "user", properties: { name: "审批" } }
        ],
        "source"
      )
    ).toEqual([{ id: "compensation", name: "回收" }])
  })

  it("finds automation nodes that reference a compensation target", () => {
    expect(
      findCompensationNodeReferences(
        [
          {
            id: "grant",
            type: "automation",
            properties: { name: "授权", compensation_node_id: "revoke" }
          },
          {
            id: "notify",
            type: "automation",
            properties: { name: "通知", compensation_node_id: "other" }
          },
          { id: "revoke", type: "automation", properties: { name: "回收" } }
        ],
        "revoke"
      )
    ).toEqual([{ id: "grant", name: "授权" }])
  })
})
