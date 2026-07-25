import { describe, expect, it } from "vitest"
import { resolveFallbackSchedule } from "./schedule"

describe("resolveFallbackSchedule", () => {
  it("将未开启的历史配置转换成立即执行", () => {
    expect(resolveFallbackSchedule({ is_timing: false })).toEqual({ type: "immediate" })
  })

  it("将 hand 历史配置转换成固定延迟", () => {
    expect(resolveFallbackSchedule({ is_timing: true, exec_method: "hand", quantity: 3, unit: 1 })).toEqual({
      type: "delay",
      source: { type: "fixed", value: 3 },
      unit: "minute"
    })
  })

  it("将 template 历史配置转换为一小时保底延迟", () => {
    expect(
      resolveFallbackSchedule({
        is_timing: true,
        exec_method: "template",
        template_id: 12,
        template_field: "delay"
      })
    ).toEqual({ type: "delay", source: { type: "fixed", value: 1 }, unit: "hour" })
  })

  it("保留新配置中的固定保底延迟", () => {
    expect(
      resolveFallbackSchedule({
        is_timing: true,
        exec_method: "hand",
        schedule: { type: "delay", source: { type: "fixed", value: 6 }, unit: "day" }
      })
    ).toEqual({ type: "delay", source: { type: "fixed", value: 6 }, unit: "day" })
  })

  it("将旧的指定时间配置转换为默认保底延迟", () => {
    expect(
      resolveFallbackSchedule({
        schedule: {
          type: "at",
          source: {
            type: "template_field",
            template_id: 12,
            field: "execute_date",
            time_field: "execute_time"
          },
          timezone: "Asia/Shanghai"
        }
      })
    ).toEqual({ type: "delay", source: { type: "fixed", value: 1 }, unit: "hour" })
  })
})
