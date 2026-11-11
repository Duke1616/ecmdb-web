import type { Component } from "vue"
import type { ButtonType } from "element-plus"
import type { CreateOrUpdateWorkflowReq, WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"
import { getEngineDefaultTemplateGraph } from "./templates"

export * from "./templates"

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
  engine_type: "flowx",
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_policy: {
    allow_transfer: false,
    allow_reject: true,
    reject_modes: ["history"]
  },
  flow_data: createDefaultWorkflowGraph(createId)
})

/**
 * 构造标准示范工作流拓扑（Demo 一键注入，按引擎自适应）
 * @param createId UUID 生成函数
 * @param engineType 流程引擎类型（flowx 或 easyflow）
 */
export const createDemoWorkflowGraph = (
  createId: () => string,
  engineType: string = "flowx"
): WorkflowGraphData => {
  return getEngineDefaultTemplateGraph(createId, engineType)
}
