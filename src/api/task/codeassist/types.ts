import type {
  AIChangeOperation,
  AIChangeSetStatus,
  AIDiagnosticSeverity,
  AIMessageRole,
  AIMessageStatus
} from "./ai.enums"

export * from "./ai.enums"

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

export interface AIChangeItem {
  operation: AIChangeOperation
  path: string
  node_id: number
  base_version_id: number
  base_hash: string
  language: string
  code: string
  diagnostics: AIDiagnostic[]
  applied_version_id: number
}

export interface AIChangeSet {
  id: number
  message_id: number
  base_revision: number
  summary: string
  status: AIChangeSetStatus
  items: AIChangeItem[]
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
  profile_id: string
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

export interface ConversationListResp {
  conversations: AIConversation[]
}

export interface ConversationDetailResp {
  messages: AIMessage[]
  change_sets: AIChangeSet[]
}

export interface AppliedChangeItem {
  path: string
  node_id: number
  version_id: number
}

export interface ApplyChangeSetResp {
  items: AppliedChangeItem[]
}
