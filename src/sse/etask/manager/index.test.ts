import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  useSSE: vi.fn((options) => options)
}))

vi.mock("@/common/utils/sse/useSSE", () => ({
  useSSE: mocks.useSSE
}))

vi.mock("@@/utils/service", () => ({
  API_SERVICE: { TASK: "task" }
}))

import { useExecutionLogsSSE, useTaskEventsSSE, useTaskExecutionsSSE } from "./index"

describe("etask manager SSE routes", () => {
  beforeEach(() => {
    mocks.useSSE.mockClear()
  })

  it("将所有流式接口收敛到 task/streams/manager 前缀", () => {
    const onMessage = vi.fn()

    useTaskEventsSSE({ onMessage })
    useExecutionLogsSSE({ executionId: 11, onMessage })
    useTaskExecutionsSSE({ taskId: 22, onMessage })

    const [taskEvents, executionLogs, taskExecutions] = mocks.useSSE.mock.calls.map(([options]) => options)
    expect(taskEvents.path).toBe("task/streams/manager/task-events")
    expect(executionLogs.path()).toBe("task/streams/manager/executions/11/logs")
    expect(taskExecutions.path()).toBe("task/streams/manager/tasks/22/executions")
  })
})
