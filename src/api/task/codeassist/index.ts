import { fetchEventSource } from "@microsoft/fetch-event-source"
import instance, { API_SERVICE } from "@@/utils/service"
import { activeTenantStack } from "@/common/utils/service"
import { useUserStoreHook } from "@/pinia/stores/user"
import type {
  AIChatReq,
  AIConversation,
  ApplySuggestionResp,
  ConversationListResp,
  ConversationDetailReq,
  ConversationDetailResp,
  CreateConversationReq,
  ListConversationsReq,
  StreamEventData,
  StreamEventName
} from "./types"

export function createCodeAssistConversationApi(data: CreateConversationReq) {
  return instance.post<AIConversation>({
    url: `${API_SERVICE.TASK}/code-assist/conversation/create`,
    data
  })
}

export function listCodeAssistConversationsApi(data: ListConversationsReq) {
  return instance.post<ConversationListResp>({
    url: `${API_SERVICE.TASK}/code-assist/conversation/list`,
    data
  })
}

export function getCodeAssistConversationDetailApi(data: ConversationDetailReq) {
  return instance.post<ConversationDetailResp>({
    url: `${API_SERVICE.TASK}/code-assist/conversation/detail`,
    data
  })
}

export function applyCodeAssistSuggestionApi(id: number) {
  return instance.post<ApplySuggestionResp>({
    url: `${API_SERVICE.TASK}/code-assist/suggestion/apply`,
    data: { id }
  })
}

class StreamRequestError extends Error {}

function buildStreamURL() {
  const baseApi = String(import.meta.env.VITE_BASE_API || "/api").replace(/\/$/, "")
  const taskPrefix = String(API_SERVICE.TASK || "").replace(/^\/+|\/+$/g, "")
  return `${baseApi}/${taskPrefix}/code-assist/message/stream`
}

function buildStreamHeaders() {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Content-Type": "application/json"
  }
  const tenantID = activeTenantStack.value.at(-1)?.tenantId ?? useUserStoreHook().currentTenantId
  if (tenantID) headers["X-Active-Tenant-ID"] = String(tenantID)
  return headers
}

/** 发起一次不可自动重试的 AI 对话，避免网络重连造成重复消息。 */
export async function streamCodeAssistMessage(
  data: AIChatReq,
  options: {
    signal: AbortSignal
    onEvent: (name: StreamEventName, data: StreamEventData) => void
  }
) {
  let terminalEventReceived = false
  await fetchEventSource(buildStreamURL(), {
    method: "POST",
    credentials: "include",
    headers: buildStreamHeaders(),
    body: JSON.stringify(data),
    signal: options.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) return
      let message = `AI 请求失败: ${response.status}`
      try {
        const payload = await response.clone().json()
        message = payload?.msg || message
      } catch {
        // 非 JSON 错误响应保留 HTTP 状态信息。
      }
      throw new StreamRequestError(message)
    },
    onmessage(event) {
      if (event.event === "heartbeat" || !event.event) return
      const name = event.event as StreamEventName
      const payload = event.data ? (JSON.parse(event.data) as StreamEventData) : {}
      terminalEventReceived = name === "message.completed" || name === "message.failed"
      options.onEvent(name, payload)
    },
    onclose() {
      if (!terminalEventReceived && !options.signal.aborted) {
        throw new StreamRequestError("AI 响应连接已中断")
      }
    },
    onerror(error) {
      // 对话 POST 不能自动重试，否则可能重复创建用户消息。
      throw error
    }
  })
}
