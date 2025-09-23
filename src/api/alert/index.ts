import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { ListAlertsReq, ListAlertsByWorkspaceReq, RetrieveAlertsResp } from "./types"

// 获取历史告警列表
export const listHistoryAlertsApi = (data: ListAlertsReq) => {
  return instance.post<RetrieveAlertsResp>({
    url: `${API_SERVICE.ALERT}/list-his`,
    data
  })
}

// 获取当前告警列表
export const listCurrentAlertsApi = (data: ListAlertsReq) => {
  return instance.post<RetrieveAlertsResp>({
    url: `${API_SERVICE.ALERT}/list-cur`,
    data
  })
}

// 按工作空间获取当前告警列表
export const listCurrentAlertsByWorkspaceApi = (data: ListAlertsByWorkspaceReq) => {
  return instance.post<RetrieveAlertsResp>({
    url: `${API_SERVICE.ALERT}/list-cur/by_workspace`,
    data
  })
}
