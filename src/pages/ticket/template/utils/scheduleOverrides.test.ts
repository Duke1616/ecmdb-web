import { describe, expect, it } from "vitest"
import { extractScheduleDateTimeGroups, extractScheduleRequirements, extractTemplateFields } from "./scheduleOverrides"

describe("scheduleOverrides", () => {
  it("从嵌套的 form-create 规则中提取可映射字段", () => {
    expect(
      extractTemplateFields([
        {
          type: "fcRow",
          children: [
            { type: "inputNumber", field: "delay", title: "延迟时长" },
            { type: "datePicker", field: "date", title: "日期", props: { type: "date" } },
            { type: "timePicker", field: "time", title: "时间", props: {} }
          ]
        }
      ])
    ).toEqual([
      { field: "delay", title: "延迟时长", kind: "number" },
      { field: "date", title: "日期", kind: "date" },
      { field: "time", title: "时间", kind: "time" }
    ])
  })

  it("提取启用调度的节点及其保底延迟", () => {
    expect(
      extractScheduleRequirements({
        edges: [],
        nodes: [
          {
            id: "fixed",
            type: "automation",
            x: 0,
            y: 0,
            properties: { schedule: { type: "immediate" } }
          },
          {
            id: "dynamic",
            type: "automation",
            x: 0,
            y: 0,
            properties: {
              name: "预约部署",
              schedule: { type: "delay", source: { type: "fixed", value: 2 }, unit: "hour" }
            }
          },
          {
            id: "legacy",
            type: "automation",
            x: 0,
            y: 0,
            properties: {
              name: "历史节点",
              is_timing: true,
              exec_method: "hand",
              quantity: 30,
              unit: 1
            }
          }
        ]
      })
    ).toEqual([
      {
        nodeId: "dynamic",
        nodeName: "预约部署",
        fallbackValue: 2,
        fallbackUnit: "hour"
      },
      {
        nodeId: "legacy",
        nodeName: "历史节点",
        fallbackValue: 30,
        fallbackUnit: "minute"
      }
    ])
  })

  it("只把带调度语义的日期和时间识别为一个计划执行时间组件", () => {
    const fields = extractTemplateFields([
      {
        type: "fcRow",
        children: [
          {
            type: "datePicker",
            field: "schedule_date",
            title: "调度日期"
          },
          {
            type: "timePicker",
            field: "schedule_time",
            title: "调度时间"
          },
          { type: "datePicker", field: "birthday", title: "生日" }
        ]
      }
    ])

    expect(extractScheduleDateTimeGroups(fields)).toEqual([
      {
        id: "schedule_1:0",
        label: "调度日期 + 调度时间",
        description: "schedule_date / schedule_time",
        dateField: "schedule_date",
        timeField: "schedule_time"
      }
    ])
  })
})
