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
  engine_type: "flowx",
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_data: createDefaultWorkflowGraph(createId)
})

/**
 * 构造标准示范工作流拓扑（Demo 一键注入）
 * 覆盖：开始 -> 排他网关分支 -> 人工审批 / 自动化任务 -> 汇聚结束
 * @param createId UUID 生成函数
 * @param engineType 流程引擎类型
 */
export const createDemoWorkflowGraph = (
  createId: () => string,
  engineType: string = "flowx"
): WorkflowGraphData => {
  const startId = createId()
  // FlowX 下使用 BPMN 标准排他网关 (condition)，EasyFlow 下同样兼容
  const gatewayId = createId()
  const approvalId = createId()
  const autoTaskId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 160,
        y: 220,
        text: { x: 160, y: 220, value: "开始" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: gatewayId,
        type: "condition",
        x: 340,
        y: 220,
        text: { x: 340, y: 220, value: "排他网关" },
        properties: { id: gatewayId, name: "审批条件判断" }
      },
      {
        id: approvalId,
        type: "user",
        x: 540,
        y: 140,
        text: { x: 540, y: 140, value: "技术主管审批" },
        properties: {
          id: approvalId,
          name: "技术主管审批",
          user_type: "leader",
          approve_type: "or"
        }
      },
      {
        id: autoTaskId,
        type: "automation",
        x: 540,
        y: 300,
        text: { x: 540, y: 300, value: "自动化配置同步" },
        properties: {
          id: autoTaskId,
          name: "自动化配置同步"
        }
      },
      {
        id: endId,
        type: "end",
        x: 740,
        y: 220,
        text: { x: 740, y: 220, value: "结束" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: gatewayId,
        text: { x: 250, y: 220, value: "" },
        properties: { name: "" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: gatewayId,
        targetNodeId: approvalId,
        text: { x: 440, y: 155, value: "高风险/变更" },
        properties: {
          name: "高风险/变更",
          expression: "$level == 'high' || $risk >= 3"
        }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: gatewayId,
        targetNodeId: autoTaskId,
        text: { x: 440, y: 285, value: "常规放行" },
        properties: {
          name: "常规放行",
          expression: "$level != 'high'"
        }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approvalId,
        targetNodeId: endId,
        text: { x: 640, y: 155, value: "审批通过" },
        properties: { name: "审批通过" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: autoTaskId,
        targetNodeId: endId,
        text: { x: 640, y: 285, value: "同步完成" },
        properties: { name: "同步完成" }
      }
    ]
  }
}
