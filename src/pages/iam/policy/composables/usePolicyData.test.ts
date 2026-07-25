import { describe, expect, it } from "vitest"
import { reactive } from "vue"
import type { Policy } from "@/api/iam/policy/type"
import type { PermissionManifest } from "@/api/iam/permission/type"
import {
  enrichManifest,
  getActionSelectionState,
  getStatementValidationMessage,
  mapResponseToVO,
  mapVOToRequest,
  normalizeStatement,
  parseStatementsJson,
  updateSelectedActions,
  type ManifestService
} from "./usePolicyData"

const scopedManifest: ManifestService[] = [
  {
    code: "ticket",
    name: "工单管理",
    entries: [
      {
        name: "工单列表",
        actions: [
          {
            code: "ticket:manager:history",
            name: "历史工单",
            access_scope_presets: [
              {
                code: "ticket_creator",
                name: "仅本人创建",
                expression: {
                  predicate: {
                    key: "ticket:create_by",
                    operator: "StringEquals",
                    values: [{ type: "ref", value: "principal:username" }]
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
]

describe("policy expression mapping", () => {
  it("round-trips Condition and AccessScope independently", () => {
    const condition = {
      predicate: {
        key: "principal:username",
        operator: "StringEquals" as const,
        values: [{ type: "literal" as const, value: "alice" }]
      }
    }
    const accessScope = {
      predicate: {
        key: "task:assignee",
        operator: "StringEquals" as const,
        values: [{ type: "ref" as const, value: "principal:username" }]
      }
    }
    const policy = {
      id: 1,
      name: "Todo owner",
      code: "todo_owner",
      desc: "",
      type: 2,
      ctime: 0,
      assignment_count: 0,
      statement: [
        {
          effect: "Allow",
          action: ["ticket:manager:todo"],
          resource: ["*"],
          condition,
          access_scope: accessScope
        }
      ]
    } satisfies Policy

    const request = mapVOToRequest(reactive(mapResponseToVO(policy)))
    expect(request.statement[0].condition).toEqual(condition)
    expect(request.statement[0].access_scope).toEqual(accessScope)
  })

  it("omits both expressions for unrestricted statements", () => {
    const parsed = parseStatementsJson(
      JSON.stringify([{ effect: "Allow", action: ["ticket:manager:history"], resource: ["*"] }])
    )
    const request = mapVOToRequest({ name: "Manager", code: "manager", desc: "", type: 2, statement: parsed })
    const serialized = JSON.stringify(request.statement[0])

    expect(serialized).not.toContain("condition")
    expect(serialized).not.toContain("access_scope")
  })

  it("rejects business attributes in Condition", () => {
    expect(() =>
      parseStatementsJson(
        JSON.stringify([
          {
            effect: "Allow",
            action: ["ticket:manager:history"],
            resource: ["*"],
            condition: {
              predicate: {
                key: "ticket:create_by",
                operator: "StringEquals",
                values: [{ type: "literal", value: "alice" }]
              }
            }
          }
        ])
      )
    ).toThrow("Condition 不支持属性")
  })

  it("rejects EIAM attributes as AccessScope keys", () => {
    expect(() =>
      parseStatementsJson(
        JSON.stringify([
          {
            effect: "Allow",
            action: ["ticket:manager:history"],
            resource: ["*"],
            access_scope: {
              predicate: {
                key: "request:source_ip",
                operator: "IpAddress",
                values: [{ type: "literal", value: "10.0.0.0/8" }]
              }
            }
          }
        ])
      )
    ).toThrow("必须是业务数据属性")
  })

  it("preserves AccessScope presets while enriching the Manifest", () => {
    const raw = {
      actions: [
        {
          id: 1,
          service: "ticket",
          group: "工单中心/工单列表",
          code: "ticket:manager:history",
          name: "历史工单",
          access_scope_presets: [
            {
              code: "ticket_creator",
              name: "仅本人创建",
              expression: {
                predicate: {
                  key: "ticket:create_by",
                  operator: "StringEquals",
                  values: [{ type: "ref", value: "principal:username" }]
                }
              }
            }
          ]
        }
      ],
      services: [
        {
          code: "ticket",
          name: "工单管理",
          entries: [{ name: "工单中心/工单列表", actions: ["ticket:manager:history"] }]
        }
      ]
    } satisfies PermissionManifest

    const manifest = enrichManifest(raw)
    expect(manifest[0].entries[0].actions[0].access_scope_presets?.[0].code).toBe("ticket_creator")
  })

  it("keeps group selection state and the exact Action array in sync", () => {
    const codes = ["ticket:manager:history", "ticket:manager:my_start", "ticket:manager:todo"]
    const selected = updateSelectedActions([], codes, true)

    expect(selected).toEqual(codes)
    expect(getActionSelectionState(selected, codes)).toEqual({ all: true, some: false })
    expect(updateSelectedActions(selected, codes, false)).toEqual([])
  })

  it("requires an explicit data choice for a newly selected scoped Action", () => {
    const statement = normalizeStatement({ action: ["ticket:manager:history"] })

    expect(getStatementValidationMessage([statement], "", scopedManifest)).toContain("请为历史工单选择可访问数据")

    statement.access_scope_configured = true
    expect(getStatementValidationMessage([statement], "", scopedManifest)).toBe("")
  })

  it("treats persisted unrestricted policies as configured without leaking UI state", () => {
    const policy = {
      id: 2,
      name: "History admin",
      code: "history_admin",
      desc: "",
      type: 2,
      ctime: 0,
      assignment_count: 0,
      statement: [
        {
          effect: "Allow",
          action: ["ticket:manager:history"],
          resource: ["*"]
        }
      ]
    } satisfies Policy

    const vo = mapResponseToVO(policy)
    expect(vo.statement[0].access_scope_configured).toBe(true)
    expect(JSON.stringify(mapVOToRequest(vo))).not.toContain("access_scope_configured")
  })
})
