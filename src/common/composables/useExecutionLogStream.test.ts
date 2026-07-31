import { describe, expect, it } from "vitest"
import { createExecutionLogAccumulator } from "./executionLogAccumulator"

describe("执行日志累加器", () => {
  it("将后到达的历史日志恢复到正确顺序", () => {
    const accumulator = createExecutionLogAccumulator()

    accumulator.merge([{ id: 3, content: "third" }])
    accumulator.merge([
      { id: 1, content: "first" },
      { id: 2, content: "second" }
    ])

    expect(accumulator.content).toBe("first\nsecond\nthird")
  })

  it("SSE 日志不会推进 HTTP 拉取游标", () => {
    const accumulator = createExecutionLogAccumulator()

    accumulator.merge([{ id: 3, content: "live" }])
    expect(accumulator.fetchedCursor).toBe(0)

    accumulator.confirmFetched([{ id: 1, content: "history" }], 1)
    expect(accumulator.fetchedCursor).toBe(1)
  })

  it("忽略重复日志并支持重置", () => {
    const accumulator = createExecutionLogAccumulator()

    expect(accumulator.merge([{ id: 1, content: "once" }])).toBe(true)
    expect(accumulator.merge([{ id: 1, content: "duplicate" }])).toBe(false)
    expect(accumulator.content).toBe("once")

    accumulator.reset()
    expect(accumulator.content).toBe("")
    expect(accumulator.fetchedCursor).toBe(0)
  })
})
