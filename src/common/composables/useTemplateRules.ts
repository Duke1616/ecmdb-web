// hooks/useTemplate.ts
import { ref, onMounted } from "vue"
import { getTemplateRulesByWorkflowIdApi } from "@/api/template"
import type { rule, templateRule } from "@/api/template/types/template"
import type { Rule as FormRule } from "@form-create/element-ui"

export function useTemplateRules(workflowId?: number) {
  // 存储所有模板规则数据
  const templateRulesList = ref<templateRule[]>([])
  // 存储模板ID到规则的映射
  const templateRulesMap = ref<Map<number, rule[]>>(new Map())

  /**
   * 获取指定模板的字段选项
   * @param templateId 模板ID
   * @returns Map<字段标题, 字段名称>
   */
  const getTemplateFieldOptions = (templateId: number) => {
    const template = templateRulesMap.value.get(templateId)
    if (!template) return new Map<string, string>()
    return extractTemplateFields(template)
  }

  /**
   * 获取模板数据
   * @param workflowId 工作流ID
   * @returns 是否加载成功
   */
  const fetchTemplates = async (workflowId: number) => {
    try {
      const { data } = await getTemplateRulesByWorkflowIdApi(workflowId)
      templateRulesList.value = data.template_rules
      updateTemplateMaps(templateRulesList.value)
      return true
    } catch (error) {
      console.error("加载模板失败:", error)
      templateRulesList.value = []
      resetMaps()
      return false
    }
  }

  /**
   * 更新所有模板映射
   * @param rules 模板规则数组
   */
  const updateTemplateMaps = (rules: templateRule[]) => {
    const newTemplateMap = new Map<number, templateRule>()
    const newRulesMap = new Map<number, rule[]>()

    rules.forEach((template) => {
      newTemplateMap.set(template.id, template)
      newRulesMap.set(template.id, template.rules)
    })

    templateRulesMap.value = newRulesMap
  }

  /**
   * 重置所有映射
   */
  const resetMaps = () => {
    templateRulesMap.value = new Map()
  }

  /**
   * 从模板中提取字段映射
   * @param template 模板数据
   * @returns Map<字段标题, 字段名称>
   */
  const extractTemplateFields = (template: rule[]) => {
    const fieldMap = new Map<string, string>()
    template.forEach((rule: FormRule) => {
      if (rule.title && rule.field) {
        fieldMap.set(rule.title.toString(), rule.field.toString())
      }
    })
    return fieldMap
  }

  // 如果初始化时有workflowId，自动加载模板
  if (workflowId) {
    onMounted(() => fetchTemplates(workflowId))
  }

  return {
    templateRules: templateRulesList, // 所有模板规则列表
    templateRulesMap, // 模板ID到规则的映射
    getTemplateFieldOptions, // 获取字段选项方法
    fetchTemplates // 加载模板方法
  }
}
