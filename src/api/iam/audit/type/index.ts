/** 认证状态枚举 */
export enum AuthStatus {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  LOCKED = "LOCKED"
}

/** 操作状态枚举 */
export enum OpStatus {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL"
}

/** 认证审计日志实体 */
export interface AuthLog {
  id: number
  tenant_id: number
  user_id: number
  username: string
  auth_type: string
  status: AuthStatus | string
  fail_reason: string
  client_ip: string
  user_agent: string
  ctime: number
}

/** 认证审计查询入参 */
export interface ListAuthLogReq {
  offset: number
  limit: number
  username?: string
  auth_type?: string
  status?: string
  start_time?: number
  end_time?: number
  tenant_id?: number
}

/** 认证审计分页响应 */
export interface ListAuthLogRes {
  total: number
  list: AuthLog[]
}

/** 操作审计日志实体 */
export interface OperationLog {
  id: number
  tenant_id: number
  service: string
  operator_id: number
  operator_name: string
  module: string
  action: string
  resource_id: string
  resource_name: string
  resource_urn: string
  before_state: string
  after_state: string
  status: OpStatus | string
  fail_reason: string
  client_ip: string
  user_agent: string
  ctime: number
}

/** 操作审计查询入参 */
export interface ListOperationLogReq {
  offset: number
  limit: number
  service?: string
  module?: string
  action?: string
  status?: string
  operator_name?: string
  start_time?: number
  end_time?: number
  tenant_id?: number
}

/** 操作审计分页响应 */
export interface ListOperationLogRes {
  total: number
  list: OperationLog[]
}
