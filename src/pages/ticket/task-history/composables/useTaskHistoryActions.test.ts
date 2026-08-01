import { describe, expect, it, vi } from "vitest"
import { AutomationTaskStatus } from "@/api/ticket/task/types/task"
import { canRetryTask, canTerminateTask } from "./useTaskHistoryActions"

vi.mock("@/api/ticket/task", () => ({
  retryTaskApi: vi.fn(),
  terminateTaskApi: vi.fn()
}))

vi.mock("element-plus", () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() }
}))

describe("task history actions", () => {
  it.each([
    AutomationTaskStatus.Failed,
    AutomationTaskStatus.Running,
    AutomationTaskStatus.Waiting,
    AutomationTaskStatus.Blocked,
    AutomationTaskStatus.Submitting
  ])("allows terminating active status %s", (status) => {
    expect(canTerminateTask({ status, is_compensation: false })).toBe(true)
  })

  it.each([AutomationTaskStatus.Success, AutomationTaskStatus.Cancelled])(
    "rejects terminating completed status %s",
    (status) => {
      expect(canTerminateTask({ status, is_compensation: false })).toBe(false)
    }
  )

  it("rejects terminating compensation tasks", () => {
    expect(canTerminateTask({ status: AutomationTaskStatus.Running, is_compensation: true })).toBe(false)
  })

  it("retries failed, blocked, or cancelled tasks", () => {
    expect(canRetryTask({ status: AutomationTaskStatus.Failed })).toBe(true)
    expect(canRetryTask({ status: AutomationTaskStatus.Blocked })).toBe(true)
    expect(canRetryTask({ status: AutomationTaskStatus.Cancelled })).toBe(true)
    expect(canRetryTask({ status: AutomationTaskStatus.Running })).toBe(false)
  })
})
