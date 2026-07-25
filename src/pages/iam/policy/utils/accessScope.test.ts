import { describe, expect, it } from "vitest"
import { reactive } from "vue"
import type { AccessScope } from "@/api/iam/policy/type"
import { updateSelectedActions, type ManifestService } from "../composables/usePolicyData"
import {
  createAccessScopeFromTemplate,
  detectAccessScopeTemplate,
  getAccessScopeTemplatesForSelection,
  getAccessScopeValidationMessage,
  getAvailableAccessScopeTemplates,
  getSelectedAccessScopeActions,
  principalUsernameRef
} from "./accessScope"

const creator: AccessScope = {
  predicate: {
    key: "ticket:create_by",
    operator: "StringEquals",
    values: [principalUsernameRef()]
  }
}
const related: AccessScope = {
  predicate: {
    key: "ticket:related_users",
    operator: "ForAnyValue:StringEquals",
    values: [principalUsernameRef()]
  }
}
const assignee: AccessScope = {
  predicate: {
    key: "task:assignee",
    operator: "StringEquals",
    values: [principalUsernameRef()]
  }
}

const presets = (todo: boolean) => [
  { code: "ticket_creator", name: "仅本人创建", expression: creator },
  { code: "ticket_related", name: "本人创建或参与", expression: related },
  ...(todo ? [{ code: "todo_assignee", name: "仅本人待办", expression: assignee }] : [])
]

const manifest: ManifestService[] = [
  {
    code: "ticket",
    name: "工单",
    entries: [
      {
        name: "工单列表",
        actions: [
          { code: "ticket:manager:history", name: "历史工单", access_scope_presets: presets(false) },
          { code: "ticket:manager:todo", name: "全部待办", access_scope_presets: presets(true) },
          { code: "ticket:manager:my_start", name: "我发起的" }
        ]
      }
    ]
  }
]

describe("policy AccessScope", () => {
  it("computes templates declared by every selected Action", () => {
    expect(getAvailableAccessScopeTemplates(["ticket:manager:todo"], manifest).map((item) => item.id)).toEqual([
      "ticket_creator",
      "ticket_related",
      "todo_assignee",
      "none"
    ])
    expect(
      getAvailableAccessScopeTemplates(["ticket:manager:history", "ticket:manager:todo"], manifest).map(
        (item) => item.id
      )
    ).toEqual(["ticket_creator", "ticket_related", "none"])
  })

  it("extracts scoped actions from an exact mixed selection", () => {
    const actions = ["ticket:manager:history", "ticket:manager:my_start", "ticket:manager:todo"]
    expect(getSelectedAccessScopeActions(actions, manifest)).toEqual(["ticket:manager:history", "ticket:manager:todo"])
    expect(getAccessScopeTemplatesForSelection(actions, manifest).map((item) => item.id)).toEqual([
      "ticket_creator",
      "ticket_related",
      "none"
    ])
  })

  it("shows common templates after selecting the whole ticket-list group", () => {
    const groupCodes = manifest[0].entries[0].actions.map((action) => action.code)
    const selectedActions = updateSelectedActions([], groupCodes, true)
    const reactiveManifest = reactive(manifest)

    expect(getAccessScopeTemplatesForSelection(selectedActions, reactiveManifest).map((item) => item.id)).toEqual([
      "ticket_creator",
      "ticket_related",
      "none"
    ])
  })

  it("creates and recognizes a service-declared template", () => {
    const templates = getAvailableAccessScopeTemplates(["ticket:manager:history"], manifest)
    const scope = createAccessScopeFromTemplate("ticket_related", templates)
    expect(scope).toEqual(related)
    expect(detectAccessScopeTemplate(scope, templates)).toBe("ticket_related")
    expect(getAccessScopeValidationMessage(scope, ["ticket:manager:history"], manifest)).toBe("")
  })

  it("rejects EIAM attributes as AccessScope predicate keys", () => {
    const scope: AccessScope = {
      predicate: {
        key: "request:source_ip",
        operator: "IpAddress",
        values: [{ type: "literal", value: "10.0.0.0/8" }]
      }
    }
    expect(getAccessScopeValidationMessage(scope)).toContain("必须是业务数据属性")
  })

  it("rejects wildcard actions carrying AccessScope", () => {
    expect(getAvailableAccessScopeTemplates(["ticket:*"], manifest)).toEqual([])
    expect(getAccessScopeTemplatesForSelection(["ticket:*", "ticket:manager:history"], manifest)).toEqual([])
    expect(getAccessScopeValidationMessage(creator, ["ticket:*"], manifest)).toContain("通配符")
  })
})
