import { ref } from "vue"
import { FormInstance, FormRules } from "element-plus"
import { defaults } from "lodash-es"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"
import { clearZeroValues } from "@@/utils"
import { useInhibitUtils } from "./useInhibitUtils"

export function useInhibitForm() {
  // 使用工具函数
  const { createEmptyFormData, convertRuleToFormData } = useInhibitUtils()

  // 表单数据
  const formData = ref<SaveInhibitRuleReq>(createEmptyFormData())

  // 表单验证规则
  const formRules: FormRules = {
    name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
    source_matchers: [{ required: true, message: "请配置源匹配器", trigger: "change" }],
    target_matchers: [{ required: true, message: "请配置目标匹配器", trigger: "change" }],
    equal_labels: [{ required: true, message: "请配置相同标签", trigger: "change" }],
    scope: [{ required: true, message: "请选择生效范围", trigger: "change" }]
  }

  // 重置表单
  const resetForm = () => {
    formData.value = createEmptyFormData()
  }

  // 编辑规则时填充表单
  const fillFormForEdit = (rule: InhibitRule) => {
    // 使用工具函数转换数据
    formData.value = defaults(convertRuleToFormData(rule), createEmptyFormData())
  }

  // 获取清理后的表单数据（清除零值）
  const getCleanedFormData = (): SaveInhibitRuleReq => {
    return clearZeroValues(formData.value)
  }

  // 验证表单
  const validateForm = async (formRef: FormInstance | undefined): Promise<boolean> => {
    if (!formRef) {
      return false
    }

    try {
      await formRef.validate()
      return true
    } catch (error) {
      console.error("表单验证失败:", error)
      return false
    }
  }

  return {
    formData,
    formRules,
    resetForm,
    fillFormForEdit,
    validateForm,
    getCleanedFormData
  }
}
