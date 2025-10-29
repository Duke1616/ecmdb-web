import { ref } from "vue"
import type { SaveRoutingRuleReq, RoutingRule } from "@/api/alert/routing/types"
import { useRoutingUtils } from "./useRoutingUtils"

export function useRoutingForm() {
  // 使用工具函数
  const { createEmptyFormData, convertRuleToFormData } = useRoutingUtils()

  // 表单数据
  const formData = ref<SaveRoutingRuleReq>(createEmptyFormData())

  // 表单验证规则
  const formRules = {
    name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
    scope: [{ required: true, message: "请选择作用域", trigger: "change" }],
    rule_id: [
      {
        required: false,
        validator: (rule: any, value: number | undefined, callback: Function, source: any) => {
          // 只有在 scope 为 rule 时才必填
          if (source.scope === "rule" && (!value || value === 0)) {
            callback(new Error("请选择关联告警规则"))
          } else {
            callback()
          }
        },
        trigger: "change"
      }
    ],
    workspace_id: [
      {
        required: false,
        validator: (rule: any, value: number | undefined, callback: Function) => {
          // 只有在创建路由规则时才必填
          if (!value || value === 0) {
            callback(new Error("请选择目标工作空间"))
          } else {
            callback()
          }
        },
        trigger: "change"
      }
    ]
  }

  // 重置表单
  const resetForm = () => {
    formData.value = createEmptyFormData()
  }

  // 编辑规则时填充表单
  const fillFormForEdit = (rule: RoutingRule) => {
    formData.value = convertRuleToFormData(rule) as SaveRoutingRuleReq
  }

  return {
    formData,
    formRules,
    resetForm,
    fillFormForEdit
  }
}
