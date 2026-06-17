import type { Component } from "vue"
import type { ButtonType } from "element-plus"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export enum TaskHistoryAction {
  Input = "input",
  Output = "output",
  Args = "args",
  Variables = "variables",
  Retry = "retry"
}

export enum TaskResultDialogType {
  Input = "input",
  Output = "output",
  Args = "args",
  Variables = "variables"
}

export type TaskResultDialogValue = `${TaskResultDialogType}`

export type StatusTone = "neutral" | "success" | "danger" | "running" | "warning"

export interface StatusMeta {
  text: string
  tone: StatusTone
}

export interface TaskHistoryOperateItem {
  name: string
  code: TaskHistoryAction
  type?: ButtonType
  icon?: string | Component
  disabled?: boolean
  capability?: string | string[]
}

export interface TaskResultSavePayload {
  taskId: number
  result: JsonValue
  type: TaskResultDialogValue
}
