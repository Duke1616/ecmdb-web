// 告警规则 API 接口

import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  Rule,
  CreateRuleReq,
  UpdateRuleReq,
  CreateRuleResp,
  RuleGroup,
  CreateRuleGroupReq,
  UpdateRuleGroupReq,
  RuleGroupQueryParams,
  CreateRuleGroupResp,
  ListRulesReq,
  RetrieveRuleGroups,
  // 工作空间规则相关类型
  ListRulesByWorkspaceReq,
  RetrieveRules
} from "./types/rule"

// 告警规则相关 API

/** 获取告警规则列表 */
export function listRulesApi(params: ListRulesReq) {
  return instance.post<RetrieveRules>({
    url: `${API_SERVICE.ALERT}/rule/list`,
    data: params
  })
}

/** 获取告警规则详情 */
export function getRuleApi(id: number) {
  return instance.get<Rule>({
    url: `${API_SERVICE.ALERT}/rule/detail/${id}`
  })
}

/** 创建告警规则 */
export function createRuleApi(data: CreateRuleReq) {
  return instance.post<CreateRuleResp>({
    url: `${API_SERVICE.ALERT}/rule/create`,
    data
  })
}

/** 更新告警规则 */
export function updateRuleApi(data: UpdateRuleReq) {
  return instance.post<Rule>({
    url: `${API_SERVICE.ALERT}/rule/update`,
    data
  })
}

/** 删除告警规则 */
export function deleteRuleApi(id: number) {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/rule/delete/${id}`
  })
}

/** 批量删除告警规则 */
export function batchDeleteRulesApi(ids: number[]) {
  return instance.post({
    url: `${API_SERVICE.ALERT}/rule/batch-delete`,
    data: { ids }
  })
}

/** 启用/禁用告警规则 */
export function toggleRuleApi(id: number, enabled: boolean) {
  return instance.post<Rule>({
    url: `${API_SERVICE.ALERT}/rule/toggle`,
    data: { id, enabled }
  })
}

/** 测试告警规则 */
export function testRuleApi(data: { prom_ql: string; datasource_ids: number[] }) {
  return instance.post<{ result: any }>({
    url: `${API_SERVICE.ALERT}/rule/test`,
    data
  })
}

// 告警规则组相关 API

/** 获取告警规则组列表 */
export function listRuleGroupsApi(params: RuleGroupQueryParams = {}) {
  return instance.post<RetrieveRuleGroups>({
    url: `${API_SERVICE.ALERT}/rule/group/list`,
    data: params
  })
}

/** 获取告警规则组详情 */
export function getRuleGroupApi(id: number) {
  return instance.get<RuleGroup>({
    url: `${API_SERVICE.ALERT}/rule/group/${id}`
  })
}

/** 创建告警规则组 */
export function createRuleGroupApi(data: CreateRuleGroupReq) {
  return instance.post<CreateRuleGroupResp>({
    url: `${API_SERVICE.ALERT}/rule/group/save`,
    data
  })
}

/** 更新告警规则组 */
export function updateRuleGroupApi(data: UpdateRuleGroupReq) {
  return instance.post<RuleGroup>({
    url: `${API_SERVICE.ALERT}/rule/group/save`,
    data
  })
}

/** 删除告警规则组 */
export function deleteRuleGroupApi(id: number) {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/rule/group/${id}`
  })
}

// ==================== 工作空间规则相关 API ====================

/** 获取工作空间规则列表 */
export function listRulesByWorkspaceApi(data: ListRulesByWorkspaceReq) {
  return instance.post<RetrieveRules>({
    url: `${API_SERVICE.ALERT}/rule/list/by_workspace`,
    data
  })
}
