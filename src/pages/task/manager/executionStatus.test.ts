import { describe, expect, it } from "vitest"
import { isActiveExecutionStatus, isCancelledExecutionStatus } from "./executionStatus"

describe("execution status", () => {
  it.each(["WAITING_PULL", "PREPARE", "RUNNING", "FAILED_RETRYABLE", "FAILED_RESCHEDULED", "PREEMPTED"])(
    "treats %s as active",
    (status) => expect(isActiveExecutionStatus(status)).toBe(true)
  )

  it.each(["SUCCESS", "FAILED", "CANCELLED", "TERMINATED"])("treats %s as terminal", (status) =>
    expect(isActiveExecutionStatus(status)).toBe(false)
  )

  it("supports current and legacy cancellation statuses", () => {
    expect(isCancelledExecutionStatus("CANCELLED")).toBe(true)
    expect(isCancelledExecutionStatus("TERMINATED")).toBe(true)
  })
})
