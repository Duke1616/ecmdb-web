/**
 * 接收者规则到 Tab 的映射关系
 */
export const RULE_TO_TAB_MAP: Record<string, string> = {
  appoint: "user",
  founder: "system",
  template: "template",
  leaders: "system",
  main_leader: "system",
  on_call: "on_call",
  team: "team",
  department: "department"
}

/**
 * 接收者规则的短标签映射
 */
export const RULE_SHORT_LABEL_MAP: Record<string, string> = {
  appoint: "人员",
  founder: "创建人",
  template: "模板",
  leaders: "负责人",
  main_leader: "分管",
  on_call: "值班",
  team: "团队",
  department: "部门"
}

/**
 * 广播选项配置
 */
export const BROADCAST_OPTIONS = [
  { label: "自动化任务返回信息", value: "auto_task" },
  { label: "工单提交基本信息", value: "ticket_data" },
  { label: "节点表单提交信息", value: "user_input" }
]

/**
 * 校验动态群组名称规则
 */
export const validateChatGroupNameRule = (value: string): string | null => {
  if (!value) return null

  // 1. 检查大括号闭合
  const openBraces = (value.match(/\{\{/g) || []).length
  const closeBraces = (value.match(/\}\}/g) || []).length
  if (openBraces !== closeBraces) {
    return "变量语法错误：大括号未成对闭合"
  }

  // 2. 检查非法变量
  const allVars = value.match(/\{\{(.+?)\}\}/g) || []
  const allowedBaseVars = ["ticket_id", "template", "creator"]

  for (const v of allVars) {
    const inner = v.slice(2, -2).trim()
    if (!allowedBaseVars.includes(inner) && !inner.startsWith("field.")) {
      return `不支持的变量: {{${inner}}}`
    }
  }

  return null
}
