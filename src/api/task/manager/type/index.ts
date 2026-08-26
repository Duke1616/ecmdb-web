import type { ProgramSpec } from "../../program"

export interface CreateTaskReq {
  name: string
  runner_id?: number
  type: TaskType
  cron_expr?: string
  grpc_config?: GrpcConfig
  http_config?: HTTPConfig
  retry_config?: RetryConfig
  max_execution_seconds?: number
  schedule_params?: Record<string, string>
  metadata?: Record<string, string>
  param_override_rules?: TaskParamOverrideRule[]
  program?: ProgramSpec
  execution_notifications?: ExecutionNotificationRule[]
}

export interface UpdateTaskReq extends CreateTaskReq {
  id: number
}

export interface RunTaskReq {
  id: number
  cron_expr?: string
  param_overrides?: Record<string, RunParamOverride>
}

export type TaskParamInputMode = "MANUAL" | "SELECT"

export interface TaskParamOption {
  label: string
  value: string
}

export interface TaskParamSelectConfig {
  multiple: boolean
  options: TaskParamOption[]
}

export interface TaskParamOverrideRule {
  param_key: string
  allowed_modes: TaskParamInputMode[]
  default_mode: TaskParamInputMode
  select_config?: TaskParamSelectConfig
}

export interface RunParamOverride {
  mode: TaskParamInputMode
  value?: string
  values?: string[]
}

export enum TaskType {
  RECURRING = "RECURRING",
  ONE_TIME = "ONE_TIME"
}

export enum TaskStatus {
  ACTIVE = "ACTIVE",
  PREEMPTED = "PREEMPTED",
  INACTIVE = "INACTIVE",
  COMPLETED = "COMPLETED"
}

export enum TaskProtocol {
  GRPC = "grpc",
  HTTP = "http",
  RUNNER = "runner"
}

/** 可触发执行通知的任务终态。 */
export enum NotificationTriggerStatus {
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
  CANCELLED = "CANCELLED"
}

/** ETask 允许配置的任务通知接收对象类型。 */
export enum NotificationRecipientType {
  USER = "RECIPIENT_USER",
  TEAM = "RECIPIENT_TEAM",
  DEPARTMENT = "RECIPIENT_DEPARTMENT",
  ONCALL = "RECIPIENT_ONCALL"
}

/** EAlert 支持的任务通知渠道。 */
export enum NotificationChannel {
  EMAIL = "EMAIL",
  WECHAT = "WECHAT",
  LARK_CARD = "LARK_CARD",
  IN_APP = "IN_APP"
}

/** 一种接收对象策略及其已标准化数值 ID。 */
export interface NotificationRecipient {
  /** 决定 target_ids 所属系统及 EAlert 解析方式。 */
  type: NotificationRecipientType
  /** 调用方已转换好的正整数 ID。 */
  target_ids: number[]
}

/** 任务在指定执行终态下的通知规则。 */
export interface ExecutionNotificationRule {
  /** 触发通知的任务执行终态。 */
  trigger_status: NotificationTriggerStatus
  /** 接收对象策略，同类型 ID 聚合为一项。 */
  recipients: NotificationRecipient[]
  /** 需要投递的 EAlert 渠道。 */
  channels: NotificationChannel[]
  /** 模板集 ID；0 表示使用 ETask 内置默认模板集。 */
  template_set_id: number
  /** 是否在命中终态时实际发送通知。 */
  enabled: boolean
}

export interface GrpcConfig {
  service_name: string
  auth_token?: string
  handler_name: string
  params?: Record<string, string>
}

export interface HTTPConfig {
  endpoint: string
  headers?: Record<string, string>
  params?: Record<string, string>
}

export interface RetryConfig {
  max_retries: number
  initial_interval: number // 毫秒
  max_interval: number // 毫秒
}

export interface GetLogsReq {
  execution_id: number
  min_id: number
  limit: number
}

export interface ListExecutionsReq {
  task_id: number
  offset: number
  limit: number
}

export interface TaskLogVO {
  id: number
  task_id: number
  execution_id: number
  content: string
  ctime: number
}

export interface ListLogResp {
  total: number
  logs: TaskLogVO[]
}

export interface TaskExecutionVO {
  id: number
  task_id: number
  task_name: string
  start_time: number
  end_time: number
  status: string
  running_progress: number
  executor_node_id: string
  task_result: string
  ctime: number
}

export interface ListExecutionResp {
  total: number
  executions: TaskExecutionVO[]
}

export type ExecutionParameterSource = "TASK_SNAPSHOT" | "SCHEDULE_OVERRIDE" | "MANUAL_OVERRIDE" | "SYSTEM"

export interface ExecutionParameterVO {
  key: string
  value: string
  source: ExecutionParameterSource
  manual_override: boolean
  schedule_override: boolean
}

export interface ExecutionParametersVO {
  execution_id: number
  parameters: ExecutionParameterVO[]
  manual_override_count: number
  schedule_override_count: number
}

export interface TaskItem extends CreateTaskReq {
  id: number
  status: TaskStatus
  next_time: number
  ctime: number
  utime: number
  version: number
}

export interface TaskPage {
  tasks: TaskItem[]
  total: number
}

export interface PageQuery {
  offset: number
  limit: number
  query?: string
}
