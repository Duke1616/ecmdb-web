/**
 * 消息升级相关类型定义
 */

import { CHANNEL_TYPES, type ChannelType } from "../../template/types"

// 重新导出渠道类型枚举，方便其他模块使用
export { CHANNEL_TYPES }

// 升级配置相关类型
export interface CreateConfigReq {
  biz_id: number
  key: string
  name: string
  description?: string
  enabled?: boolean
  timeout?: number
  triggers: EscalationTrigger[]
  trigger_logic: EscalationLogic
  steps: EscalationStep[]
  created_by: string
}

export interface CreateConfigResp {
  config: ConfigVO
}

export interface UpdateConfigReq {
  id: number
  name: string
  description?: string
  enabled?: boolean
  timeout?: number
  triggers: EscalationTrigger[]
  trigger_logic: EscalationLogic
  steps: EscalationStep[]
}

export interface GetConfigResp {
  config: ConfigVO
}

export interface ListConfigsReq {
  biz_id: number
  offset?: number
  limit?: number
}

export interface ListConfigsResp {
  configs: ConfigVO[]
  total: number
}

export interface UpdateConfigStatusReq {
  id: number
  enabled: boolean
}

export interface ListEnabledConfigsReq {
  biz_id: number
}

export interface ListEnabledConfigsResp {
  configs: ConfigVO[]
}

// 升级步骤相关类型
export interface CreateStepReq {
  config_id: number
  level: number
  template_set_id: number
  step_template_id?: number
  delay?: number
  max_retries?: number
  retry_interval?: number
  skip_if_handled?: boolean
  continue_on_fail?: boolean
  condition_expr?: string
  urgency_level?: number
}

export interface CreateStepResp {
  step: StepVO
}

export interface UpdateStepReq {
  id: number
  level: number
  template_set_id: number
  step_template_id?: number
  delay?: number
  max_retries?: number
  retry_interval?: number
  skip_if_handled?: boolean
  continue_on_fail?: boolean
  condition_expr?: string
  urgency_level?: number
}

export interface GetStepResp {
  step: StepVO
}

export interface ListStepsByConfigIDReq {
  config_id: number
}

export interface ListStepsByConfigIDResp {
  steps: StepVO[]
  total: number
}

// 升级步骤模板相关类型
export interface CreateStepTemplateReq {
  name: string
  description?: string
  channels: ChannelType[]
  receivers: ReceiverRef[]
}

export interface CreateStepTemplateResp {
  template: StepTemplateVO
}

export interface UpdateStepTemplateReq {
  id: number
  name: string
  description?: string
  channels: ChannelType[]
  receivers: ReceiverRef[]
}

export interface GetStepTemplateResp {
  template: StepTemplateVO
}

export interface ListStepTemplatesReq {
  offset?: number
  limit?: number
}

export interface ListStepTemplatesResp {
  templates: StepTemplateVO[]
  total: number
}

// 视图对象类型
export interface ConfigVO {
  id: number
  biz_id: number
  key: string
  name: string
  description: string
  enabled: boolean
  timeout: number
  triggers: EscalationTrigger[]
  trigger_logic: EscalationLogic
  steps: StepVO[]
  created_by: string
  ctime: number
  utime: number
}

export interface StepVO {
  id: number
  level: number
  template_set_id: number
  config_id: number
  step_template_id?: number
  delay: number
  max_retries: number
  retry_interval: number
  skip_if_handled: boolean
  continue_on_fail: boolean
  condition_expr: string
  urgency_level: number
  escalation_step_template?: StepTemplateVO
}

export interface StepTemplateVO {
  id: number
  name: string
  description: string
  channels: ChannelType[]
  receivers: ReceiverRef[]
  ctime: number
  utime: number
}

// 领域对象类型
export interface EscalationTrigger {
  type: string
  condition: string
  value: any
}

export interface EscalationLogic {
  operator: string
  conditions: string[]
}

export interface EscalationStep {
  level: number
  template_set_id: number
  step_template_id?: number
  delay?: number
  max_retries?: number
  retry_interval?: number
  skip_if_handled?: boolean
  continue_on_fail?: boolean
  condition_expr?: string
  urgency_level?: number
}

export interface ReceiverRef {
  id: string
  type: string
  display_name: string
  metadata: Record<string, any>
}

// 接收者类型枚举
export enum RECEIVER_TYPES {
  USER = "user",
  TEAM = "team",
  DEPARTMENT = "department",
  ONCALL = "oncall"
}

export type ReceiverType = RECEIVER_TYPES
