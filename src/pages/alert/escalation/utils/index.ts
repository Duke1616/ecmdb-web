/**
 * 消息升级相关工具函数
 */

import type { ConfigVO, StepVO, StepTemplateVO } from "@/api/alert/escalation/types"

/**
 * 格式化时间戳
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return ""

  const date = new Date(timestamp * 1000)

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  const parts = formatter.formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value || "0000"
  const month = parts.find((part) => part.type === "month")?.value || "00"
  const day = parts.find((part) => part.type === "day")?.value || "00"
  const hour = parts.find((part) => part.type === "hour")?.value || "00"
  const minute = parts.find((part) => part.type === "minute")?.value || "00"

  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

/**
 * 获取紧急程度标签类型
 * @param level 紧急程度级别
 * @returns 标签类型
 */
export const getUrgencyType = (level: number): string => {
  const types = ["", "success", "info", "warning", "danger", "danger"]
  return types[level] || "info"
}

/**
 * 获取紧急程度标签文字
 * @param level 紧急程度级别
 * @returns 标签文字
 */
export const getUrgencyLabel = (level: number): string => {
  const labels = ["", "低", "较低", "中等", "高", "紧急"]
  return labels[level] || "未知"
}

/**
 * 获取渠道标签文字
 * @param channelType 渠道类型
 * @returns 渠道标签文字
 */
export const getChannelLabel = (channelType: string): string => {
  const channelLabels: Record<string, string> = {
    email: "邮件",
    sms: "短信",
    webhook: "Webhook",
    dingtalk: "钉钉",
    wechat: "微信",
    slack: "Slack"
  }
  return channelLabels[channelType] || channelType
}

/**
 * 获取配置状态标签类型
 * @param enabled 是否启用
 * @returns 标签类型
 */
export const getConfigStatusType = (enabled: boolean): string => {
  return enabled ? "success" : "info"
}

/**
 * 获取配置状态标签文字
 * @param enabled 是否启用
 * @returns 标签文字
 */
export const getConfigStatusLabel = (enabled: boolean): string => {
  return enabled ? "已启用" : "已禁用"
}

/**
 * 验证升级配置数据
 * @param config 升级配置数据
 * @returns 验证结果
 */
export const validateEscalationConfig = (config: Partial<ConfigVO>) => {
  if (!config.name || config.name.trim() === "") {
    return { valid: false, message: "配置名称不能为空" }
  }

  if (!config.key || config.key.trim() === "") {
    return { valid: false, message: "配置标识不能为空" }
  }

  if (!config.triggers || config.triggers.length === 0) {
    return { valid: false, message: "至少需要添加一个触发条件" }
  }

  if (!config.steps || config.steps.length === 0) {
    return { valid: false, message: "至少需要添加一个升级步骤" }
  }

  return { valid: true }
}

/**
 * 验证升级步骤数据
 * @param step 升级步骤数据
 * @returns 验证结果
 */
export const validateEscalationStep = (step: Partial<StepVO>) => {
  if (!step.level || step.level < 1 || step.level > 10) {
    return { valid: false, message: "升级级别必须在 1-10 之间" }
  }

  if (!step.template_set_id || step.template_set_id <= 0) {
    return { valid: false, message: "模板集ID必须大于0" }
  }

  if (step.delay && step.delay < 0) {
    return { valid: false, message: "延迟时间不能小于0" }
  }

  if (step.max_retries && (step.max_retries < 0 || step.max_retries > 10)) {
    return { valid: false, message: "最大重试次数必须在 0-10 之间" }
  }

  if (step.retry_interval && step.retry_interval < 1) {
    return { valid: false, message: "重试间隔必须大于0" }
  }

  if (step.urgency_level && (step.urgency_level < 1 || step.urgency_level > 5)) {
    return { valid: false, message: "紧急程度必须在 1-5 之间" }
  }

  return { valid: true }
}

/**
 * 验证升级步骤模板数据
 * @param template 升级步骤模板数据
 * @returns 验证结果
 */
export const validateStepTemplate = (template: Partial<StepTemplateVO>) => {
  if (!template.name || template.name.trim() === "") {
    return { valid: false, message: "模板名称不能为空" }
  }

  if (!template.channels || template.channels.length === 0) {
    return { valid: false, message: "至少需要添加一个通知渠道" }
  }

  if (!template.receivers || template.receivers.length === 0) {
    return { valid: false, message: "至少需要添加一个接收者" }
  }

  return { valid: true }
}

/**
 * 生成默认的升级配置数据
 * @returns 默认配置数据
 */
export const getDefaultEscalationConfig = () => {
  return {
    biz_id: 1,
    key: "",
    name: "",
    description: "",
    enabled: true,
    timeout: 300,
    triggers: [],
    trigger_logic: { operator: "AND", conditions: [] },
    steps: [],
    created_by: "admin"
  }
}

/**
 * 生成默认的升级步骤数据
 * @param configId 配置ID
 * @param level 升级级别
 * @returns 默认步骤数据
 */
export const getDefaultEscalationStep = (configId: number, level: number = 1) => {
  return {
    config_id: configId,
    level,
    template_set_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 60,
    skip_if_handled: false,
    continue_on_fail: true,
    condition_expr: "",
    urgency_level: 1
  }
}

/**
 * 生成默认的升级步骤模板数据
 * @returns 默认模板数据
 */
export const getDefaultStepTemplate = () => {
  return {
    name: "",
    description: "",
    channels: [],
    receivers: []
  }
}
