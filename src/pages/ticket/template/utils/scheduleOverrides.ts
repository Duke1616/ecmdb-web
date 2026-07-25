import type { WorkflowGraphData } from "@/api/ticket/workflow/types/workflow"
import {
  resolveFallbackSchedule,
  type ScheduleUnit
} from "@/common/components/workflow/RegisterNode/automation/schedule"
import { parseScheduleFieldName } from "./scheduleDateTimeComponent"

export type TemplateScheduleType = "delay" | "at"
export type { ScheduleUnit }
export type TemplateFieldKind = "number" | "date" | "datetime" | "time"

/** 可由当前模板覆盖调度策略的自动化节点。 */
export interface ScheduleRequirement {
  nodeId: string
  nodeName: string
  fallbackValue: number
  fallbackUnit: ScheduleUnit
}

interface TemplateFieldOption {
  field: string
  title: string
  kind: TemplateFieldKind
}

interface ScheduleDateTimeFieldGroup {
  id: string
  label: string
  description: string
  dateField: string
  timeField: string
}

interface RawRule {
  type?: string
  field?: string
  title?: string
  props?: Record<string, unknown>
  children?: RawRule[]
}

const parseJsonValue = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const classifyField = (rule: RawRule): TemplateFieldKind | undefined => {
  const type = String(rule.type || "").toLowerCase()
  if (type === "number" || type === "inputnumber") return "number"
  if (type === "date") return "date"
  if (type === "datetime") return "datetime"
  if (type === "time") return "time"
  if (type === "timepicker") return rule.props?.isRange ? undefined : "time"
  if (type !== "datepicker") return undefined

  const pickerType = String(rule.props?.type || "date").toLowerCase()
  if (pickerType === "datetime") return "datetime"
  if (pickerType === "date") return "date"
  return undefined
}

/** 提取模板中可参与调度配置的表单字段。 */
export const extractTemplateFields = (value: unknown): TemplateFieldOption[] => {
  const result: TemplateFieldOption[] = []
  const visit = (rules: RawRule[]) => {
    rules.forEach((rule) => {
      const kind = classifyField(rule)
      if (kind && rule.field) {
        result.push({ field: rule.field, title: rule.title || rule.field, kind })
      }
      if (Array.isArray(rule.children)) visit(rule.children)
    })
  }
  visit(parseJsonValue<RawRule[]>(value, []))
  return result
}

/** 将“计划执行时间”组合控件中的日期、时间字段重新配对。 */
export const extractScheduleDateTimeGroups = (fields: TemplateFieldOption[]): ScheduleDateTimeFieldGroup[] => {
  const groups = new Map<string, { dates: TemplateFieldOption[]; times: TemplateFieldOption[] }>()
  fields.forEach((field) => {
    const scheduleField = parseScheduleFieldName(field.field)
    if (!scheduleField) return
    const group = groups.get(scheduleField.groupId) || { dates: [], times: [] }
    if (scheduleField.part === "date" && field.kind === "date") group.dates.push(field)
    if (scheduleField.part === "time" && field.kind === "time") group.times.push(field)
    groups.set(scheduleField.groupId, group)
  })

  const result = Array.from(groups.entries()).flatMap(([groupId, group]) =>
    group.dates.slice(0, Math.min(group.dates.length, group.times.length)).map((date, index) => {
      const time = group.times[index]
      return {
        id: `${groupId}:${index}`,
        label: `${date.title} + ${time.title}`,
        description: `${date.field} / ${time.field}`,
        dateField: date.field,
        timeField: time.field
      }
    })
  )
  return result
}

/** 提取启用了模板优先调度的自动化节点及其默认延迟。 */
export const extractScheduleRequirements = (flowData: WorkflowGraphData | undefined): ScheduleRequirement[] =>
  (flowData?.nodes || []).flatMap((node) => {
    if (node.type !== "automation") return []
    const properties = (node.properties || {}) as Record<string, unknown>
    const fallback = resolveFallbackSchedule(properties)
    if (fallback.type === "immediate") return []

    return [
      {
        nodeId: String(node.id),
        nodeName: String(properties.name || "自动化节点"),
        fallbackValue: fallback.source.value,
        fallbackUnit: fallback.unit
      }
    ]
  })
