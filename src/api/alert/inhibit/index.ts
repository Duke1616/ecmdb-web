import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveInhibitRuleReq,
  SaveInhibitRuleResponse,
  ListInhibitRulesResponse,
  DeleteInhibitRuleResponse,
  RenewalTimeWindowReq,
  RenewalTimeWindowResponse,
  ListInhibitRuleByWorkspaceReq,
  ListInhibitRuleByWorkspaceResponse,
  ToggleInhibitRuleStatusResponse
} from "./types/index"

// 保存抑制规则
export const saveInhibitRuleApi = (data: SaveInhibitRuleReq) => {
  return instance.post<SaveInhibitRuleResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/save`,
    data
  })
}

// 获取抑制规则列表
export const listInhibitRulesApi = () => {
  return instance.get<ListInhibitRulesResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/list`
  })
}

// 删除抑制规则
export const deleteInhibitRuleApi = (id: number) => {
  return instance.delete<DeleteInhibitRuleResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/delete/${id}`
  })
}

// 续期时间窗口
export const renewalTimeWindowApi = (data: RenewalTimeWindowReq) => {
  return instance.put<RenewalTimeWindowResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/renewal/time_window`,
    data
  })
}

// 根据工作空间获取抑制规则列表
export const listInhibitRulesByWorkspaceApi = (data: ListInhibitRuleByWorkspaceReq) => {
  return instance.post<ListInhibitRuleByWorkspaceResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/list/by_workspace`,
    data
  })
}

// 切换抑制规则状态
export const toggleInhibitRuleStatusApi = (id: number) => {
  return instance.put<ToggleInhibitRuleStatusResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/toggle/status/${id}`
  })
}
