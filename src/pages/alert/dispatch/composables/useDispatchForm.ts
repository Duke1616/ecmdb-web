import { ref } from "vue"
import type { SaveDispatchRuleReq, DispatchRule } from "@/api/alert/dispatch/types"
import { useDispatchUtils } from "./useDispatchUtils"

export function useDispatchForm() {
  // 使用工具函数
  const { createEmptyFormData, convertRuleToFormData } = useDispatchUtils()

  // 表单数据
  const formData = ref<SaveDispatchRuleReq>(createEmptyFormData())

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
    match_type: [{ required: true, message: "请选择匹配类型", trigger: "change" }],
    workspace_id: [
      {
        required: false,
        validator: (rule: any, value: number | undefined, callback: Function, source: any) => {
          // 只有在 match_type 为 routing 时才必填
          if (source.match_type === "routing" && (!value || value === 0)) {
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
  const fillFormForEdit = (rule: DispatchRule) => {
    formData.value = convertRuleToFormData(rule) as SaveDispatchRuleReq
  }

  return {
    formData,
    formRules,
    resetForm,
    fillFormForEdit
  }
}
