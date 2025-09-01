import { Edit, Tools, Ticket, Check } from "@element-plus/icons-vue"

// 通用的步骤图标
export const WIZARD_ICONS = {
  EDIT: Edit,
  TOOLS: Tools,
  TICKET: Ticket,
  CHECK: Check
}

// 通用的步骤配置
export const COMMON_STEPS = {
  INFO: {
    title: "填写基本信息",
    description: "基本信息设置",
    icon: Edit
  },
  DESIGN: {
    title: "设计结构",
    description: "可视化设计",
    icon: Ticket
  },
  SETTING: {
    title: "配置设置",
    description: "参数和配置",
    icon: Tools
  }
}
