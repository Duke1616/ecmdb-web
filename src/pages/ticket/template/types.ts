import type { createOrUpdateTemplateReq } from "@/api/ticket/template/types/template"
import type { dispatch } from "@/api/ticket/dispatch/types/dispatch"
import type { runner } from "@/api/task/runner/types/runner"
import type { OperateItem } from "@@/components/OperateBtn/types"

export type TemplateFormData = createOrUpdateTemplateReq

export const createDefaultTemplateFormData = (): TemplateFormData => ({
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined,
  icon: "",
  group_id: undefined,
  workflow_id: undefined,
  schedule_overrides: {}
})

export enum TicketTemplateAction {
  Edit = "edit",
  Sync = "sync",
  Dispatch = "dispatch",
  Clone = "clone",
  Delete = "delete"
}

export enum TemplateEditorStep {
  Info = 0,
  Designer = 1,
  Bindings = 2
}

export type TemplateManageGroupKey = number | "all"

export type TicketTemplateOperateItem = OperateItem<TicketTemplateAction>

export interface TemplateGroupFormExpose {
  handleCreate: () => void
  resetForm: () => void
  setForm: (data: { id: number; name: string; icon: string }) => void
}

export interface TemplateThirdPartyFormExpose {
  handleCreate: () => void
  resetForm: () => void
  setForm: (data: TemplateFormData) => void
}

export enum DispatchAction {
  Configure = "configure",
  Delete = "delete"
}

export type DispatchOperateItem = OperateItem<DispatchAction>

export interface AutomationDispatchRow {
  id: string
  automationNodeId: string
  dispatchId: number
  dispatch: dispatch
  nodeName: string
  runner?: runner
  runners: runner[]
}
