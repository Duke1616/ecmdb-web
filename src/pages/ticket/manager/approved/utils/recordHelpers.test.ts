import { describe, it, expect } from "vitest"
import {
  TaskRecordStatus,
  TaskFinishStatus,
  formatOperator,
  isSystemActor,
  getTaskTagType,
  getTaskTagLabel,
  resolveTimelineSummary,
  getTimelineTagType,
  getTimelineTagLabel,
  getTimelineSummary,
  getTimelineItemType
} from "./recordHelpers"
import type { taskTimelineEvent, taskRecord } from "@/api/ticket/manager/types/manager"

describe("recordHelpers", () => {
  describe("formatOperator & isSystemActor", () => {
    it("正确识别并格式化系统角色", () => {
      expect(formatOperator("system")).toBe("系统")
      expect(formatOperator("automation")).toBe("系统")
      expect(formatOperator("sys_skipped")).toBe("系统")
      expect(formatOperator("  SYSTEM  ")).toBe("系统")
      expect(formatOperator("张三")).toBe("张三")
      expect(formatOperator("")).toBe("-")
      expect(formatOperator(undefined)).toBe("-")

      expect(isSystemActor("system")).toBe(true)
      expect(isSystemActor("张三")).toBe(false)
      expect(isSystemActor("")).toBe(false)
    })
  })

  describe("getTaskTagType & getTaskTagLabel", () => {
    it("未完成时返回等待处理 warning", () => {
      const row = { status: TaskRecordStatus.Passed, is_finished: TaskFinishStatus.Unfinished } as taskRecord
      expect(getTaskTagType(row)).toBe("warning")
      expect(getTaskTagLabel(row)).toBe("等待处理")
    })

    it("人工确认通过返回 success", () => {
      const row = {
        node_name: "领导审批",
        status: TaskRecordStatus.Passed,
        is_finished: TaskFinishStatus.Finished
      } as taskRecord
      expect(getTaskTagType(row)).toBe("success")
      expect(getTaskTagLabel(row)).toBe("确认通过")
    })

    it("自动化节点通过返回自动通过", () => {
      const row = {
        node_name: "自动化-构建",
        status: TaskRecordStatus.Passed,
        is_finished: TaskFinishStatus.Finished
      } as taskRecord
      expect(getTaskTagType(row)).toBe("success")
      expect(getTaskTagLabel(row)).toBe("自动通过")
    })

    it("系统通过返回系统通过", () => {
      const row = {
        status: TaskRecordStatus.SystemPassed,
        is_finished: TaskFinishStatus.Finished
      } as taskRecord
      expect(getTaskTagType(row)).toBe("success")
      expect(getTaskTagLabel(row)).toBe("系统通过")
    })

    it("系统驳回返回 danger 和系统驳回", () => {
      const row = {
        status: TaskRecordStatus.SystemRejected,
        is_finished: TaskFinishStatus.Finished
      } as taskRecord
      expect(getTaskTagType(row)).toBe("danger")
      expect(getTaskTagLabel(row)).toBe("系统驳回")
    })

    it("手动驳回返回 danger 和手动驳回", () => {
      const row = {
        status: TaskRecordStatus.Rejected,
        is_finished: TaskFinishStatus.Finished
      } as taskRecord
      expect(getTaskTagType(row)).toBe("danger")
      expect(getTaskTagLabel(row)).toBe("手动驳回")
    })
  })

  describe("resolveTimelineSummary", () => {
    it("针对算法/系统节点，若包含系统驳回，校准外层统计为系统驳回", () => {
      const event = {
        id: "1",
        node_id: "node_algo",
        node_name: "算法节点",
        actors: ["system"],
        occurred_at: "2026-11-13 10:00:00",
        members: [
          {
            approved_by: "system",
            status: TaskRecordStatus.SystemRejected,
            is_finished: TaskFinishStatus.Finished
          } as taskRecord
        ],
        summary: {
          total: 1,
          passed: 0,
          rejected: 1,
          system_passed: 0,
          system_rejected: 0,
          skipped: 0,
          linked: 0,
          pending: 0
        }
      } as taskTimelineEvent

      const resolved = resolveTimelineSummary(event)
      expect(resolved.system_rejected).toBe(1)
      expect(resolved.rejected).toBe(0)
    })
  })

  describe("getTimelineTagLabel & getTimelineSummary", () => {
    it("根据校准后的 summary 输出正确的标签和摘要", () => {
      const event = {
        id: "2",
        node_id: "node_2",
        node_name: "领导节点",
        is_cosigned: 0,
        actors: ["栾凯朝"],
        occurred_at: "2026-11-13 10:00:00",
        members: [],
        summary: {
          total: 1,
          passed: 1,
          rejected: 0,
          system_passed: 0,
          system_rejected: 0,
          skipped: 0,
          linked: 0,
          pending: 0
        }
      } as taskTimelineEvent

      expect(getTimelineTagType(event)).toBe("success")
      expect(getTimelineTagLabel(event)).toBe("确认通过")
      expect(getTimelineSummary(event)).toBe("1 人通过")
      expect(getTimelineItemType(event)).toBe("success")
    })
  })
})
