// 分页参数
export interface Page {
  offset: number
  limit: number
}

// 告警列表请求
export interface ListAlertsReq extends Page {}

// 按工作空间获取告警列表请求
export interface ListAlertsByWorkspaceReq extends Page {
  workspace_id: number
}

// 数据源信息
export interface DataSource {
  id: number
  name: string
  type: string
  description: string
}

// 告警信息
export interface Alert {
  id: number
  data_source: DataSource
  cluster: string
  eval_interval: number
  level: number
  trigger_time: number
  first_trigger_time: number
  last_eval_time: number
  recover_time: number
  labels: Record<string, string>
  status: string // firing, resolved
  duration: number
}

// 告警列表响应
export interface RetrieveAlertsResp {
  alerts: Alert[]
  total: number
}
