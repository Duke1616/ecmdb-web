export interface CreateTaskReq {
  name: string
  type: TaskType
  cron_expr?: string
  grpc_config?: GrpcConfig
  http_config?: HTTPConfig
  retry_config?: RetryConfig
  max_execution_seconds?: number
  schedule_params?: Record<string, string>
}

export interface UpdateTaskReq extends CreateTaskReq {
  id: number
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

export interface GrpcConfig {
  service_name: string
  auth_token?: string
  handler_name: string
  params?: Record<string, string>
}

export interface HTTPConfig {
  endpoint: string
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

export interface TaskItem extends CreateTaskReq {
  id: number
  status: TaskStatus
  next_time: number
  ctime: number
  utime: number
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
