/**
 * 升级步骤模板相关工具函数
 */

import { RECEIVER_TYPES } from "@/api/alert/escalation/types"

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return "暂无"

  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

/**
 * 获取接收者类型标签
 */
export const getReceiverTypeLabel = (type: string) => {
  const typeMap = {
    [RECEIVER_TYPES.USER]: "用户",
    [RECEIVER_TYPES.TEAM]: "团队",
    [RECEIVER_TYPES.DEPARTMENT]: "部门",
    [RECEIVER_TYPES.ONCALL]: "排班"
  }
  return typeMap[type as keyof typeof typeMap] || "未知类型"
}

/**
 * 获取接收者类型标签颜色
 */
export const getReceiverTypeTagType = (type: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap = {
    [RECEIVER_TYPES.USER]: "primary" as const,
    [RECEIVER_TYPES.TEAM]: "success" as const,
    [RECEIVER_TYPES.DEPARTMENT]: "warning" as const,
    [RECEIVER_TYPES.ONCALL]: "info" as const
  }
  return typeMap[type as keyof typeof typeMap] || "info"
}

/**
 * 获取接收者tooltip内容
 */
export const getReceiverTooltipContent = (receiver: any) => {
  const typeLabel = getReceiverTypeLabel(receiver.type)
  const metadata = receiver.metadata || {}

  let content = `接收者: ${receiver.display_name}\n类型: ${typeLabel}`

  // 根据不同类型添加额外信息
  if (receiver.type === RECEIVER_TYPES.USER && metadata.email) {
    content += `\n邮箱: ${metadata.email}`
  } else if (receiver.type === RECEIVER_TYPES.TEAM && metadata.description) {
    content += `\n描述: ${metadata.description}`
  } else if (receiver.type === RECEIVER_TYPES.DEPARTMENT && metadata.path) {
    content += `\n路径: ${metadata.path}`
  } else if (receiver.type === RECEIVER_TYPES.ONCALL && metadata.schedule) {
    content += `\n排班: ${metadata.schedule}`
  }

  return content
}
