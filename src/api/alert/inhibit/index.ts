import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveInhibitRuleReq,
  SaveInhibitRuleResponse,
  ListInhibitRulesResponse,
  DeleteInhibitRuleResponse
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
