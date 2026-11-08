/** 跨引擎任务与流程实例通用标识（兼顾数字与字符串形态） */
export type TaskID = string | number
export type ProcessInstanceID = string | number

export interface SubmitTicketReq {
  template_id: number
  workflow_id: number
  data: object
}

export interface TransferTicketReq {
  ticket_id: number
  task_id: TaskID
  usernames: string[]
}

export interface TodoTicketReq {
  user_id?: string
  process_name?: string
  sort_by_asc: boolean
  offset: number
  limit: number
}

export interface HistoryTicketReq {
  user_id?: string
  offset: number
  limit: number
}

export interface StartedTicketReq {
  user_id?: string
  process_name?: string
  offset: number
  limit: number
}

export enum TicketStatus {
  Start = 1,
  Process = 2,
  End = 3,
  Withdraw = 4,
  Withdrawing = 5,
  StartFailed = 6
}

export interface Ticket {
  id: number
  engine_type?: string
  task_id: TaskID
  process_instance_id: ProcessInstanceID
  title: string
  proc_inst_create_time: string
  workflow_id: number
  template_id: number
  provide: number
  status: TicketStatus
  ctime: number
  wtime: number
  current_step: string
  approved_by: string[]
  steps: TicketStep[]
  data: object
  can_rate: boolean
  rating?: TicketRating
  revoke_reason?: string
  process_start_error?: string
  process_start_attempts?: number
}

export interface RestartProcessReq {
  ticket_id: number
}

export interface TicketRating {
  score: number
  comment: string
  rater: string
  rated_at: number
}

export interface SubmitTicketRatingReq {
  ticket_id: number
  score: number
  comment: string
}

export interface TicketStep {
  current_step: string
  approved_by: string[]
}

export interface RevokeTicketReq {
  instance_id: ProcessInstanceID
  force: boolean
  reason: string
}

export interface TicketListRes {
  tasks: Ticket[]
  total: number
}

export interface PassTicketReq {
  ticket_id?: number
  task_id: TaskID
  comment: string
  extra_data?: Record<string, unknown>
}

export interface RejectTicketReq {
  ticket_id?: number
  task_id: TaskID
  comment: string
}

export interface taskTimelineReq {
  process_inst_id: ProcessInstanceID
  offset: number
  limit: number
}

export interface taskRecord {
  node_name: string // 当前步骤
  approved_by: string // 处理人
  is_cosigned: number // 是否会签
  status: number // 任务状态:0:初始 1:通过 2:驳回
  comment: string // 评论
  is_finished: number // 0:任务未完成 1:处理完成
  finished_time: string
  form_values: FormValue[] // 提交的表单记录
}

export interface FormValue {
  name: string // 字段名
  key: string // 字段 key
  type: string // 字段类型
  value: any // 字段值
}

export interface taskTimelineSummary {
  total: number
  passed: number
  rejected: number
  system_passed: number
  system_rejected: number
  skipped: number
  linked: number
  pending: number
}

export interface taskTimelineEvent {
  id: string
  node_id: string
  node_name: string
  batch_code?: string
  is_cosigned: number
  occurred_at: string
  actors: string[]
  summary: taskTimelineSummary
  members: taskRecord[]
}

export interface taskTimelineRes {
  events: taskTimelineEvent[]
  total: number
}

export interface TicketsRes {
  tasks: Ticket[]
  total: number
}

export interface TaskFormConfigReq {
  ticket_id?: number
  task_id: TaskID
  workflow_id: number
}
