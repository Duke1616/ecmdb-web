import { FormRules } from "element-plus"

// 通用的表单验证规则
export const COMMON_FORM_RULES: Record<string, FormRules> = {
  // 基本信息验证规则
  BASIC_INFO: {
    name: [{ required: true, message: "请输入名称", trigger: "blur" }],
    icon: [{ required: true, message: "请选择应用图标", trigger: "change" }]
  },

  // 模板信息验证规则
  TEMPLATE_INFO: {
    name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
    group_id: [{ required: true, message: "请选择所属分组", trigger: "change" }],
    workflow_id: [{ required: true, message: "请选择关联流程", trigger: "change" }],
    icon: [{ required: true, message: "请选择应用图标", trigger: "change" }]
  },

  // 流程信息验证规则
  WORKFLOW_INFO: {
    name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
    icon: [{ required: true, message: "请选择应用图标", trigger: "change" }]
  }
}

// 根据步骤获取验证规则的工厂函数
export function getFormRulesByStep(stepType: string, currentStep: number): FormRules {
  if (currentStep === 0) {
    return COMMON_FORM_RULES[stepType] || {}
  }
  return {}
}
