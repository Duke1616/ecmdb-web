import type { Component } from "vue"
import type { ButtonType } from "element-plus"
import type { createOrUpdateTemplateReq } from "@/api/ticket/template/types/template"

export type TemplateFormData = createOrUpdateTemplateReq

export const createDefaultTemplateFormData = (): TemplateFormData => ({
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined,
  icon: "",
  group_id: undefined,
  workflow_id: undefined
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
  Designer = 1
}

export interface TicketTemplateOperateItem {
  name: string
  code: TicketTemplateAction
  type?: ButtonType
  icon?: string | Component
  disabled?: boolean
  capability?: string | string[]
}

export interface TemplateGroupFormExpose {
  handleCreate: () => void
  resetForm: () => void
}

export interface TemplateThirdPartyFormExpose {
  handleCreate: () => void
  resetForm: () => void
  setForm: (data: TemplateFormData) => void
}
