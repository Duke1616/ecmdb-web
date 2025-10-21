import { ref } from "vue"
import { FormInstance, FormRules } from "element-plus"
import type { CreateAggregateGroupRuleReq, AggregateGroupRule } from "@/api/aggregate/types"

export function useAggregateForm(workspaceId: number) {
  // 表单数据
  const formData = ref<CreateAggregateGroupRuleReq>({
    workspace_id: workspaceId,
    type: 0,
    labels: [],
    matchers: [],
    group_wait: 0,
    group_interval: 0,
    repeat_interval: 0,
    is_diff_data_source: false
  })

  // 表单验证规则
  const formRules: FormRules = {
    type: [{ required: true, message: "请选择聚合类型", trigger: "change" }],
    labels: [{ required: true, message: "请选择聚合标签", trigger: "change" }]
  }

  // 重置表单
  const resetForm = () => {
    formData.value = {
      workspace_id: workspaceId,
      type: 0,
      labels: [],
      matchers: [],
      group_wait: 0,
      group_interval: 0,
      repeat_interval: 0,
      is_diff_data_source: false
    }
  }

  // 编辑规则时填充表单
  const fillFormForEdit = (rule: AggregateGroupRule) => {
    formData.value = {
      workspace_id: rule.workspace_id,
      type: rule.type,
      labels: rule.labels,
      matchers: rule.matchers,
      group_wait: rule.group_wait,
      group_interval: rule.group_interval,
      repeat_interval: rule.repeat_interval,
      is_diff_data_source: rule.is_diff_data_source
    }
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
    validateForm
  }
}
