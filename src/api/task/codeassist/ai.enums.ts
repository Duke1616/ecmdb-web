type EnumValue<T> = T[keyof T]

export const AIMessageRole = {
  USER: "USER",
  ASSISTANT: "ASSISTANT"
} as const

export type AIMessageRole = EnumValue<typeof AIMessageRole>

export const AIMessageStatus = {
  STREAMING: "STREAMING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED"
} as const

export type AIMessageStatus = EnumValue<typeof AIMessageStatus>

export const AIChangeSetStatus = {
  DRAFT: "DRAFT",
  VALIDATED: "VALIDATED",
  APPLYING: "APPLYING",
  APPLIED: "APPLIED"
} as const

export type AIChangeSetStatus = EnumValue<typeof AIChangeSetStatus>

export const AIChangeOperation = {
  CREATE: "CREATE",
  UPDATE: "UPDATE"
} as const

export type AIChangeOperation = EnumValue<typeof AIChangeOperation>

export const AIDiagnosticSeverity = {
  ERROR: "ERROR",
  WARNING: "WARNING"
} as const

export type AIDiagnosticSeverity = EnumValue<typeof AIDiagnosticSeverity>

export const StreamEventName = {
  MESSAGE_STARTED: "message.started",
  MESSAGE_DELTA: "message.delta",
  MESSAGE_PROGRESS: "message.progress",
  MESSAGE_COMPLETED: "message.completed",
  MESSAGE_FAILED: "message.failed"
} as const

export type StreamEventName = EnumValue<typeof StreamEventName>
