const ACTIVE_EXECUTION_STATUSES = new Set([
  "WAITING_PULL",
  "PREPARE",
  "RUNNING",
  "FAILED_RETRYABLE",
  "FAILED_RESCHEDULED",
  "PREEMPTED"
])

export const isActiveExecutionStatus = (status?: string) => ACTIVE_EXECUTION_STATUSES.has(status || "")

export const isCancelledExecutionStatus = (status?: string) => status === "CANCELLED" || status === "TERMINATED"
