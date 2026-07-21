export type AIMessageRole = "USER" | "ASSISTANT"
export type AIMessageStatus = "STREAMING" | "COMPLETED" | "FAILED" | "CANCELLED"
export type AISuggestionStatus = "DRAFT" | "VALIDATED" | "APPLYING" | "APPLIED"
export type AIDiagnosticSeverity = "ERROR" | "WARNING"

export interface AIConversation {
  id: number
  title: string
  model: string
  utime: number
}

export interface AIMessage {
  id: number
  role: AIMessageRole
  content: string
  status: AIMessageStatus
  input_tokens: number
  output_tokens: number
  latency_millis: number
  error_message: string
  ctime: number
}

export interface AIDiagnostic {
  severity: AIDiagnosticSeverity
  code: string
  message: string
}

export interface AISuggestion {
  id: number
  message_id: number
  node_id: number
  code: string
  summary: string
  diagnostics: AIDiagnostic[]
  status: AISuggestionStatus
  applied_version_id: number
}

export interface CreateConversationReq {
  project_id: number
  title: string
}

export interface ListConversationsReq {
  project_id: number
}

export interface ConversationDetailReq {
  conversation_id: number
}

export interface AIChatContext {
  node_id: number
  base_version_id: number
  editor_code: string
}

export interface AIChatReq {
  conversation_id: number
  recipe_id: string
  content: string
  context: AIChatContext
}

export interface StreamEventData {
  message_id?: number
  text?: string
  input_tokens?: number
  output_tokens?: number
  error?: string
}

export type StreamEventName =
  | "message.started"
  | "message.delta"
  | "message.progress"
  | "message.completed"
  | "message.failed"

export interface ConversationListResp {
  conversations: AIConversation[]
}

export interface ConversationDetailResp {
  messages: AIMessage[]
  suggestions: AISuggestion[]
}

export interface ApplySuggestionResp {
  version_id: number
}
