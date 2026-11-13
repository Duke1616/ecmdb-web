import type { taskRecord, taskTimelineEvent } from "@/api/ticket/manager/types/manager"

/**
 * 任务流转记录状态枚举（消除魔数）
 */
export enum TaskRecordStatus {
  /** 节点或签联动处理（例如其他审批人已处理导致该任务联动完成） */
  OrSignLinked = 0,
  /** 确认通过（若为自动化节点则为自动通过） */
  Passed = 1,
  /** 手动驳回（人工审批驳回） */
  Rejected = 2,
  /** 系统通过（自动化脚本/系统任务执行成功） */
  SystemPassed = 3,
  /** 系统驳回（系统执行失败或算法判定未通过） */
  SystemRejected = 4,
  /** 系统跳过（条件不满足被流程引擎自动跳过） */
  SystemSkipped = 5
}

/**
 * 任务完成状态标识
 */
export enum TaskFinishStatus {
  Unfinished = 0,
  Finished = 1
}

/**
 * 格式化处理人名称，对系统标识统一转换为易读的“系统”
 */
export const formatOperator = (name?: string): string => {
  if (!name) return "-"
  const lower = name.trim().toLowerCase()
  if (lower === "system" || lower === "automation" || lower === "sys_skipped") {
    return "系统"
  }
  return name
}

/**
 * 判断处理人是否为系统角色
 */
export const isSystemActor = (name?: string): boolean => {
  if (!name) return false
  const lower = name.trim().toLowerCase()
  return lower === "system" || lower === "automation" || lower === "sys_skipped"
}

/**
 * 获取单条处理明细的标签类型
 */
export const getTaskTagType = (row: taskRecord): "success" | "danger" | "info" | "warning" => {
  if (row.is_finished !== TaskFinishStatus.Finished) {
    return "warning"
  }
  switch (row.status) {
    case TaskRecordStatus.Passed:
    case TaskRecordStatus.SystemPassed:
      return "success"
    case TaskRecordStatus.Rejected:
    case TaskRecordStatus.SystemRejected:
    case TaskRecordStatus.OrSignLinked:
      return "danger"
    case TaskRecordStatus.SystemSkipped:
      return "info"
    default:
      return "warning"
  }
}

/**
 * 获取单条处理明细的中文标签
 */
export const getTaskTagLabel = (row: taskRecord): string => {
  if (row.is_finished !== TaskFinishStatus.Finished) {
    return "等待处理"
  }

  const isAutomation = row.node_name?.startsWith("自动化-") ?? false

  switch (row.status) {
    case TaskRecordStatus.Passed:
      return isAutomation ? "自动通过" : "确认通过"
    case TaskRecordStatus.SystemPassed:
      return "系统通过"
    case TaskRecordStatus.SystemRejected:
      return "系统驳回"
    case TaskRecordStatus.Rejected:
      return "手动驳回"
    case TaskRecordStatus.SystemSkipped:
      return "系统跳过"
    case TaskRecordStatus.OrSignLinked:
      return "节点或签联动处理"
    default:
      return "已处理"
  }
}

/**
 * 根据批次成员实际记录（members）校准批次统计 summary
 * 解决后端批次聚合时可能把系统驳回（status: 4）混算入 rejected 的问题，确保卡片外层与内层处理标签完全一致
 */
export const resolveTimelineSummary = (event: taskTimelineEvent) => {
  const isSystemNode = event.actors.length === 0 || event.actors.every((a) => isSystemActor(a))

  if (!event.members || event.members.length === 0) {
    if (isSystemNode && event.summary?.rejected > 0) {
      return {
        ...event.summary,
        system_rejected: (event.summary.system_rejected || 0) + event.summary.rejected,
        rejected: 0
      }
    }
    return event.summary
  }

  let passed = 0
  let rejected = 0
  let system_passed = 0
  let system_rejected = 0
  let skipped = 0
  let linked = 0
  let pending = 0

  for (const m of event.members) {
    if (m.is_finished !== TaskFinishStatus.Finished) {
      pending++
      continue
    }

    const isAutomation = m.node_name?.startsWith("自动化-") ?? false
    switch (m.status) {
      case TaskRecordStatus.Passed:
        if (isAutomation) {
          system_passed++
        } else {
          passed++
        }
        break
      case TaskRecordStatus.Rejected:
        rejected++
        break
      case TaskRecordStatus.SystemPassed:
        system_passed++
        break
      case TaskRecordStatus.SystemRejected:
        system_rejected++
        break
      case TaskRecordStatus.SystemSkipped:
        skipped++
        break
      case TaskRecordStatus.OrSignLinked:
        linked++
        break
      default:
        break
    }
  }

  if (isSystemNode && rejected > 0) {
    system_rejected += rejected
    rejected = 0
  }

  return {
    total: event.members.length,
    passed,
    rejected,
    system_passed,
    system_rejected,
    skipped,
    linked,
    pending
  }
}

/**
 * 获取批次时间线卡片外层的标签样式类型
 */
export const getTimelineTagType = (event: taskTimelineEvent): "warning" | "danger" | "success" | "info" => {
  const summary = event.summary
  if (!summary) return "warning"
  if (summary.pending > 0) return "warning"
  if (summary.rejected > 0 || summary.system_rejected > 0) return "danger"
  if (summary.passed > 0 || summary.system_passed > 0) return "success"
  if (summary.skipped > 0) return "info"
  return "warning"
}

/**
 * 获取批次时间线卡片外层的标签文字
 */
export const getTimelineTagLabel = (event: taskTimelineEvent): string => {
  const summary = event.summary
  if (!summary) return "已处理"
  if (summary.pending > 0) return "等待处理"
  if (summary.rejected > 0) return "手动驳回"
  if (summary.system_rejected > 0) return "系统驳回"
  if (summary.passed > 0) return "确认通过"
  if (summary.system_passed > 0) return "系统通过"
  if (summary.skipped > 0) return "系统跳过"
  return "已处理"
}

/**
 * 获取批次时间线摘要统计描述
 */
export const getTimelineSummary = (event: taskTimelineEvent): string => {
  const summary = event.summary
  if (!summary) return "暂无处理结果"

  const parts: string[] = []
  if (summary.passed > 0) parts.push(`${summary.passed} 人通过`)
  if (summary.rejected > 0) parts.push(`${summary.rejected} 人驳回`)
  if (summary.system_passed > 0) parts.push(`${summary.system_passed} 人系统通过`)
  if (summary.system_rejected > 0) parts.push(`${summary.system_rejected} 人系统驳回`)
  if (summary.linked > 0) parts.push(`${summary.linked} 人节点或签联动处理`)
  if (summary.skipped > 0) parts.push(`${summary.skipped} 人系统跳过`)
  if (summary.pending > 0) parts.push(`${summary.pending} 人待处理`)

  return parts.join("，") || (summary.total > 0 ? `${summary.total} 人已处理` : "暂无处理结果")
}

/**
 * 获取时间线节点圆点类型
 */
export const getTimelineItemType = (event: taskTimelineEvent): "danger" | "success" | "primary" => {
  const type = getTimelineTagType(event)
  return type === "danger" ? "danger" : type === "success" ? "success" : "primary"
}

/**
 * 获取时间线节点圆点颜色
 */
export const getTimelineItemColor = (event: taskTimelineEvent): string => {
  if (event.summary && event.summary.pending > 0) return "#909399"
  return ""
}
