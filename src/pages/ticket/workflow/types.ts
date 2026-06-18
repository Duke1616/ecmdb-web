import type { Component } from "vue"
import type { ButtonType } from "element-plus"
import type { CreateOrUpdateWorkflowReq, WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"

export enum WorkflowAction {
  Deploy = "deploy",
  Edit = "edit",
  Clone = "clone",
  Preview = "preview",
  Delete = "delete"
}

export interface WorkflowOperateItem {
  name: string
  code: WorkflowAction
  type?: ButtonType
  icon?: string | Component
  disabled?: boolean
  capability?: string | string[]
}

export interface WorkflowWizardExpose {
  currentStep: { value: number }
  setStep: (step: number) => void
}

export type WorkflowFormData = CreateOrUpdateWorkflowReq

export const createDefaultWorkflowGraph = (createId: () => string): WorkflowGraphData => ({
  nodes: [
    {
      id: createId(),
      type: "start",
      x: 350,
      y: 160,
      properties: {}
    },
    {
      id: createId(),
      type: "end",
      x: 610,
      y: 160,
      properties: {}
    }
  ],
  edges: []
})

export const createDefaultWorkflowFormData = (createId: () => string): WorkflowFormData => ({
  id: undefined,
  is_notify: false,
  notify_method: 1,
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_data: createDefaultWorkflowGraph(createId)
})
