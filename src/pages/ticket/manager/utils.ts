const SYSTEM_ACTORS = ["system", "automation", "sys_skipped"]

export const isSystemActor = (name?: string): boolean => {
  if (!name) return false
  return SYSTEM_ACTORS.includes(name.trim().toLowerCase())
}

export const formatOperator = (name?: string): string => {
  if (!name) return "-"
  return isSystemActor(name) ? "系统" : name
}

// action 协议："todo"=待办审批，"history"=历史查看，"my"=发起人，"my-<环节>"=发起人按当前环节
export const buildInitiatorAction = (step?: string) => `my-${step}`

export const isInitiatorStepAction = (action: string) => action.startsWith("my-")

export const isHistoryModeAction = (action: string) => action === "history" || isInitiatorStepAction(action)

export const isTemplateReadonlyAction = (action: string) => action !== "my" && action !== "my-Start"

const DETAIL_TITLES: Record<string, string> = {
  todo: "待办审批",
  my: "我的工单",
  "my-Start": "我的工单",
  history: "历史工单",
  view: "查看详情"
}

export const getDetailTitle = (action: string) => DETAIL_TITLES[action] || "审批服务"