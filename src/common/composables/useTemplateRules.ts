import { ref } from "vue"
import { getTemplateRulesByWorkflowIdApi } from "@/api/ticket/template"
import type { templateRule } from "@/api/ticket/template/types/template"
import type { Rule as FormRule } from "@form-create/element-ui"

// 仅合并同一工作流的并发请求，不缓存结果，避免模板绑定变化后继续显示旧数据。
const pendingRequests = new Map<number, Promise<templateRule[]>>()

/**
 * 工作流模板规则 Composable
 * 抽离通用逻辑，并合并同一工作流的并发请求
 */
export function useTemplateRules() {
  const localRules = ref<templateRule[]>([])
  const isLoading = ref(false)
  const loadError = ref("")

  /**
   * 获取指定工作流的模板规则
   * @param workflowId 工作流 ID
   */
  const fetchTemplates = async (workflowId: number | undefined) => {
    if (!workflowId) {
      localRules.value = []
      loadError.value = ""
      return
    }

    isLoading.value = true
    loadError.value = ""
    try {
      let request = pendingRequests.get(workflowId)
      if (!request) {
        request = getTemplateRulesByWorkflowIdApi(workflowId)
          .then(({ data }) => data.template_rules || [])
          .finally(() => pendingRequests.delete(workflowId))
        pendingRequests.set(workflowId, request)
      }

      localRules.value = await request
    } catch (error) {
      console.error("[useTemplateRules] 加载模板失败:", error)
      localRules.value = []
      loadError.value = "模板字段加载失败"
    } finally {
      isLoading.value = false
    }
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
    loadError,
    fetchTemplates,
    getTemplateFieldOptions
  }
}
