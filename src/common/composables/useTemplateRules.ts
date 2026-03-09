import { ref } from "vue"
import { getTemplateRulesByWorkflowIdApi } from "@/api/template"
import type { templateRule } from "@/api/template/types/template"
import type { Rule as FormRule } from "@form-create/element-ui"

// ── 共享状态 (跨组件实例) ──────────────────────────────────────────────────
// 使用全局变量作为简单的缓存存储，避免同一个 workflowId 在不同节点实例中重复请求
const templateRulesCache = new Map<number, templateRule[]>()
const globalLoadingMap = new Map<number, Promise<void>>()

/**
 * 工作流模板规则 Composable
 * 抽离通用逻辑，支持缓存与请求去重
 */
export function useTemplateRules() {
  const localRules = ref<templateRule[]>([])
  const isLoading = ref(false)

  /**
   * 获取指定工作流的模板规则
   * @param workflowId 工作流 ID
   */
  const fetchTemplates = async (workflowId: number | undefined) => {
    if (!workflowId) return

    // 1. 命中缓存直接同步更新
    if (templateRulesCache.has(workflowId)) {
      localRules.value = templateRulesCache.get(workflowId) || []
      return
    }

    // 2. 检查是否有正在进行的同一 workflowId 的请求
    if (globalLoadingMap.has(workflowId)) {
      isLoading.value = true
      await globalLoadingMap.get(workflowId)
      localRules.value = templateRulesCache.get(workflowId) || []
      isLoading.value = false
      return
    }

    // 3. 发起新请求 (Singleton Promise)
    isLoading.value = true
    const fetchPromise = (async () => {
      try {
        const { data } = await getTemplateRulesByWorkflowIdApi(workflowId)
        const rules = data.template_rules || []
        templateRulesCache.set(workflowId, rules)
      } catch (error) {
        console.error("[useTemplateRules] 加载模板失败:", error)
        // 失败后记录空数组，防止短时间内重复触发错误请求
        templateRulesCache.set(workflowId, [])
      } finally {
        globalLoadingMap.delete(workflowId)
      }
    })()

    globalLoadingMap.set(workflowId, fetchPromise)
    await fetchPromise
    localRules.value = templateRulesCache.get(workflowId) || []
    isLoading.value = false
  }

  /**
   * 获取指定模板的字段选项
   * @param templateId 模板 ID
   * @returns Map<字段标题, 字段名称>
   */
  const getTemplateFieldOptions = (templateId: number) => {
    const template = localRules.value.find((t) => t.id === templateId)
    if (!template) return new Map<string, string>()

    const fieldMap = new Map<string, string>()
    // 处理 rules 数组 (来自 API 的定义)
    template.rules?.forEach((rule: FormRule) => {
      if (rule.title && rule.field) {
        fieldMap.set(rule.title.toString(), rule.field.toString())
      }
    })
    return fieldMap
  }

  return {
    templateRules: localRules,
    isLoading,
    fetchTemplates,
    getTemplateFieldOptions
  }
}
