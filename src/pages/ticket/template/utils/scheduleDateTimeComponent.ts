import type { DragRule } from "@form-create/designer"

export const SCHEDULE_DATETIME_COMPONENT_NAME = "scheduleDateTime"

interface DesignerRule {
  type?: string
  field?: string
  props?: Record<string, unknown>
  style?: unknown
  children?: DesignerRule[]
  [key: string]: unknown
}

const READABLE_SCHEDULE_FIELD_PATTERN = /^schedule_(date|time)(?:_(\d+))?$/
const LEGACY_SCHEDULE_FIELD_PATTERN = /^(schedule_.+)_(date|time)$/

/** 计划执行时间字段在日期、时间配对中的身份信息。 */
export interface ScheduleFieldIdentity {
  groupId: string
  part: "date" | "time"
  index?: number
}

/** 解析新旧两种计划执行时间字段名，并返回其配对标识。 */
export const parseScheduleFieldName = (field: string | undefined): ScheduleFieldIdentity | undefined => {
  if (!field) return undefined

  const readable = field.match(READABLE_SCHEDULE_FIELD_PATTERN)
  if (readable) {
    const index = Number(readable[2] || 1)
    return { groupId: `schedule_${index}`, part: readable[1] as "date" | "time", index }
  }

  const legacy = field.match(LEGACY_SCHEDULE_FIELD_PATTERN)
  if (!legacy) return undefined
  return { groupId: legacy[1], part: legacy[2] as "date" | "time" }
}

const createFieldName = (index: number, part: "date" | "time") =>
  index === 1 ? `schedule_${part}` : `schedule_${part}_${index}`

/** 根据模板现有字段计算下一组可用的计划执行时间编号。 */
export const getNextScheduleGroupIndex = (value: unknown): number => {
  let rules: unknown = value
  if (typeof value === "string") {
    try {
      rules = JSON.parse(value)
    } catch {
      return 1
    }
  }
  if (!Array.isArray(rules)) return 1

  let maxIndex = 0
  const visit = (items: DesignerRule[]) => {
    items.forEach((rule) => {
      const identity = parseScheduleFieldName(rule.field)
      if (identity?.index) maxIndex = Math.max(maxIndex, identity.index)
      if (Array.isArray(rule.children)) visit(rule.children)
    })
  }
  visit(rules as DesignerRule[])
  return maxIndex + 1
}

/** 创建由原生栅格、日期和时间组成的计划执行时间拖拽预设。 */
export const createScheduleDateTimeDragRule = (takeGroupIndex?: () => number): DragRule => {
  let fallbackIndex = 1
  const nextGroupIndex = takeGroupIndex || (() => fallbackIndex++)

  return {
    name: SCHEDULE_DATETIME_COMPONENT_NAME,
    label: "计划执行时间",
    icon: "icon-date",
    menu: "main",
    languageKey: [],
    mask: false,
    handleBtn: ["delete"],
    rule() {
      const groupIndex = nextGroupIndex()
      return {
        type: "fcRow",
        props: {},
        children: [
          {
            type: "col",
            props: { span: 12 },
            children: [
              {
                type: "datePicker",
                field: createFieldName(groupIndex, "date"),
                title: "调度日期",
                $required: true,
                props: {}
              }
            ]
          },
          {
            type: "col",
            props: { span: 12 },
            children: [
              {
                type: "timePicker",
                field: createFieldName(groupIndex, "time"),
                title: "调度时间",
                $required: true,
                props: {}
              }
            ]
          }
        ]
      } as any
    },
    props() {
      return []
    },
    parseRule(rule) {
      // 组合项只负责首次装配；保存后全部按 form-create 原生组件重新识别。
      delete (rule as any)._fc_drag_tag
    }
  }
}

const normalizeRules = (rules: DesignerRule[]): DesignerRule[] => {
  const normalizeRule = (source: DesignerRule): { rule: DesignerRule; scheduleParts: Map<string, Set<string>> } => {
    const rule: DesignerRule = { ...source }
    const scheduleParts = new Map<string, Set<string>>()

    if (Array.isArray(source.children)) {
      rule.children = source.children.map((child) => {
        const normalized = normalizeRule(child)
        normalized.scheduleParts.forEach((parts, groupId) => {
          const current = scheduleParts.get(groupId) || new Set<string>()
          parts.forEach((part) => current.add(part))
          scheduleParts.set(groupId, current)
        })
        return normalized.rule
      })
    }

    const scheduleField = parseScheduleFieldName(rule.field)
    if (scheduleField) {
      rule.props = {}
      delete rule.style
      scheduleParts.set(scheduleField.groupId, new Set([scheduleField.part]))
    }

    const containsCompleteGroup = Array.from(scheduleParts.values()).some(
      (parts) => parts.has("date") && parts.has("time")
    )
    if (String(rule.type).toLowerCase() === "fcrow" && containsCompleteGroup) {
      rule.props = {}
    }

    return { rule, scheduleParts }
  }

  return rules.map((rule) => normalizeRule(rule).rule)
}

/**
 * 将旧版计划执行时间预设还原为 form-create 原生栅格、日期和时间组件的默认外观。
 * 仅处理专用的 schedule_date / schedule_time 及其旧版字段，不影响普通表单组件。
 */
export const normalizeScheduleDateTimeRules = (value: unknown): unknown => {
  const isJson = typeof value === "string"
  let rules: unknown = value

  if (isJson) {
    try {
      rules = JSON.parse(value)
    } catch {
      return value
    }
  }
  if (!Array.isArray(rules)) return value

  const normalized = normalizeRules(rules as DesignerRule[])
  return isJson ? JSON.stringify(normalized) : normalized
}
