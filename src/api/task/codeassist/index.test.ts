import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchEventSource: vi.fn(),
  post: vi.fn()
}))

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: mocks.fetchEventSource
}))

vi.mock("@/common/utils/service", () => ({
  default: { post: mocks.post },
  API_SERVICE: { TASK: "task" },
  activeTenantStack: { value: [] },
  activeTenantHeaders: vi.fn((tenantId?: number) => (tenantId ? { "X-Active-Tenant-ID": String(tenantId) } : {})),
  authHeaders: vi.fn(() => ({ Authorization: "Bearer test-token" })),
  getActiveTenantId: vi.fn(() => 7)
}))

vi.mock("@/pinia/stores/user", () => ({
  useUserStoreHook: () => ({ currentTenantId: 7 })
}))

import { applyCodeAssistChangeSetApi, streamCodeAssistMessage } from "./index"

describe("applyCodeAssistChangeSetApi", () => {
  it("使用统一的 ChangeSet 应用接口", () => {
    applyCodeAssistChangeSetApi(42)

    expect(mocks.post).toHaveBeenCalledWith({
      url: "task/code-assist/change-set/apply",
      data: { id: 42 }
    })
  })
})

describe("streamCodeAssistMessage", () => {
  it("使用租户上下文发送 POST SSE，并关闭自动重试", async () => {
    const received: string[] = []
    mocks.fetchEventSource.mockImplementationOnce(async (url, options) => {
      expect(url).toBe("/api/task/code-assist/message/stream")
      expect(options.method).toBe("POST")
      expect(options.headers["X-Active-Tenant-ID"]).toBe("7")
      expect(options.headers.Authorization).toBe("Bearer test-token")
      expect(JSON.parse(options.body)).toMatchObject({
        conversation_id: 1,
        profile_id: "default",
        content: "review"
      })

      await options.onopen(new Response(null, { status: 200, headers: { "Content-Type": "text/event-stream" } }))
      options.onmessage({ event: "message.started", data: '{"message_id":10}' })
      options.onmessage({ event: "message.completed", data: "{}" })
      expect(() => options.onerror(new Error("network error"))).toThrow("network error")
      options.onclose()
    })

    await streamCodeAssistMessage(
      {
        conversation_id: 1,
        profile_id: "default",
        content: "review",
        context: { node_id: 0, base_version_id: 0, editor_code: "" }
      },
      {
        signal: new AbortController().signal,
        onEvent: (name) => received.push(name)
      }
    )

    expect(received).toEqual(["message.started", "message.completed"])
  })

  it("没有终止事件时将连接关闭视为失败", async () => {
    mocks.fetchEventSource.mockImplementationOnce(async (_url, options) => {
      options.onclose()
    })

    await expect(
      streamCodeAssistMessage(
        {
          conversation_id: 1,
          profile_id: "default",
          content: "review",
          context: { node_id: 0, base_version_id: 0, editor_code: "" }
        },
        { signal: new AbortController().signal, onEvent: vi.fn() }
      )
    ).rejects.toThrow("AI 响应连接已中断")
  })
})
