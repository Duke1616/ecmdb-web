import type { OperateItem } from "@@/components/OperateBtn/types"
import type { CreateOrUpdateWorkflowReq, FlowPolicy, WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"

export * from "./templates"

export enum WorkflowAction {
  Deploy = "deploy",
  Edit = "edit",
  Clone = "clone",
  Preview = "preview",
  Delete = "delete"
}

export type WorkflowOperateItem = OperateItem<WorkflowAction>

export interface WorkflowWizardExpose {
  currentStep: { value: number }
  setStep: (step: number) => void
}

export type WorkflowFormData = CreateOrUpdateWorkflowReq

// EasyFlow 不支持转签、仅支持办结终止驳回；FlowX 默认退回上一环节
export const getDefaultFlowPolicy = (engineType?: string): FlowPolicy => ({
  allow_transfer: false,
  allow_reject: true,
  reject_modes: engineType === "easy-workflow" ? ["terminate"] : ["history"]
})

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
  flow_policy: getDefaultFlowPolicy("flowx"),
  flow_data: createDefaultWorkflowGraph(createId)
})