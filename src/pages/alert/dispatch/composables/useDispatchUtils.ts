import { reactive } from "vue"
import { map, pick } from "lodash-es"
import { clearZeroValues } from "@@/utils"
import type { SaveDispatchRuleReq, DispatchRule } from "@/api/alert/dispatch/types"
import { DispatchScope, DispatchMatchType } from "@/api/alert/dispatch/types"

/**
 * 分发规则工具函数 Composable
 */
export function useDispatchUtils() {
  // 创建表单数据的工具函数
  const createFormData = (data: Partial<SaveDispatchRuleReq> = {}): SaveDispatchRuleReq => {
    return reactive({
      name: "",
      scope: DispatchScope.Global,
      rule_id: undefined,
      priority: 0,
      enabled: true,
      description: "",
      match_type: DispatchMatchType.Routing,
      levels: [],
      matchers: [],
      duration: 0,
      firing_count: 0,
      workspace_id: 0,
      metadata: {},
      ...data
    })
  }

  // 处理匹配器数据的工具函数
  const processMatchers = (matchers: any[] = []) => {
    return map(matchers, (matcher) => pick(matcher, ["type", "name", "value"]))
  }

  // 将 DispatchRule 转换为 SaveDispatchRuleReq 的工具函数（自动清空零值）
  const convertRuleToFormData = (rule: DispatchRule): SaveDispatchRuleReq => {
    const data = {
      name: rule.name,
      scope: rule.scope,
      rule_id: rule.rule_id,
      priority: rule.priority || 0,
      enabled: rule.enabled,
      description: rule.description || "",
      match_type: rule.match_type,
      levels: rule.levels || [],
      matchers: processMatchers(rule.matchers),
      duration: rule.duration || 0,
      firing_count: rule.firing_count || 0,
      workspace_id: rule.workspace_id || 0
    }
    return clearZeroValues(data)
  }

  // 重置表单数据（自动清空零值）
  const createEmptyFormData = (): SaveDispatchRuleReq => {
    const data = createFormData()
    return clearZeroValues(data)
  }

  return {
    createFormData,
    processMatchers,
    convertRuleToFormData,
    createEmptyFormData
  }
}
