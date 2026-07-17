export interface Page {
  offset: number
  limit: number
}

export interface ListByInstanceIDReq extends Page {
  instance_id: number
}

export enum AutomationTaskStatus {
  Success = 1,
  Failed = 2,
  Running = 3,
  Waiting = 4,
  Blocked = 5,
  Submitting = 6
}

export enum AutomationAttemptStatus {
  Submitting = "SUBMITTING",
  Running = "RUNNING",
  Success = "SUCCESS",
  Failed = "FAILED"
}

export enum AutomationTaskPhase {
  Ready = "READY",
  Submitting = "SUBMITTING",
  Running = "RUNNING",
  Succeeded = "SUCCEEDED",
  Failed = "FAILED",
  Blocked = "BLOCKED",
  Retrying = "RETRYING"
}

export interface AutomationTask {
  id: number
  ticket_id: number
  process_instance_id: number
  node_id: string
  node_name: string
  process_version: number
  status: AutomationTaskStatus
  phase: AutomationTaskPhase
  scheduled_at: number
  current_attempt_id: number
  advanced_at: number
  last_error: string
  ctime: number
  utime: number
}

export interface AutomationAttempt {
  id: number
  task_id: number
  attempt_no: number
  request_id: string
  runner_id: number
  execution_id: number
  status: AutomationAttemptStatus
  input: Record<string, unknown>
  output: string
  error: string
  submitted_at: number
  completed_at: number
  ctime: number
  utime: number
}

export interface ExecutionLog {
  id: number
  time: number
  content: string
}

export interface TasksResp {
  tasks: AutomationTask[]
  total: number
}

export interface ListAttemptsResp {
  attempts: AutomationAttempt[]
}

export interface LogsResp {
  logs: ExecutionLog[]
  max_id: number
}
