import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  CreateAggregateGroupRuleReq,
  AggregateGroupRule,
  ListAggregateRulesReq,
  ListAggregateRulesResponse,
  DeleteAggregateRuleReq,
  DeleteAggregateRuleResponse
} from "./types"

// 保存聚合组规则
export const saveAggregateRuleApi = (data: CreateAggregateGroupRuleReq) => {
  return instance.post<AggregateGroupRule>({
    url: `${API_SERVICE.ALERT}/aggregate/save`,
    data
  })
}

// 获取聚合组规则列表
export const listAggregateRulesApi = (data: ListAggregateRulesReq) => {
  return instance.post<ListAggregateRulesResponse>({
    url: `${API_SERVICE.ALERT}/aggregate/list`,
    data
  })
}

// 删除聚合组规则
export const deleteAggregateRuleApi = (data: DeleteAggregateRuleReq) => {
  return instance.post<DeleteAggregateRuleResponse>({
    url: `${API_SERVICE.ALERT}/aggregate/delete`,
    data
  })
}

// 获取聚合组规则详情
export const getAggregateRuleDetailApi = (data: { id: number }) => {
  return instance.post<AggregateGroupRule>({
    url: `${API_SERVICE.ALERT}/aggregate/detail`,
    data
  })
}
