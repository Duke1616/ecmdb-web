import { reactive } from "vue"
import { map, pick } from "lodash-es"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"
import { InhibitScope } from "@/api/alert/inhibit/types"

/**
 * 抑制规则工具函数 Composable
 */
export function useInhibitUtils() {
  // 创建表单数据的工具函数
  const createFormData = (data: Partial<SaveInhibitRuleReq> = {}): SaveInhibitRuleReq => {
    return reactive({
      name: "",
      source_matchers: [],
      target_matchers: [],
      equal_labels: [],
      time_window: null,
      enabled: true,
      scope: InhibitScope.Global,
      workspace_id: undefined,
      ...data
    })
  }

  // 处理匹配器数据的工具函数
  const processMatchers = (matchers: any[] = []) => {
    return map(matchers, (matcher) => pick(matcher, ["type", "name", "value"]))
  }

  // 将 InhibitRule 转换为 SaveInhibitRuleReq 的工具函数
  const convertRuleToFormData = (rule: InhibitRule): Partial<SaveInhibitRuleReq> => {
    return {
      id: rule.id,
      name: rule.name,
      source_matchers: processMatchers(rule.source_match),
      target_matchers: processMatchers(rule.target_match),
      equal_labels: rule.equal_labels || [],
      time_window: rule.time_window,
      enabled: rule.enabled,
      scope: rule.scope,
      workspace_id: rule.workspace_id
    }
  }

  // 将 InhibitRule 转换为 API 请求数据的工具函数
  const convertRuleToApiData = (rule: InhibitRule) => {
    return {
      id: rule.id,
      name: rule.name,
      source_matchers: rule.source_match || [],
      target_matchers: rule.target_match || [],
      equal_labels: rule.equal_labels || [],
      time_window: rule.time_window,
      enabled: rule.enabled,
      scope: rule.scope,
      workspace_id: rule.workspace_id
    }
  }

  // 重置表单数据
  const createEmptyFormData = (): SaveInhibitRuleReq => {
    return createFormData()
  }

  return {
    createFormData,
    processMatchers,
    convertRuleToFormData,
    convertRuleToApiData,
    createEmptyFormData
  }
}
