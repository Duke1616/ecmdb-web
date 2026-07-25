import { describe, expect, it } from "vitest"
import type { Condition } from "@/api/iam/policy/type"
import { formatCondition, getConditionValidationMessage } from "./condition"

describe("policy Condition", () => {
  it("accepts EIAM principal and environment attributes", () => {
    const condition: Condition = {
      all: [
        {
          predicate: {
            key: "principal:username",
            operator: "StringEquals",
            values: [{ type: "literal", value: "alice" }]
          }
        },
        {
          predicate: {
            key: "environment:current_time",
            operator: "DateLessThan",
            values: [{ type: "literal", value: "2030-01-01T00:00:00Z" }]
          }
        }
      ]
    }

    expect(getConditionValidationMessage(condition)).toBe("")
    expect(formatCondition(condition)).toContain("登录用户名")
    expect(formatCondition(condition)).toContain("当前时间")
  })

  it.each([
    "principal:user_id",
    "principal:tenant_id",
    "auth:mfa_present",
    "request:source_ip",
    "request:method",
    "request:path",
    "request:secure_transport"
  ])("rejects unsupported context attribute %s", (key) => {
    const condition: Condition = {
      predicate: {
        key,
        operator: "StringEquals",
        values: [{ type: "literal", value: "value" }]
      }
    }
    expect(getConditionValidationMessage(condition)).toContain("Condition 不支持属性")
  })

  it("rejects business data attributes in Condition", () => {
    const condition: Condition = {
      predicate: {
        key: "ticket:create_by",
        operator: "StringEquals",
        values: [{ type: "literal", value: "alice" }]
      }
    }

    expect(getConditionValidationMessage(condition)).toContain("Condition 不支持属性")
  })

  it("rejects mixed AST nodes", () => {
    const invalid = {
      any: [
        {
          predicate: {
            key: "principal:username",
            operator: "StringEquals",
            values: [{ type: "literal", value: "alice" }]
          }
        }
      ],
      predicate: {
        key: "environment:current_time",
        operator: "DateLessThan",
        values: [{ type: "literal", value: "2030-01-01T00:00:00Z" }]
      }
    } as Condition

    expect(getConditionValidationMessage(invalid)).toContain("必须且只能包含")
  })
})
