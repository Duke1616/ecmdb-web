// hooks/useTemplate.ts
import { ref, computed, onMounted } from "vue"
import { getTemplateByWorkflowIdApi } from "@/api/template"
import { template } from "@/api/template/types/template"
import { Rule } from "@form-create/element-ui"

export function useTemplate(workflowId?: number) {
  const templateName = ref<string>("")
  const templates = ref<template[]>([])
  const templateMap = ref<Map<string, template>>(new Map())

  // 计算属性：当前选中模板的字段选项
  const templateFieldOptions = computed(() => {
    const template = templateMap.value.get(templateName.value)
    if (!template) return new Map<string, string>()
    return extractTemplateFields(template)
  })

  // 获取模板数据
  const fetchTemplates = async (workflowId: number) => {
    try {
      const { data } = await getTemplateByWorkflowIdApi(workflowId)
      templates.value = data.templates
      updateTemplateMap(templates.value)
      return true
    } catch {
      templates.value = []
      return false
    }
  }

  // 更新模板映射
  const updateTemplateMap = (templates: template[]) => {
    const newMap = new Map<string, template>()
    templates.forEach((template) => {
      newMap.set(template.name, template)
    })
    templateMap.value = newMap
  }

  // 提取模板字段
  const extractTemplateFields = (template: template) => {
    const map = new Map<string, string>()
    template.rules.forEach((rule: Rule) => {
      if (typeof rule.title === "string" && typeof rule.field === "string") {
        map.set(rule.title, rule.field)
      }
    })
    return map
  }

  // 如果初始化时有 workflowId，自动加载模板
  if (workflowId) {
    onMounted(() => fetchTemplates(workflowId))
  }

  return {
    templateName,
    templates,
    templateFieldOptions,
    fetchTemplates
  }
}
