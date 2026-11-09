import type { WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"

export interface WorkflowTemplateItem {
  id: string
  name: string
  description: string
  engineType: "flowx" | "easyflow" | "all"
  tag: string
  badgeColor?: string
  nodeCount: number
  summary: string[]
  createGraph: (createId: () => string) => WorkflowGraphData
}

/**
 * 模板 1：FlowX 综合审批与自动化发布模板 (BPMN 2.0 规范)
 * 拓扑：开始 -> 抄送提交人 -> 包容网关分流 (后端/算法/前端) -> 包容网关汇聚 -> 并行网关会签 (领导/产品) -> 并行汇聚 -> 自动化部署 -> 群通知 -> 结束
 */
export const createFlowXComprehensiveGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
  const submitterId = createId()
  const forkInclusiveId = createId()
  const backendId = createId()
  const algoId = createId()
  const frontendId = createId()
  const joinInclusiveId = createId()
  const forkParallelId = createId()
  const leaderId = createId()
  const productId = createId()
  const joinParallelId = createId()
  const deployId = createId()
  const chatId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 100,
        y: 260,
        text: { x: 100, y: 260, value: "开始" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: submitterId,
        type: "user",
        x: 230,
        y: 260,
        text: { x: 230, y: 260, value: "抄送提交人" },
        properties: { id: submitterId, name: "抄送提交人", user_type: "submitter", approve_type: "or" }
      },
      {
        id: forkInclusiveId,
        type: "inclusion",
        x: 360,
        y: 260,
        text: { x: 360, y: 260, value: "包容网关" },
        properties: { id: forkInclusiveId, name: "技术线分流网关" }
      },
      {
        id: backendId,
        type: "user",
        x: 490,
        y: 140,
        text: { x: 490, y: 140, value: "后端" },
        properties: { id: backendId, name: "后端审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: algoId,
        type: "user",
        x: 490,
        y: 260,
        text: { x: 490, y: 260, value: "算法" },
        properties: { id: algoId, name: "算法审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: frontendId,
        type: "user",
        x: 490,
        y: 380,
        text: { x: 490, y: 380, value: "前端" },
        properties: { id: frontendId, name: "前端审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: joinInclusiveId,
        type: "inclusion",
        x: 620,
        y: 260,
        text: { x: 620, y: 260, value: "包容网关" },
        properties: { id: joinInclusiveId, name: "技术线汇聚网关" }
      },
      {
        id: forkParallelId,
        type: "parallel",
        x: 750,
        y: 260,
        text: { x: 750, y: 260, value: "并行网关" },
        properties: { id: forkParallelId, name: "管理层会签分流" }
      },
      {
        id: leaderId,
        type: "user",
        x: 880,
        y: 190,
        text: { x: 880, y: 190, value: "领导" },
        properties: { id: leaderId, name: "领导审批", user_type: "leader", approve_type: "and" }
      },
      {
        id: productId,
        type: "user",
        x: 880,
        y: 330,
        text: { x: 880, y: 330, value: "产品" },
        properties: { id: productId, name: "产品确认", user_type: "assignee", approve_type: "and" }
      },
      {
        id: joinParallelId,
        type: "parallel",
        x: 1010,
        y: 260,
        text: { x: 1010, y: 260, value: "并行网关" },
        properties: { id: joinParallelId, name: "管理层会签汇聚" }
      },
      {
        id: deployId,
        type: "automation",
        x: 1140,
        y: 260,
        text: { x: 1140, y: 260, value: "自动化-部署" },
        properties: { id: deployId, name: "自动化-部署" }
      },
      {
        id: chatId,
        type: "chat",
        x: 1260,
        y: 260,
        text: { x: 1260, y: 260, value: "群通知" },
        properties: { id: chatId, name: "群通知" }
      },
      {
        id: endId,
        type: "end",
        x: 1370,
        y: 260,
        text: { x: 1370, y: 260, value: "结束" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: submitterId,
        text: { x: 165, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: submitterId,
        targetNodeId: forkInclusiveId,
        text: { x: 295, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusiveId,
        targetNodeId: backendId,
        text: { x: 425, y: 200, value: "" },
        properties: { expression: "$scope.indexOf('backend') !== -1" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusiveId,
        targetNodeId: algoId,
        text: { x: 425, y: 260, value: "" },
        properties: { expression: "$scope.indexOf('algo') !== -1" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusiveId,
        targetNodeId: frontendId,
        text: { x: 425, y: 320, value: "" },
        properties: { expression: "$scope.indexOf('frontend') !== -1" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: backendId,
        targetNodeId: joinInclusiveId,
        text: { x: 555, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: algoId,
        targetNodeId: joinInclusiveId,
        text: { x: 555, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: frontendId,
        targetNodeId: joinInclusiveId,
        text: { x: 555, y: 320, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: joinInclusiveId,
        targetNodeId: forkParallelId,
        text: { x: 685, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkParallelId,
        targetNodeId: leaderId,
        text: { x: 815, y: 225, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkParallelId,
        targetNodeId: productId,
        text: { x: 815, y: 295, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: leaderId,
        targetNodeId: joinParallelId,
        text: { x: 945, y: 225, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: productId,
        targetNodeId: joinParallelId,
        text: { x: 945, y: 295, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: joinParallelId,
        targetNodeId: deployId,
        text: { x: 1075, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: deployId,
        targetNodeId: chatId,
        text: { x: 1200, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: chatId,
        targetNodeId: endId,
        text: { x: 1315, y: 260, value: "" },
        properties: {}
      }
    ]
  }
}

/**
 * 模板 2：EasyFlow 条件分流与并行会签模板
 * 拓扑：开始 -> 抄送提交人 -> 条件网关分流 (排他网关*3 -> 后端/前端/算法) -> 并行会签 (产品/领导) -> 自动化部署 -> 群通知 -> 结束
 */
export const createEasyFlowComprehensiveGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
  const submitterId = createId()
  const selectiveId = createId()
  const gwBackendId = createId()
  const gwFrontendId = createId()
  const gwAlgoId = createId()
  const backendId = createId()
  const frontendId = createId()
  const algoId = createId()
  const forkParallelId = createId()
  const productId = createId()
  const leaderId = createId()
  const joinParallelId = createId()
  const deployId = createId()
  const chatId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 100,
        y: 260,
        text: { x: 100, y: 260, value: "开始" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: submitterId,
        type: "user",
        x: 230,
        y: 260,
        text: { x: 230, y: 260, value: "抄送提交人" },
        properties: { id: submitterId, name: "抄送提交人", user_type: "submitter", approve_type: "or" }
      },
      {
        id: selectiveId,
        type: "selective",
        x: 360,
        y: 260,
        text: { x: 360, y: 260, value: "条件网关" },
        properties: { id: selectiveId, name: "条件网关" }
      },
      {
        id: gwBackendId,
        type: "condition",
        x: 480,
        y: 140,
        text: { x: 480, y: 140, value: "排他网关" },
        properties: { id: gwBackendId, name: "后端排他分支" }
      },
      {
        id: backendId,
        type: "user",
        x: 610,
        y: 140,
        text: { x: 610, y: 140, value: "后端" },
        properties: { id: backendId, name: "后端审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: gwFrontendId,
        type: "condition",
        x: 480,
        y: 260,
        text: { x: 480, y: 260, value: "排他网关" },
        properties: { id: gwFrontendId, name: "前端排他分支" }
      },
      {
        id: frontendId,
        type: "user",
        x: 610,
        y: 260,
        text: { x: 610, y: 260, value: "前端" },
        properties: { id: frontendId, name: "前端审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: gwAlgoId,
        type: "condition",
        x: 480,
        y: 380,
        text: { x: 480, y: 380, value: "排他网关" },
        properties: { id: gwAlgoId, name: "算法排他分支" }
      },
      {
        id: algoId,
        type: "user",
        x: 610,
        y: 380,
        text: { x: 610, y: 380, value: "算法" },
        properties: { id: algoId, name: "算法审批", user_type: "assignee", approve_type: "or" }
      },
      {
        id: forkParallelId,
        type: "parallel",
        x: 740,
        y: 260,
        text: { x: 740, y: 260, value: "并行网关" },
        properties: { id: forkParallelId, name: "并行会签分流" }
      },
      {
        id: productId,
        type: "user",
        x: 870,
        y: 190,
        text: { x: 870, y: 190, value: "产品" },
        properties: { id: productId, name: "产品确认", user_type: "assignee", approve_type: "and" }
      },
      {
        id: leaderId,
        type: "user",
        x: 870,
        y: 330,
        text: { x: 870, y: 330, value: "领导" },
        properties: { id: leaderId, name: "领导审批", user_type: "leader", approve_type: "and" }
      },
      {
        id: joinParallelId,
        type: "parallel",
        x: 1000,
        y: 260,
        text: { x: 1000, y: 260, value: "并行网关" },
        properties: { id: joinParallelId, name: "并行会签汇聚" }
      },
      {
        id: deployId,
        type: "automation",
        x: 1130,
        y: 260,
        text: { x: 1130, y: 260, value: "自动化-部署" },
        properties: { id: deployId, name: "自动化-部署" }
      },
      {
        id: chatId,
        type: "chat",
        x: 1250,
        y: 260,
        text: { x: 1250, y: 260, value: "群通知" },
        properties: { id: chatId, name: "群通知" }
      },
      {
        id: endId,
        type: "end",
        x: 1360,
        y: 260,
        text: { x: 1360, y: 260, value: "结束" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: submitterId,
        text: { x: 165, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: submitterId,
        targetNodeId: selectiveId,
        text: { x: 295, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: selectiveId,
        targetNodeId: gwBackendId,
        text: { x: 420, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: gwBackendId,
        targetNodeId: backendId,
        text: { x: 545, y: 140, value: "后端" },
        properties: { name: "后端", expression: "$type == 'backend'" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: selectiveId,
        targetNodeId: gwFrontendId,
        text: { x: 420, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: gwFrontendId,
        targetNodeId: frontendId,
        text: { x: 545, y: 260, value: "前端" },
        properties: { name: "前端", expression: "$type == 'frontend'" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: selectiveId,
        targetNodeId: gwAlgoId,
        text: { x: 420, y: 320, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: gwAlgoId,
        targetNodeId: algoId,
        text: { x: 545, y: 380, value: "算法" },
        properties: { name: "算法", expression: "$type == 'algo'" }
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: backendId,
        targetNodeId: forkParallelId,
        text: { x: 675, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: frontendId,
        targetNodeId: forkParallelId,
        text: { x: 675, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: algoId,
        targetNodeId: forkParallelId,
        text: { x: 675, y: 320, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkParallelId,
        targetNodeId: productId,
        text: { x: 805, y: 225, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkParallelId,
        targetNodeId: leaderId,
        text: { x: 805, y: 295, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: productId,
        targetNodeId: joinParallelId,
        text: { x: 935, y: 225, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: leaderId,
        targetNodeId: joinParallelId,
        text: { x: 935, y: 295, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: joinParallelId,
        targetNodeId: deployId,
        text: { x: 1065, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: deployId,
        targetNodeId: chatId,
        text: { x: 1190, y: 260, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: chatId,
        targetNodeId: endId,
        text: { x: 1305, y: 260, value: "" },
        properties: {}
      }
    ]
  }
}

/**
 * 模板 3：标准排他分支审批流 (通用经典)
 * 拓扑：开始 -> 排他网关 -> 人工主管审批 / 自动化配置同步 -> 结束
 */
export const createStandardBranchGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
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

/**
 * 模板 4：轻量串行审批与通知流 (通用极简)
 * 拓扑：开始 -> 部门主管审批 -> 自动化执行 -> 群通知 -> 结束
 */
export const createLinearApprovalGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
  const approvalId = createId()
  const autoTaskId = createId()
  const chatId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 160,
        y: 200,
        text: { x: 160, y: 200, value: "开始" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: approvalId,
        type: "user",
        x: 340,
        y: 200,
        text: { x: 340, y: 200, value: "部门主管审批" },
        properties: { id: approvalId, name: "部门主管审批", user_type: "leader", approve_type: "or" }
      },
      {
        id: autoTaskId,
        type: "automation",
        x: 520,
        y: 200,
        text: { x: 520, y: 200, value: "自动化任务执行" },
        properties: { id: autoTaskId, name: "自动化任务执行" }
      },
      {
        id: chatId,
        type: "chat",
        x: 700,
        y: 200,
        text: { x: 700, y: 200, value: "结果群通知" },
        properties: { id: chatId, name: "结果群通知" }
      },
      {
        id: endId,
        type: "end",
        x: 880,
        y: 200,
        text: { x: 880, y: 200, value: "结束" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: approvalId,
        text: { x: 250, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approvalId,
        targetNodeId: autoTaskId,
        text: { x: 430, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: autoTaskId,
        targetNodeId: chatId,
        text: { x: 610, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: chatId,
        targetNodeId: endId,
        text: { x: 790, y: 200, value: "" },
        properties: {}
      }
    ]
  }
}

/**
 * 模板：FlowX 双分支竞争或签流 (包容分流 + 排他汇聚)
 * 拓扑：开始 -> 包容网关 (分流) -> 审批人 A / 审批人 B -> 排他网关 (汇聚，任一人审批通过即往下走) -> 结束
 */
export const createFlowXOrBranchGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
  const forkInclusionId = createId()
  const approverAId = createId()
  const approverBId = createId()
  const joinConditionId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 120,
        y: 200,
        text: { x: 120, y: 200, value: "" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: forkInclusionId,
        type: "inclusion",
        x: 280,
        y: 200,
        text: { x: 280, y: 200, value: "" },
        properties: { id: forkInclusionId, name: "包容分流网关" }
      },
      {
        id: approverAId,
        type: "user",
        x: 460,
        y: 120,
        text: { x: 460, y: 120, value: "" },
        properties: { id: approverAId, name: "审批人 A", user_type: "assignee" }
      },
      {
        id: approverBId,
        type: "user",
        x: 460,
        y: 280,
        text: { x: 460, y: 280, value: "" },
        properties: { id: approverBId, name: "审批人 B", user_type: "assignee" }
      },
      {
        id: joinConditionId,
        type: "condition",
        x: 640,
        y: 200,
        text: { x: 640, y: 200, value: "" },
        properties: { id: joinConditionId, name: "排他汇聚网关" }
      },
      {
        id: endId,
        type: "end",
        x: 800,
        y: 200,
        text: { x: 800, y: 200, value: "" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: forkInclusionId,
        text: { x: 200, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusionId,
        targetNodeId: approverAId,
        text: { x: 370, y: 150, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusionId,
        targetNodeId: approverBId,
        text: { x: 370, y: 250, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approverAId,
        targetNodeId: joinConditionId,
        text: { x: 550, y: 150, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approverBId,
        targetNodeId: joinConditionId,
        text: { x: 550, y: 250, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: joinConditionId,
        targetNodeId: endId,
        text: { x: 720, y: 200, value: "" },
        properties: {}
      }
    ]
  }
}

/**
 * 模板：EasyFlow 双分支或签流 (包容分流 + 包容汇聚)
 * 拓扑：开始 -> 包容网关 (分流) -> 审批人 A / 审批人 B -> 包容网关 (汇聚，任一人审批通过即往下走) -> 结束
 */
export const createEasyFlowOrBranchGraph = (createId: () => string): WorkflowGraphData => {
  const startId = createId()
  const forkInclusionId = createId()
  const approverAId = createId()
  const approverBId = createId()
  const joinInclusionId = createId()
  const endId = createId()

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        x: 120,
        y: 200,
        text: { x: 120, y: 200, value: "" },
        properties: { id: startId, name: "开始" }
      },
      {
        id: forkInclusionId,
        type: "inclusion",
        x: 280,
        y: 200,
        text: { x: 280, y: 200, value: "" },
        properties: { id: forkInclusionId, name: "包容分流网关" }
      },
      {
        id: approverAId,
        type: "user",
        x: 460,
        y: 120,
        text: { x: 460, y: 120, value: "" },
        properties: { id: approverAId, name: "审批人 A", user_type: "assignee" }
      },
      {
        id: approverBId,
        type: "user",
        x: 460,
        y: 280,
        text: { x: 460, y: 280, value: "" },
        properties: { id: approverBId, name: "审批人 B", user_type: "assignee" }
      },
      {
        id: joinInclusionId,
        type: "inclusion",
        x: 640,
        y: 200,
        text: { x: 640, y: 200, value: "" },
        properties: { id: joinInclusionId, name: "包容汇聚网关" }
      },
      {
        id: endId,
        type: "end",
        x: 800,
        y: 200,
        text: { x: 800, y: 200, value: "" },
        properties: { id: endId, name: "结束" }
      }
    ],
    edges: [
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: startId,
        targetNodeId: forkInclusionId,
        text: { x: 200, y: 200, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusionId,
        targetNodeId: approverAId,
        text: { x: 370, y: 150, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: forkInclusionId,
        targetNodeId: approverBId,
        text: { x: 370, y: 250, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approverAId,
        targetNodeId: joinInclusionId,
        text: { x: 550, y: 150, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: approverBId,
        targetNodeId: joinInclusionId,
        text: { x: 550, y: 250, value: "" },
        properties: {}
      },
      {
        id: createId(),
        type: "polyline",
        sourceNodeId: joinInclusionId,
        targetNodeId: endId,
        text: { x: 720, y: 200, value: "" },
        properties: {}
      }
    ]
  }
}

/**
 * 全部可用模板定义列表
 */
/**
 * 全部可用模板定义列表
 * 排序原则：由简入繁，越通用简单越靠前，复杂进阶放最后
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplateItem[] = [
  // 1. 最通用、最简单的直通审批（5 节点）
  {
    id: "linear-approval",
    name: "基础串行审批流",
    description: "最常见标准的单线审批流程：员工提交申请后由部门主管审批，通过后系统自动执行任务并发送群通知，无需网关分支。",
    engineType: "all",
    tag: "简单直通",
    badgeColor: "slate",
    nodeCount: 5,
    summary: ["开始", "部门主管审批", "自动化任务执行", "结果群通知", "结束"],
    createGraph: createLinearApprovalGraph
  },
  // 2. 常用条件二选一分支审批（5 节点）
  {
    id: "standard-branch",
    name: "条件分支审批流",
    description: "根据申请信息自动判断风险等级：高风险/重大变更流转至人工主管审批，常规低风险申请直接自动放行并同步配置。",
    engineType: "all",
    tag: "条件分流",
    badgeColor: "green",
    nodeCount: 5,
    summary: ["开始", "条件判断", "人工主管审批 / 自动放行", "结束"],
    createGraph: createStandardBranchGraph
  },
  // 3. 多人竞争/或签审批（FlowX 引擎：任一人通过即可向下流转，6 节点）
  {
    id: "flowx-or-branch",
    name: "多人竞争审批流 (任一人通过即可)",
    description: "任务同时并发派发给审批人 A 和审批人 B，采用先到先得竞争机制。只要任意一人审批通过，工单即可直接流转完成。",
    engineType: "flowx",
    tag: "或签协同",
    badgeColor: "purple",
    nodeCount: 6,
    summary: ["开始", "并发派发", "审批人 A / B (任一审批)", "任一通过即向下", "结束"],
    createGraph: createFlowXOrBranchGraph
  },
  // 3. 多人竞争/或签审批（EasyFlow 引擎：任一人通过即可向下流转，6 节点）
  {
    id: "easyflow-or-branch",
    name: "多人竞争审批流 (任一人通过即可)",
    description: "任务同时并发派发给审批人 A 和审批人 B，只要其中任意一人审批通过，即可流向下一环节完成流转。",
    engineType: "easyflow",
    tag: "或签协同",
    badgeColor: "blue",
    nodeCount: 6,
    summary: ["开始", "并发派发", "审批人 A / B (任一审批)", "任一通过即向下", "结束"],
    createGraph: createEasyFlowOrBranchGraph
  },
  // 4. 大型综合业务流程（FlowX 引擎：多部门协同审批与全员会签，14 节点）
  {
    id: "flowx-comprehensive",
    name: "多技术线协同与并行发布流",
    description: "多技术线（后端/算法/前端）根据需求同时审批，汇聚后进入管理层双人会签（必须全员同意），完成后自动部署并发送群通知。",
    engineType: "flowx",
    tag: "多线会签",
    badgeColor: "purple",
    nodeCount: 14,
    summary: ["开始", "抄送提交人", "技术线审批 (后端/算法/前端)", "管理层双人会签", "自动部署", "群通知", "结束"],
    createGraph: createFlowXComprehensiveGraph
  },
  // 4. 大型综合业务流程（EasyFlow 引擎：多职能分流与并行会签，16 节点）
  {
    id: "easyflow-comprehensive",
    name: "多职能分流与并行发布流",
    description: "根据业务角色分别分流给专属审批人（后端/前端/算法），汇聚后由管理层全员会签确认，最后自动执行部署并发送群通知。",
    engineType: "easyflow",
    tag: "多线会签",
    badgeColor: "blue",
    nodeCount: 16,
    summary: ["开始", "抄送提交人", "按职能分流审批", "管理层双人会签", "自动部署", "群通知", "结束"],
    createGraph: createEasyFlowComprehensiveGraph
  }
]

/**
 * 根据引擎类型获取匹配的示范工作流拓扑
 * @param createId UUID 生成器
 * @param engineType 工作流引擎类型
 */
export const getEngineDefaultTemplateGraph = (
  createId: () => string,
  engineType: string = "flowx"
): WorkflowGraphData => {
  if (engineType === "easyflow" || engineType === "easy-workflow") {
    return createEasyFlowOrBranchGraph(createId)
  }
  return createFlowXOrBranchGraph(createId)
}
