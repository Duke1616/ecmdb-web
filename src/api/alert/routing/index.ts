import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  SaveRoutingRuleReq,
  SaveRoutingRuleResponse,
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
