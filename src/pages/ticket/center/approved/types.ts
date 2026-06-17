import type { FormRule } from "@form-create/element-ui"
import type { Assignee } from "@/common/components/ReceiverSelector/composables/useAssignees"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonRecord = Record<string, JsonValue>

export type TicketFormData = Record<string, JsonValue | undefined>
export type DynamicFormModelValue = string | number | string[] | Date | [Date, Date] | null | undefined
export type DynamicFormData = Record<string, DynamicFormModelValue>

export interface DynamicFormOption {
  label: string
  value: string | number
}

export enum DynamicFormFieldType {
  Input = "input",
  Textarea = "textarea",
  Number = "number",
  Select = "select",
  MultiSelect = "multi_select",
  Date = "date",
  Tips = "tips"
}

export interface DynamicFormField {
  name: string
  key: string
  type: DynamicFormFieldType | string
  required?: boolean
  validate?: string
  hidden?: boolean
  readonly?: boolean
  value?: DynamicFormModelValue
  options?: DynamicFormOption[]
  props?: {
    placeholder?: string
    [key: string]: JsonValue | undefined
  }
}

export interface DynamicFormExpose {
  validate: () => Promise<boolean> | undefined
}

export type TransferAssignee = Assignee

export interface TicketFormDraft {
  formData: {
    task_id: number
    comment: string
  }
  taskFormData: DynamicFormData
}

export type FormCreateOptions = FormRule & {
  submitBtn?: boolean
}

export type TaskDialogType = "input" | "output" | "args" | "variables"

export interface TaskResultSavePayload {
  taskId: number
  result: JsonValue
  type: TaskDialogType
}

export const isTaskDialogType = (value: string): value is TaskDialogType => {
  return value === "input" || value === "output" || value === "args" || value === "variables"
}
