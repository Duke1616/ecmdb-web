import { ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import type { SaveTicketConfigReq, TicketConfig } from "@/api/alert/ticket_config/types"
import { clearZeroValues } from "@@/utils"
import { useTicketConfigUtils } from "./useTicketConfigUtils.js"

export function useTicketConfigForm() {
  // 使用工具函数
  const { createEmptyFormData, convertConfigToFormData } = useTicketConfigUtils()

  // 表单数据
  const formData = ref<SaveTicketConfigReq>(createEmptyFormData())

  // 表单验证规则
  const formRules: FormRules = {
    name: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
    template_id: [{ required: true, message: "请选择工单模板", trigger: "change" }],
    workflow_id: [{ required: true, message: "请选择工作流", trigger: "change" }]
  }

  // 重置表单
  const resetForm = () => {
    formData.value = createEmptyFormData()
  }

  // 编辑配置时填充表单
  const fillFormForEdit = (config: TicketConfig) => {
    formData.value = convertConfigToFormData(config)
  }

  // 获取清理后的表单数据（清除零值）
  const getCleanedFormData = (): SaveTicketConfigReq => {
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
