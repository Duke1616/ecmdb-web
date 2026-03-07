import { defineAsyncComponent, markRaw } from "vue"
import registerStart from "./start/start"
import registerEnd from "./end/end"
import registerUser from "./user/user"
import registerCondition from "./condition/condition"
import registerParallel from "./parallel/parallel"
import registerSelective from "./selective/selective"
import registerInclusion from "./inclusion/inclusion"
import registerAutomation from "./automation/automation"
import registerChat from "./chat/chat"
import registerPolyline from "../RegisterEdge/edge"

// 属性组件使用异步加载，优化首屏
const startProperty = defineAsyncComponent(() => import("./start/startProperty.vue"))
const userProperty = defineAsyncComponent(() => import("./user/userProperty.vue"))
const conditionProperty = defineAsyncComponent(() => import("./condition/conditionProperty.vue"))
const automationProperty = defineAsyncComponent(() => import("./automation/automationProperty.vue"))
const chatProperty = defineAsyncComponent(() => import("./chat/chatProperty.vue"))
const edgeProperty = defineAsyncComponent(() => import("../RegisterEdge/edge.vue"))

export interface NodeConfig {
  type: string
  text: string
  description: string
  category: "control" | "business" | "gateway" | "edge"
  class: string
  register: (lf: any) => void
  property?: any
  icon?: string // 用于 NodePanel 展示的 Emoji 或图片名
  iconSVG?: string // 用于统一展示的 SVG Path
}

export const WORKFLOW_NODES: NodeConfig[] = [
  // 控制节点
  {
    type: "start",
    text: "开始",
    description: "流程开始节点",
    category: "control",
    class: "node-start",
    register: registerStart,
    property: markRaw(startProperty)
  },
  {
    type: "end",
    text: "结束",
    description: "流程结束节点",
    category: "control",
    class: "node-end",
    register: registerEnd
  },
  // 业务节点
  {
    type: "user",
    text: "用户",
    description: "需要人工审批或处理的任务",
    category: "business",
    class: "node-user",
    register: registerUser,
    property: markRaw(userProperty)
  },
  {
    type: "automation",
    text: "自动化",
    description: "系统自动执行的任务",
    category: "business",
    class: "node-automation",
    register: registerAutomation,
    property: markRaw(automationProperty)
  },
  {
    type: "chat",
    text: "群通知",
    description: "发送群组消息通知",
    category: "business",
    class: "node-chat",
    register: registerChat,
    property: markRaw(chatProperty),
    iconSVG:
      "M832 192H192c-35.3 0-64 28.7-64 64v448c0 35.3 28.7 64 64 64h160l128 128 128-128h160c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64z m-320 448c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z m192 0c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z m-384 0c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"
  },
  // 网关节点
  {
    type: "condition",
    text: "条件",
    description: "根据条件进行分支选择",
    category: "gateway",
    class: "node-condition",
    register: registerCondition,
    property: markRaw(conditionProperty)
  },
  {
    type: "parallel",
    text: "并行",
    description: "流程分支同时执行",
    category: "gateway",
    class: "node-parallel",
    register: registerParallel
  },
  {
    type: "selective",
    text: "则并",
    description: "根据条件并行的网关",
    category: "gateway",
    class: "node-selective",
    register: registerSelective
  },
  {
    type: "inclusion",
    text: "包容",
    description: "包含网关",
    category: "gateway",
    class: "node-inclusion",
    register: registerInclusion
  },
  // 边连线（特殊处理）
  {
    type: "polyline",
    text: "连线属性",
    description: "配置节点间的连接关系和条件",
    category: "edge",
    class: "node-polyline",
    register: registerPolyline,
    property: markRaw(edgeProperty)
  }
]

/**
 * 统一注册所有节点和边
 */
export const registerAllNodes = (lf: any) => {
  WORKFLOW_NODES.forEach((node) => {
    node.register(lf)
  })
}

/**
 * 获取节点配置
 */
export const getNodeConfig = (type: string) => {
  return WORKFLOW_NODES.find((node) => node.type === type)
}
