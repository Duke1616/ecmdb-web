export interface PreviewVariable {
  key: string
  value: string
  secret: boolean
}

export interface RunPreviewReq {
  codebook_id: number
  runner_id: number
  code: string
  args: string
  variables: PreviewVariable[]
  max_execution_seconds: number
}

export interface PreviewExecution {
  id: number
  task_name: string
  start_time: number
  end_time: number
  status: "PREPARE" | "RUNNING" | "SUCCESS" | "FAILED"
  running_progress: number
  executor_node_id: string
  task_result: string
  ctime: number
}

export interface PreviewStatusReq {
  execution_id: number
}

export interface PreviewLogsReq extends PreviewStatusReq {
  min_id: number
  limit: number
}

export interface PreviewLog {
  id: number
  execution_id: number
  content: string
  ctime: number
}

export interface PreviewLogsResp {
  total: number
  logs: PreviewLog[]
}
