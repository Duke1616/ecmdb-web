import { describe, expect, it } from "vitest"
import {
  createScheduleDateTimeDragRule,
  getNextScheduleGroupIndex,
  normalizeScheduleDateTimeRules,
  parseScheduleFieldName
} from "./scheduleDateTimeComponent"

describe("scheduleDateTimeComponent", () => {
  it("生成外层栅格以及左右日期、时间字段", () => {
    const dragRule = createScheduleDateTimeDragRule()
    const rule = dragRule.rule({ t: (value: string) => value } as any) as any

    expect(rule.type).toBe("fcRow")
    expect(rule.props).toEqual({})
    expect(rule.children).toHaveLength(2)
    expect(rule.children[0]).toMatchObject({ type: "col", props: { span: 12 } })
    expect(rule.children[1]).toMatchObject({ type: "col", props: { span: 12 } })
    expect(rule.children[0].children[0]).toMatchObject({
      type: "datePicker",
      title: "调度日期",
      props: {}
    })
    expect(rule.children[1].children[0]).toMatchObject({
      type: "timePicker",
      title: "调度时间",
      props: {}
    })
    expect(rule.children[0].children[0].style).toBeUndefined()
    expect(rule.children[0].children[0].props.placeholder).toBeUndefined()
    expect(rule.children[1].children[0].style).toBeUndefined()
    expect(rule.children[1].children[0].props.placeholder).toBeUndefined()
    expect(rule.children[0].children[0].field).toBe("schedule_date")
    expect(rule.children[1].children[0].field).toBe("schedule_time")

    const secondRule = dragRule.rule({ t: (value: string) => value } as any) as any
    expect(secondRule.children[0].children[0].field).toBe("schedule_date_2")
    expect(secondRule.children[1].children[0].field).toBe("schedule_time_2")

    rule._fc_drag_tag = "scheduleDateTime"
    dragRule.parseRule?.(rule)
    expect(rule._fc_drag_tag).toBeUndefined()
  })

  it("清理旧预设保存的视觉属性且不影响普通日期字段", () => {
    const rules = [
      {
        type: "fcRow",
        props: { gutter: 16 },
        children: [
          {
            type: "col",
            props: { span: 12 },
            children: [
              {
                type: "datePicker",
                field: "schedule_group_date",
                props: { type: "date", valueFormat: "YYYY-MM-DD", placeholder: "请选择日期" },
                style: { width: "100%" }
              }
            ]
          },
          {
            type: "col",
            props: { span: 12 },
            children: [
              {
                type: "timePicker",
                field: "schedule_group_time",
                props: { isRange: false, valueFormat: "HH:mm:ss", placeholder: "请选择时间" },
                style: { width: "100%" }
              }
            ]
          }
        ]
      },
      {
        type: "datePicker",
        field: "birthday",
        props: { type: "date", placeholder: "出生日期" }
      }
    ]

    const normalized = normalizeScheduleDateTimeRules(rules) as any[]
    const row = normalized[0]
    const date = row.children[0].children[0]
    const time = row.children[1].children[0]

    expect(row.props).toEqual({})
    expect(date.props).toEqual({})
    expect(date.style).toBeUndefined()
    expect(time.props).toEqual({})
    expect(time.style).toBeUndefined()
    expect(normalized[1]).toEqual(rules[1])
    expect(rules[0].props).toEqual({ gutter: 16 })
  })

  it("保留 JSON 字符串形式并忽略无效内容", () => {
    const value = JSON.stringify([
      {
        type: "datePicker",
        field: "schedule_group_date",
        props: { placeholder: "请选择日期" }
      }
    ])

    expect(typeof normalizeScheduleDateTimeRules(value)).toBe("string")
    expect(JSON.parse(normalizeScheduleDateTimeRules(value) as string)[0].props).toEqual({})
    expect(normalizeScheduleDateTimeRules("not-json")).toBe("not-json")
  })

  it("兼容可读字段名和旧版 UUID 字段名", () => {
    expect(parseScheduleFieldName("schedule_date")).toEqual({ groupId: "schedule_1", part: "date", index: 1 })
    expect(parseScheduleFieldName("schedule_time_2")).toEqual({ groupId: "schedule_2", part: "time", index: 2 })
    expect(parseScheduleFieldName("schedule_abc-123_date")).toEqual({
      groupId: "schedule_abc-123",
      part: "date"
    })
    expect(parseScheduleFieldName("birthday")).toBeUndefined()
    expect(
      getNextScheduleGroupIndex([
        { type: "datePicker", field: "schedule_date" },
        { type: "timePicker", field: "schedule_time_3" },
        { type: "datePicker", field: "schedule_legacy_date" }
      ])
    ).toBe(4)
  })
})
