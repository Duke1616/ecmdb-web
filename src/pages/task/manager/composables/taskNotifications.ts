import { cloneDeep } from "lodash-es"
import { NotificationChannel, NotificationTriggerStatus, type ExecutionNotificationRule } from "@/api/task/manager/type"

/** 前端按多个执行终态归并后的通知配置。 */
export interface ExecutionNotificationGroup {
  /** 使用该模板、渠道和接收者配置的执行终态。 */
  trigger_statuses: NotificationTriggerStatus[]
  recipients: ExecutionNotificationRule["recipients"]
  channels: ExecutionNotificationRule["channels"]
  /** 模板集 ID；0 表示使用 ETask 内置默认模板集。 */
  template_set_id: number
  enabled: boolean
}

/** ETask 内置任务执行通知模板集的保留 ID，0 表示使用默认模板。 */
export const ETASK_DEFAULT_TEMPLATE_SET_ID = 0

/** 校验通知配置组是否具备完整的终态、模板、渠道和接收对象。 */
export const validateExecutionNotificationGroups = (groups: ExecutionNotificationGroup[]): string | undefined => {
  const statuses = new Set<NotificationTriggerStatus>()

  for (const [index, group] of groups.entries()) {
    const prefix = `第 ${index + 1} 条执行通知`
    if (group.trigger_statuses.length === 0) return `${prefix}请至少选择一个触发状态`

    for (const status of group.trigger_statuses) {
      if (statuses.has(status)) return `${prefix}与其他规则的触发状态重复`
      statuses.add(status)
    }

    const templateSetID = Number(group.template_set_id)
    if (!Number.isSafeInteger(templateSetID) || templateSetID < 0) return `${prefix}请选择有效的模板集`
    if (
      templateSetID === ETASK_DEFAULT_TEMPLATE_SET_ID &&
      group.channels.some((channel) => channel !== NotificationChannel.LARK_CARD)
    ) {
      return `${prefix}系统默认模板目前仅支持飞书卡片，请选择自定义模板集`
    }
    if (group.channels.length === 0) return `${prefix}请至少选择一个通知渠道`
    if (group.recipients.length === 0) return `${prefix}请配置接收者`

    const hasInvalidTarget = group.recipients.some(
      (recipient) =>
        recipient.target_ids.length === 0 || recipient.target_ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    )
    if (hasInvalidTarget) return `${prefix}包含无效的接收者 ID，请重新配置接收者`
  }

  return undefined
}

/** 创建一组尚待补充模板、渠道和接收者的默认通知配置。 */
export const createDefaultExecutionNotificationGroup = (
  status: NotificationTriggerStatus = NotificationTriggerStatus.FAILED
): ExecutionNotificationGroup => ({
  trigger_statuses: [status],
  recipients: [],
  channels: [NotificationChannel.LARK_CARD],
  template_set_id: ETASK_DEFAULT_TEMPLATE_SET_ID,
  enabled: true
})

const notificationStatusOrder: NotificationTriggerStatus[] = [
  NotificationTriggerStatus.FAILED,
  NotificationTriggerStatus.SUCCESS,
  NotificationTriggerStatus.CANCELLED
]

const notificationConfigKey = (rule: ExecutionNotificationRule) =>
  JSON.stringify({
    enabled: rule.enabled,
    template_set_id: rule.template_set_id ?? ETASK_DEFAULT_TEMPLATE_SET_ID,
    channels: [...rule.channels].sort(),
    recipients: rule.recipients
      .map((recipient) => ({ type: recipient.type, target_ids: [...recipient.target_ids].sort((a, b) => a - b) }))
      .sort((a, b) => a.type.localeCompare(b.type))
  })

/** 将后端单终态规则合并为前端多终态配置组。 */
export const groupExecutionNotifications = (rules: ExecutionNotificationRule[]): ExecutionNotificationGroup[] => {
  const groups = new Map<string, ExecutionNotificationGroup>()

  for (const rule of rules) {
    const key = notificationConfigKey(rule)
    const existing = groups.get(key)
    if (existing) {
      if (!existing.trigger_statuses.includes(rule.trigger_status)) existing.trigger_statuses.push(rule.trigger_status)
      continue
    }

    groups.set(key, {
      trigger_statuses: [rule.trigger_status],
      recipients: cloneDeep(rule.recipients),
      channels: cloneDeep(rule.channels),
      template_set_id: rule.template_set_id ?? ETASK_DEFAULT_TEMPLATE_SET_ID,
      enabled: rule.enabled
    })
  }

  return [...groups.values()].map((group) => ({
    ...group,
    trigger_statuses: notificationStatusOrder.filter((status) => group.trigger_statuses.includes(status))
  }))
}

/** 将前端多终态配置组展开为后端要求的一终态一规则结构。 */
export const expandExecutionNotificationGroups = (groups: ExecutionNotificationGroup[]): ExecutionNotificationRule[] =>
  groups.flatMap((group) =>
    group.trigger_statuses.map((status) => ({
      trigger_status: status,
      recipients: cloneDeep(group.recipients),
      channels: cloneDeep(group.channels),
      template_set_id: group.template_set_id,
      enabled: group.enabled
    }))
  )
