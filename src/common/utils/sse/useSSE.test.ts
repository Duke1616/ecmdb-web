import { describe, expect, it, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchEventSource: vi.fn(),
  authHeaders: vi.fn(),
  activeTenantHeaders: vi.fn(),
  getActiveTenantId: vi.fn()
}))

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: mocks.fetchEventSource
}))

vi.mock("@/common/utils/service", () => ({
  authHeaders: mocks.authHeaders,
  activeTenantHeaders: mocks.activeTenantHeaders,
  getActiveTenantId: mocks.getActiveTenantId
}))

vi.mock("vue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vue")>()
  return {
    ...actual,
    onMounted: vi.fn(),
    onUnmounted: vi.fn()
  }
})

import { useSSE } from "./useSSE"

describe("useSSE 通用 Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchEventSource.mockResolvedValue(undefined)
    mocks.getActiveTenantId.mockReturnValue(42)
    mocks.activeTenantHeaders.mockReturnValue({ "X-Active-Tenant-ID": "42" })
    mocks.authHeaders.mockReturnValue({})
  })

  it("Token 模式下自动携带 Authorization Bearer 和租户头", () => {
    mocks.authHeaders.mockReturnValue({ Authorization: "Bearer mock-access-token" })

    const { connect } = useSSE({
      path: "task/streams/manager/task-events",
      eventName: "task_status_change",
      onMessage: vi.fn(),
      enabled: false
    })

    connect()

    expect(mocks.fetchEventSource).toHaveBeenCalledTimes(1)
    const [url, options] = mocks.fetchEventSource.mock.calls[0]

    expect(url).toBe("/api/task/streams/manager/task-events")
    expect(options.method).toBe("GET")
    expect(options.credentials).toBe("include")
    expect(options.headers).toMatchObject({
      accept: "text/event-stream",
      Authorization: "Bearer mock-access-token",
      "X-Active-Tenant-ID": "42"
    })
  })

  it("Cookie 模式下仅注入 accept 和租户头，不携带 Authorization", () => {
    mocks.authHeaders.mockReturnValue({})

    const { connect } = useSSE({
      path: "task/streams/manager/task-events",
      eventName: "task_status_change",
      onMessage: vi.fn(),
      enabled: false
    })

    connect()

    expect(mocks.fetchEventSource).toHaveBeenCalledTimes(1)
    const [, options] = mocks.fetchEventSource.mock.calls[0]

    expect(options.headers).toEqual({
      accept: "text/event-stream",
      "X-Active-Tenant-ID": "42"
    })
    expect(options.headers.Authorization).toBeUndefined()
  })
})
