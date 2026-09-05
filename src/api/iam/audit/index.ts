import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as audit from "./type"

/** 分页查询认证安全审计日志 */
export function listAuthLogsApi(data: audit.ListAuthLogReq) {
  return instance.post<audit.ListAuthLogRes>({
    url: `${API_SERVICE.IAM}/audit/auth/list`,
    data
  })
}

/** 分页查询业务管理操作审计日志 */
export function listOperationLogsApi(data: audit.ListOperationLogReq) {
  return instance.post<audit.ListOperationLogRes>({
    url: `${API_SERVICE.IAM}/audit/operation/list`,
    data
  })
}
