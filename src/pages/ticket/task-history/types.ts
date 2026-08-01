import type { Component } from "vue"
import type { ButtonType } from "element-plus"

export enum TaskHistoryAction {
  Attempts = "attempts",
  Retry = "retry",
  Terminate = "terminate"
}

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
