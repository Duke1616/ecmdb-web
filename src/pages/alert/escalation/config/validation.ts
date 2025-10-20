import type { FormRules } from "element-plus"
import { ESCALATION_TRIGGER_TYPES, ESCALATION_LOGIC_TYPES } from "@/api/alert/escalation/types"
import { BUSINESS_TYPES } from "@@/composables/useBusinessPicker"
import type { CreateConfigReq, EscalationTrigger, EscalationStep } from "@/api/alert/escalation/types"

// 升级配置表单验证规则
export const escalationConfigFormRules: FormRules = {
  // 基本信息验证
  biz_id: [
    { required: true, message: "请选择业务类型", trigger: "change" },
    { type: "number", min: 1, max: 2, message: "业务类型必须在 1 到 2 之间", trigger: "change" }
  ],
  key: [
    { required: true, message: "请输入业务唯一值", trigger: "blur" },
    { min: 1, max: 50, message: "业务唯一值长度在 1 到 50 个字符", trigger: "blur" }
  ],
  name: [
    { required: true, message: "请输入配置名称", trigger: "blur" },
    { min: 1, max: 50, message: "配置名称长度在 1 到 50 个字符", trigger: "blur" }
  ],
  description: [{ max: 200, message: "配置描述长度不能超过 200 个字符", trigger: "blur" }],
  timeout: [
    { required: true, message: "请输入超时时间", trigger: "blur" },
    { type: "number", min: 1000, max: 3600000, message: "超时时间必须在 1000 到 3600000 毫秒之间", trigger: "blur" }
  ],
  enabled: [{ required: true, message: "请选择是否启用", trigger: "change" }],

  // 触发逻辑验证
  "trigger_logic.type": [{ required: true, message: "请选择触发逻辑", trigger: "change" }],
  "trigger_logic.expression": [{ max: 500, message: "触发表达式长度不能超过 500 个字符", trigger: "blur" }],
  "trigger_logic.description": [{ max: 200, message: "触发逻辑描述长度不能超过 200 个字符", trigger: "blur" }]
}

// 触发条件验证规则
export const triggerFormRules: FormRules = {
  type: [{ required: true, message: "请选择触发类型", trigger: "change" }],
  description: [{ max: 200, message: "触发条件描述长度不能超过 200 个字符", trigger: "blur" }]
}

// 时间触发配置验证规则
export const timeTriggerConfigRules: FormRules = {
  delay: [
    { required: true, message: "请输入延迟时间", trigger: "blur" },
    { type: "number", min: 1, max: 1440, message: "延迟时间必须在 1 到 1440 之间", trigger: "blur" }
  ],
  unit: [{ required: true, message: "请选择时间单位", trigger: "change" }]
}

// 级别触发配置验证规则
export const levelTriggerConfigRules: FormRules = {
  target_alert_levels: [
    { required: true, message: "请选择目标告警级别", trigger: "change" },
    { type: "array", min: 1, message: "至少选择一个告警级别", trigger: "change" }
  ],
  min_alert_level: [{ required: true, message: "请选择最小告警级别", trigger: "change" }]
}

// 无响应触发配置验证规则
export const noResponseTriggerConfigRules: FormRules = {
  check_interval: [
    { required: true, message: "请输入检查间隔", trigger: "blur" },
    { type: "number", min: 1000, max: 3600000, message: "检查间隔必须在 1000 到 3600000 毫秒之间", trigger: "blur" }
  ],
  max_attempts: [
    { required: true, message: "请输入最大尝试次数", trigger: "blur" },
    { type: "number", min: 1, max: 10, message: "最大尝试次数必须在 1 到 10 之间", trigger: "blur" }
  ],
  required_acks: [
    { required: true, message: "请输入需要确认数", trigger: "blur" },
    { type: "number", min: 1, max: 100, message: "需要确认数必须在 1 到 100 之间", trigger: "blur" }
  ]
}

// 手动触发配置验证规则
export const manualTriggerConfigRules: FormRules = {
  allowed_users: [
    { required: true, message: "请选择允许的用户", trigger: "change" },
    { type: "array", min: 1, message: "至少选择一个用户", trigger: "change" }
  ],
  require_auth: [{ required: true, message: "请选择是否需要认证", trigger: "change" }]
}

// 自定义触发配置验证规则
export const customTriggerConfigRules: FormRules = {
  expression: [
    { required: true, message: "请输入自定义表达式", trigger: "blur" },
    { min: 1, max: 1000, message: "自定义表达式长度在 1 到 1000 个字符", trigger: "blur" }
  ]
}

// 升级步骤验证规则
export const escalationStepFormRules: FormRules = {
  level: [
    { required: true, message: "请输入升级级别", trigger: "blur" },
    { type: "number", min: 1, max: 10, message: "升级级别必须在 1 到 10 之间", trigger: "blur" }
  ],
  template_set_id: [{ required: true, message: "请选择模板集", trigger: "change" }],
  step_template_id: [{ required: true, message: "请选择步骤模板", trigger: "change" }],
  delay: [
    { required: true, message: "请输入延迟时间", trigger: "blur" },
    { type: "number", min: 0, max: 3600000, message: "延迟时间必须在 0 到 3600000 毫秒之间", trigger: "blur" }
  ],
  max_retries: [
    { required: true, message: "请输入最大重试次数", trigger: "blur" },
    { type: "number", min: 0, max: 10, message: "最大重试次数必须在 0 到 10 之间", trigger: "blur" }
  ],
  retry_interval: [
    { required: true, message: "请输入重试间隔", trigger: "blur" },
    { type: "number", min: 1000, max: 3600000, message: "重试间隔必须在 1000 到 3600000 毫秒之间", trigger: "blur" }
  ],
  urgency_level: [
    { required: true, message: "请输入紧急程度", trigger: "blur" },
    { type: "number", min: 1, max: 5, message: "紧急程度必须在 1 到 5 之间", trigger: "blur" }
  ],
  condition_expr: [{ max: 500, message: "条件表达式长度不能超过 500 个字符", trigger: "blur" }]
}

// 根据触发类型获取对应的验证规则
export const getTriggerConfigRules = (triggerType: string): FormRules => {
  switch (triggerType) {
    case ESCALATION_TRIGGER_TYPES.TIME:
      return timeTriggerConfigRules
    case ESCALATION_TRIGGER_TYPES.LEVEL:
      return levelTriggerConfigRules
    case ESCALATION_TRIGGER_TYPES.NO_RESPONSE:
      return noResponseTriggerConfigRules
    case ESCALATION_TRIGGER_TYPES.MANUAL:
      return manualTriggerConfigRules
    case ESCALATION_TRIGGER_TYPES.CUSTOM:
      return customTriggerConfigRules
    default:
      return {}
  }
}

// 验证触发条件是否有效
export const validateTrigger = (trigger: EscalationTrigger): string[] => {
  const errors: string[] = []

  if (!trigger.type) {
    errors.push("触发类型不能为空")
  }

  if (!trigger.description || trigger.description.trim() === "") {
    errors.push("触发条件描述不能为空")
  }

  // 根据类型验证配置
  switch (trigger.type) {
    case ESCALATION_TRIGGER_TYPES.TIME:
      if (!trigger.config?.time_config?.delay || trigger.config.time_config.delay <= 0) {
        errors.push("时间触发配置的延迟时间必须大于0")
      }
      if (!trigger.config?.time_config?.unit) {
        errors.push("时间触发配置的时间单位不能为空")
      }
      break
    case ESCALATION_TRIGGER_TYPES.LEVEL:
      if (!trigger.config?.level_config?.target_alert_levels?.length) {
        errors.push("级别触发配置的目标告警级别不能为空")
      }
      if (!trigger.config?.level_config?.min_alert_level) {
        errors.push("级别触发配置的最小告警级别不能为空")
      }
      break
    case ESCALATION_TRIGGER_TYPES.NO_RESPONSE:
      if (
        !trigger.config?.no_response_config?.check_interval ||
        trigger.config.no_response_config.check_interval <= 0
      ) {
        errors.push("无响应触发配置的检查间隔必须大于0")
      }
      if (!trigger.config?.no_response_config?.max_attempts || trigger.config.no_response_config.max_attempts <= 0) {
        errors.push("无响应触发配置的最大尝试次数必须大于0")
      }
      break
    case ESCALATION_TRIGGER_TYPES.MANUAL:
      if (!trigger.config?.manual_config?.allowed_users?.length) {
        errors.push("手动触发配置的允许用户不能为空")
      }
      break
    case ESCALATION_TRIGGER_TYPES.CUSTOM:
      if (!trigger.config?.custom_config?.expression || trigger.config.custom_config.expression.trim() === "") {
        errors.push("自定义触发配置的表达式不能为空")
      }
      break
  }

  return errors
}

// 验证升级步骤是否有效
export const validateEscalationStep = (step: EscalationStep): string[] => {
  const errors: string[] = []

  if (!step.level || step.level <= 0) {
    errors.push("升级级别必须大于0")
  }

  if (!step.template_set_id) {
    errors.push("模板集不能为空")
  }

  if (!step.step_template_id) {
    errors.push("步骤模板不能为空")
  }

  if (step.delay < 0) {
    errors.push("延迟时间不能为负数")
  }

  if (step.max_retries < 0) {
    errors.push("最大重试次数不能为负数")
  }

  if (step.retry_interval < 0) {
    errors.push("重试间隔不能为负数")
  }

  if (!step.urgency_level || step.urgency_level < 1 || step.urgency_level > 5) {
    errors.push("紧急程度必须在1到5之间")
  }

  return errors
}

// 验证整个升级配置
export const validateEscalationConfig = (config: CreateConfigReq): string[] => {
  const errors: string[] = []

  // 验证基本信息
  if (!config.biz_id || (config.biz_id !== BUSINESS_TYPES.WORKSPACE && config.biz_id !== BUSINESS_TYPES.WORKFLOW)) {
    errors.push("业务类型不能为空或无效")
  }

  if (!config.key || config.key.trim() === "") {
    errors.push("业务唯一值不能为空")
  }

  if (!config.name || config.name.trim() === "") {
    errors.push("配置名称不能为空")
  }

  if (!config.timeout || config.timeout <= 0) {
    errors.push("超时时间必须大于0")
  }

  // 验证触发逻辑
  if (!config.trigger_logic) {
    errors.push("触发逻辑不能为空")
  }

  // 只有自定义逻辑时才需要表达式
  if (
    config.trigger_logic.type === ESCALATION_LOGIC_TYPES.CUSTOM &&
    (!config.trigger_logic.expression || config.trigger_logic.expression.trim() === "")
  ) {
    errors.push("自定义逻辑的触发表达式不能为空")
  }

  // 验证触发条件
  if (!config.triggers || config.triggers.length === 0) {
    errors.push("至少需要一个触发条件")
  } else {
    config.triggers.forEach((trigger: EscalationTrigger, index: number) => {
      const triggerErrors = validateTrigger(trigger)
      if (triggerErrors.length > 0) {
        errors.push(`触发条件${index + 1}: ${triggerErrors.join(", ")}`)
      }
    })
  }

  // 验证升级步骤
  if (!config.steps || config.steps.length === 0) {
    errors.push("至少需要一个升级步骤")
  } else {
    config.steps.forEach((step: EscalationStep, index: number) => {
      const stepErrors = validateEscalationStep(step)
      if (stepErrors.length > 0) {
        errors.push(`升级步骤${index + 1}: ${stepErrors.join(", ")}`)
      }
    })
  }

  return errors
}
