import { ref } from "vue"
import formCreate, { FormRule } from "@form-create/element-ui"
import { ElMessage } from "element-plus"
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import { removeFetchFromRules } from "@/common/utils/form-create"
import type { FormCreateOptions } from "../types"

interface UseTicketTemplateOptions {
  action: () => string
}

/**
 * 工单表单模板解析与规则加载 Composable
 */
export function useTicketTemplate(optionsRef: UseTicketTemplateOptions) {
  const rule = ref<FormRule[]>([])
  const options = ref<FormCreateOptions>()
  const loading = ref(false)

  const isReadonlyTemplateMode = () => {
    const act = optionsRef.action()
    return act !== "my" && act !== "my-Start"
  }

  const handleDetail = async (id: number) => {
    loading.value = true
    try {
      const { data: template } = await detailTemplateApi(id)
      const parsedOptions = formCreate.parseJson(template.options) as FormCreateOptions
      parsedOptions.submitBtn = false

      const parsedRules = formCreate.parseJson(template.rules) as FormRule[]

      if (isReadonlyTemplateMode()) {
        removeFetchFromRules(parsedRules)
        removeFetchFromRules(parsedOptions)
      }

      options.value = parsedOptions
      rule.value = parsedRules
    } catch (error) {
      options.value = undefined
      rule.value = []
      ElMessage.error("获取工单模板失败")
    } finally {
      loading.value = false
    }
  }

  const resetTemplate = () => {
    options.value = undefined
    rule.value = []
  }

  return {
    rule,
    options,
    loading,
    handleDetail,
    resetTemplate
  }
}
