import { reactive } from "vue"
import { map, pick } from "lodash-es"
import { clearZeroValues } from "@@/utils"
import type { SaveRoutingRuleReq, RoutingRule } from "@/api/alert/routing/types"
import { RoutingScope } from "@/api/alert/routing/types"

/**
 * 路由规则工具函数 Composable
 */
export function useRoutingUtils() {
  // 创建表单数据的工具函数
  const createFormData = (data: Partial<SaveRoutingRuleReq> = {}): SaveRoutingRuleReq => {
    return reactive({
      name: "",
      scope: RoutingScope.Global,
      rule_id: undefined,
      priority: 0,
      enabled: true,
      description: "",
      levels: [],
      matchers: [],
      workspace_id: 0,
      metadata: {},
      ...data
    })
  }

  // 处理匹配器数据的工具函数
  const processMatchers = (matchers: any[] = []) => {
    return map(matchers, (matcher) => pick(matcher, ["type", "name", "value"]))
  }

  // 将 RoutingRule 转换为 SaveRoutingRuleReq 的工具函数（自动清空零值）
  const convertRuleToFormData = (rule: RoutingRule): SaveRoutingRuleReq => {
    const data = {
      name: rule.name,
      scope: rule.scope,
      rule_id: rule.rule_id,
      priority: rule.priority || 0,
      enabled: rule.enabled,
      description: rule.description || "",
      levels: rule.levels || [],
      matchers: processMatchers(rule.matchers),
      workspace_id: rule.workspace_id || 0
    }
    return clearZeroValues(data)
  }

  // 重置表单数据（自动清空零值）
  const createEmptyFormData = (): SaveRoutingRuleReq => {
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
