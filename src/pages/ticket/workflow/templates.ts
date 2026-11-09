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
        type: "inclusive",
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
        type: "inclusive",
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
 * 全部可用模板定义列表
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplateItem[] = [
  {
    id: "flowx-comprehensive",
    name: "FlowX · 研发多分支包容与并行发布流",
    description: "遵循 BPMN 2.0 规范，包含包容网关多技术线（后端/算法/前端）并发汇聚、管理层双人并行会签及自动部署与群通知闭环。",
    engineType: "flowx",
    tag: "FlowX 推荐",
    badgeColor: "purple",
    nodeCount: 14,
    summary: ["开始", "抄送提交人", "包容网关分流 (3分支)", "包容汇聚", "并行会签 (2分支)", "自动化部署", "群通知", "结束"],
    createGraph: createFlowXComprehensiveGraph
  },
  {
    id: "easyflow-comprehensive",
    name: "EasyFlow · 条件分流与并行会签发布流",
    description: "专为 EasyFlow 引擎设计，基于条件网关与排他网关阵列分流，配合并行网关会签、自动化部署及群通知。",
    engineType: "easyflow",
    tag: "EasyFlow 推荐",
    badgeColor: "blue",
    nodeCount: 16,
    summary: ["开始", "抄送提交人", "条件网关分流", "排他分支阵列 (后端/前端/算法)", "并行会签", "自动化部署", "群通知", "结束"],
    createGraph: createEasyFlowComprehensiveGraph
  },
  {
    id: "standard-branch",
    name: "标准排他分支审批流",
    description: "经典双分支审批流转模型，根据业务条件自动流转至高风险人工主管审批或常规自动化配置同步。",
    engineType: "all",
    tag: "通用经典",
    badgeColor: "green",
    nodeCount: 5,
    summary: ["开始", "排他网关", "技术主管审批 / 自动化配置同步", "结束"],
    createGraph: createStandardBranchGraph
  },
  {
    id: "linear-approval",
    name: "轻量串行审批与通知流",
    description: "单线极简流转，适用于小额申请、日常权限开通等无需网关分支的标准直通场景。",
    engineType: "all",
    tag: "轻量高效",
    badgeColor: "slate",
    nodeCount: 5,
    summary: ["开始", "部门主管审批", "自动化任务执行", "结果群通知", "结束"],
    createGraph: createLinearApprovalGraph
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
    return createEasyFlowComprehensiveGraph(createId)
  }
  return createFlowXComprehensiveGraph(createId)
}
