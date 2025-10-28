import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveDispatchRuleReq,
  SaveDispatchRuleResponse,
  ListDispatchRulesResponse,
  DeleteDispatchRuleResponse,
  ToggleDispatchRuleStatusResponse,
  SwapPrioritiesReq,
  SwapPrioritiesResponse,
  DispatchRule,
  FindMatchingRulesReq,
  FindMatchingRulesResponse
} from "./types/index"

// 创建分发规则
export const createDispatchRuleApi = (data: SaveDispatchRuleReq) => {
  return instance.post<SaveDispatchRuleResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/create`,
    data
  })
}

// 更新分发规则
export const updateDispatchRuleApi = (data: SaveDispatchRuleReq) => {
  return instance.put<SaveDispatchRuleResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/update`,
    data
  })
}

// 保存分发规则（统一创建和更新）
export const saveDispatchRuleApi = (data: SaveDispatchRuleReq) => {
  if (data.id) {
    return updateDispatchRuleApi(data)
  }
  return createDispatchRuleApi(data)
}

// 删除分发规则
export const deleteDispatchRuleApi = (id: number) => {
  return instance.delete<DeleteDispatchRuleResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/delete/${id}`
  })
}

// 获取分发规则详情
export const getDispatchRuleByIdApi = (id: number) => {
  return instance.get<DispatchRule>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/detail/${id}`
  })
}

// 按作用域获取分发规则列表
export const listDispatchRulesByScopeApi = (scope: string) => {
  return instance.get<ListDispatchRulesResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/list/${scope}`
  })
}

// 根据告警规则ID获取分发规则列表
export const listDispatchRulesByRuleApi = (ruleId: number) => {
  return instance.get<ListDispatchRulesResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/by_rule/${ruleId}`
  })
}

// 切换分发规则状态
export const toggleDispatchRuleStatusApi = (id: number) => {
  return instance.patch<ToggleDispatchRuleStatusResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/status/toggle/${id}`
  })
}

// 交换两个规则的优先级
export const swapPrioritiesApi = (data: SwapPrioritiesReq) => {
  return instance.post<SwapPrioritiesResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/swap_priorities`,
    data
  })
}

// 查找匹配的分发规则
export const findMatchingRulesApi = (data: FindMatchingRulesReq) => {
  return instance.post<FindMatchingRulesResponse>({
    url: `${API_SERVICE.ALERT}/dispatch_rule/find_matching`,
    data
  })
}
