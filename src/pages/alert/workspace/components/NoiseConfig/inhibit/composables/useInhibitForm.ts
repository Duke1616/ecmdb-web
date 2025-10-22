import { ref } from "vue"
import { FormInstance, FormRules } from "element-plus"
import { defaults } from "lodash-es"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"
import { InhibitScope } from "@/api/alert/inhibit/types"
import { clearZeroValues } from "@@/utils"

export function useInhibitForm() {
  // 表单默认值
  const defaultFormData: SaveInhibitRuleReq = {
    name: "",
    source_matchers: [],
    target_matchers: [],
    equal_labels: [],
    time_window: null,
    enabled: true,
    scope: InhibitScope.Global,
    workspace_id: undefined
  }

  // 表单数据
  const formData = ref<SaveInhibitRuleReq>({ ...defaultFormData })

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
    formData.value = { ...defaultFormData }
  }

  // 编辑规则时填充表单
  const fillFormForEdit = (rule: InhibitRule) => {
    // 使用 lodash 优化数据合并和字段映射
    formData.value = defaults(
      {
        id: rule.id,
        name: rule.name,
        source_matchers: rule.source_match || [],
        target_matchers: rule.target_match || [],
        equal_labels: rule.equal_labels || [],
        time_window: rule.time_window,
        enabled: rule.enabled,
        scope: rule.scope,
        workspace_id: rule.workspace_id
      },
      defaultFormData
    )
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
