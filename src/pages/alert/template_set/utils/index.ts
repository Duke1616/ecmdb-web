/**
 * 模板集合相关工具函数
 */

import type { TemplateSetItem } from "@/api/alert/template_set/types"

/**
 * 格式化时间戳
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * 获取模板集合中的唯一渠道列表
 * @param items 模板集合条目列表
 * @returns 唯一渠道列表
 */
export const getUniqueChannels = (items: TemplateSetItem[]): string[] => {
  if (!items || items.length === 0) return []
  const channels = items.map((item) => item.channel)
  return [...new Set(channels)]
}

/**
 * 获取模板集合的渠道统计信息
 * @param items 模板集合条目列表
 * @returns 渠道统计信息
 */
export const getChannelStats = (items: TemplateSetItem[]) => {
  if (!items || items.length === 0) return []

  const channelMap = new Map<string, number>()
  items.forEach((item) => {
    const count = channelMap.get(item.channel) || 0
    channelMap.set(item.channel, count + 1)
  })

  return Array.from(channelMap.entries()).map(([channel, count]) => ({
    channel,
    count
  }))
}

/**
 * 验证模板集合条目数据
 * @param item 模板集合条目
 * @returns 验证结果
 */
export const validateTemplateSetItem = (item: Partial<TemplateSetItem>): { valid: boolean; message?: string } => {
  if (!item.channel) {
    return { valid: false, message: "请选择渠道类型" }
  }

  if (!item.template_id || item.template_id === 0) {
    return { valid: false, message: "请选择模板" }
  }

  return { valid: true }
}

/**
 * 批量验证模板集合条目数据
 * @param items 模板集合条目列表
 * @returns 验证结果
 */
export const validateTemplateSetItems = (items: Partial<TemplateSetItem>[]): { valid: boolean; message?: string } => {
  if (items.length === 0) {
    return { valid: false, message: "请至少添加一个条目" }
  }

  for (const item of items) {
    const result = validateTemplateSetItem(item)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}
