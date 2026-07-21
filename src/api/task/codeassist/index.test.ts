import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchEventSource: vi.fn()
}))

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: mocks.fetchEventSource
}))

vi.mock("@/common/utils/service", () => ({
  default: {},
  API_SERVICE: { TASK: "task" },
  activeTenantStack: { value: [] }
}))

vi.mock("@/pinia/stores/user", () => ({
  useUserStoreHook: () => ({ currentTenantId: 7 })
}))

import { streamCodeAssistMessage } from "./index"

describe("streamCodeAssistMessage", () => {
  it("使用租户上下文发送 POST SSE，并关闭自动重试", async () => {
    const received: string[] = []
    mocks.fetchEventSource.mockImplementationOnce(async (url, options) => {
      expect(url).toBe("/api/task/code-assist/message/stream")
      expect(options.method).toBe("POST")
      expect(options.headers["X-Active-Tenant-ID"]).toBe("7")
      expect(JSON.parse(options.body)).toMatchObject({
        conversation_id: 1,
        recipe_id: "codebook.general",
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
        recipe_id: "codebook.general",
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
          recipe_id: "codebook.general",
          content: "review",
          context: { node_id: 0, base_version_id: 0, editor_code: "" }
        },
        { signal: new AbortController().signal, onEvent: vi.fn() }
      )
    ).rejects.toThrow("AI 响应连接已中断")
  })
})
