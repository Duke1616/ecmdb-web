import { describe, it, expect } from "vitest"
import {
  isSystemActor,
  formatOperator,
  buildInitiatorAction,
  isInitiatorStepAction,
  isHistoryModeAction,
  isTemplateReadonlyAction,
  getDetailTitle
} from "./utils"

describe("manager utils", () => {
  describe("isSystemActor & formatOperator", () => {
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

  describe("action 协议", () => {
    it("buildInitiatorAction 拼接当前环节", () => {
      expect(buildInitiatorAction("Start")).toBe("my-Start")
      expect(buildInitiatorAction("自动化-构建")).toBe("my-自动化-构建")
    })

    it("isInitiatorStepAction 仅匹配 my- 前缀", () => {
      expect(isInitiatorStepAction("my-Start")).toBe(true)
      expect(isInitiatorStepAction("my")).toBe(false)
      expect(isInitiatorStepAction("todo")).toBe(false)
    })

    it("isHistoryModeAction 覆盖历史与发起人环节视角", () => {
      expect(isHistoryModeAction("history")).toBe(true)
      expect(isHistoryModeAction("my-Start")).toBe(true)
      expect(isHistoryModeAction("my")).toBe(false)
      expect(isHistoryModeAction("todo")).toBe(false)
    })

    it("isTemplateReadonlyAction 仅 my 与 my-Start 可编辑", () => {
      expect(isTemplateReadonlyAction("my")).toBe(false)
      expect(isTemplateReadonlyAction("my-Start")).toBe(false)
      expect(isTemplateReadonlyAction("my-审批")).toBe(true)
      expect(isTemplateReadonlyAction("history")).toBe(true)
      expect(isTemplateReadonlyAction("todo")).toBe(true)
    })

    it("getDetailTitle 按 action 映射标题并兜底", () => {
      expect(getDetailTitle("todo")).toBe("待办审批")
      expect(getDetailTitle("my-Start")).toBe("我的工单")
      expect(getDetailTitle("history")).toBe("历史工单")
      expect(getDetailTitle("view")).toBe("查看详情")
      expect(getDetailTitle("my-未知环节")).toBe("审批服务")
    })
  })
})