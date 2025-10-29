import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveRoutingRuleReq,
  SaveRoutingRuleResponse,
  ListRoutingRulesResponse,
  DeleteRoutingRuleResponse,
  ToggleRoutingRuleStatusResponse,
  SwapPrioritiesReq,
  SwapPrioritiesResponse,
  RoutingRule,
  FindMatchingRulesReq,
  FindMatchingRulesResponse
} from "./types/index"

// 创建路由规则
export const createRoutingRuleApi = (data: SaveRoutingRuleReq) => {
  return instance.post<SaveRoutingRuleResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/create`,
    data
  })
}

// 更新路由规则
export const updateRoutingRuleApi = (data: SaveRoutingRuleReq) => {
  return instance.put<SaveRoutingRuleResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/update`,
    data
  })
}

// 保存路由规则（统一创建和更新）
export const saveRoutingRuleApi = (data: SaveRoutingRuleReq) => {
  if (data.id) {
    return updateRoutingRuleApi(data)
  }
  return createRoutingRuleApi(data)
}

// 删除路由规则
export const deleteRoutingRuleApi = (id: number) => {
  return instance.delete<DeleteRoutingRuleResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/delete/${id}`
  })
}

// 获取路由规则详情
export const getRoutingRuleByIdApi = (id: number) => {
  return instance.get<RoutingRule>({
    url: `${API_SERVICE.ALERT}/routing_rule/detail/${id}`
  })
}

// 按作用域获取路由规则列表
export const listRoutingRulesByScopeApi = (scope: string) => {
  return instance.get<ListRoutingRulesResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/list/${scope}`
  })
}

// 根据告警规则ID获取路由规则列表
export const listRoutingRulesByRuleApi = (ruleId: number) => {
  return instance.get<ListRoutingRulesResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/by_rule/${ruleId}`
  })
}

// 切换路由规则状态
export const toggleRoutingRuleStatusApi = (id: number) => {
  return instance.patch<ToggleRoutingRuleStatusResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/status/toggle/${id}`
  })
}

// 交换两个规则的优先级
export const swapPrioritiesApi = (data: SwapPrioritiesReq) => {
  return instance.post<SwapPrioritiesResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/swap_priorities`,
    data
  })
}

// 查找匹配的路由规则
export const findMatchingRulesApi = (data: FindMatchingRulesReq) => {
  return instance.post<FindMatchingRulesResponse>({
    url: `${API_SERVICE.ALERT}/routing_rule/find_matching`,
    data
  })
}
