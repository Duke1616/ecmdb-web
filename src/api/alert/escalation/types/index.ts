/**
 * 升级配置相关类型定义
 */

// 触发条件类型枚举
export enum ESCALATION_TRIGGER_TYPES {
  TIME = "time", // 时间触发
  LEVEL = "level", // 级别触发
  NO_RESPONSE = "no_response", // 无响应触发
  MANUAL = "manual", // 手动触发
  CUSTOM = "custom" // 自定义触发
}

export type EscalationTriggerType = ESCALATION_TRIGGER_TYPES | ""

// 默认触发条件类型
export const DEFAULT_TRIGGER_TYPE = "" as const

// 升级逻辑类型枚举
export enum ESCALATION_LOGIC_TYPES {
  ANY = "any", // 任意条件满足即触发
  ALL = "all", // 所有条件都满足才触发
  FIRST = "first", // 第一个满足的条件触发
  CUSTOM = "custom" // 自定义逻辑
}

export type EscalationLogicType = ESCALATION_LOGIC_TYPES | ""

// 默认升级逻辑类型
export const DEFAULT_LOGIC_TYPE = "" as const

// 接收者类型枚举
export enum RECEIVER_TYPES {
  USER = "user",
  TEAM = "team",
  DEPARTMENT = "department",
  ONCALL = "oncall"
}

export type ReceiverType = RECEIVER_TYPES

// 时间单位枚举
export enum TimeUnit {
  MINUTES = "minutes", // 分钟
  HOURS = "hours" // 小时
}

// 时间触发配置
export interface TimeTriggerConfig {
  delay: number // 延迟数值（如 5）
  unit: TimeUnit // 时间单位（minutes, hours）
}

// 级别触发配置
export interface LevelTriggerConfig {
  target_alert_levels: string[] // 目标告警等级（触发升级的告警等级）
  min_alert_level: string // 最低告警等级
}

// 无响应触发配置
export interface NoResponseTriggerConfig {
  check_interval: number // 检查间隔（毫秒）
  max_attempts: number // 最大尝试次数
  required_acks: number // 需要的确认数
}

// 手动触发配置
export interface ManualTriggerConfig {
  allowed_users: string[] // 允许触发的用户
  require_auth: boolean // 是否需要认证
}

// 自定义触发配置
export interface CustomTriggerConfig {
  expression: string // 自定义表达式
  variables: Record<string, string> // 变量定义
}

// 升级触发配置 - 使用泛型接口
export interface EscalationTriggerConfig<T extends EscalationTriggerType = EscalationTriggerType> {
  time_config?: T extends "time" ? TimeTriggerConfig : never
  level_config?: T extends "level" ? LevelTriggerConfig : never
  no_response_config?: T extends "no_response" ? NoResponseTriggerConfig : never
  manual_config?: T extends "manual" ? ManualTriggerConfig : never
  custom_config?: T extends "custom" ? CustomTriggerConfig : never
}

// 为了向后兼容，提供一个默认的联合类型
export type AnyEscalationTriggerConfig =
  | { time_config: TimeTriggerConfig }
  | { level_config: LevelTriggerConfig }
  | { no_response_config: NoResponseTriggerConfig }
  | { manual_config: ManualTriggerConfig }
  | { custom_config: CustomTriggerConfig }

// 升级触发条件
export interface EscalationTrigger {
  type: EscalationTriggerType // 触发类型
  config: EscalationTriggerConfig // 触发配置
  description: string // 描述
}

// 升级触发条件计算逻辑
export interface EscalationLogic {
  type: EscalationLogicType // 逻辑类型
  expression: string // 表达式
  description: string // 描述
}

// 升级步骤
export interface EscalationStep {
  level: number // 升级级别（1-N，表示第几次升级）
  template_set_id: number // 模板集ID
  step_template_id: number // 步骤模板ID
  delay: number // 延迟时间（毫秒）
  max_retries: number // 重试次数
  retry_interval: number // 重试间隔（毫秒）
  skip_if_handled: boolean // 如果对象已被处理则跳过
  continue_on_fail: boolean // 前一步失败是否继续
  condition_expr: string // 条件表达式（如 "alert.severity >= 3"）
  urgency_level: number // 紧急程度（1-5，数字越大越紧急）
}

// 接收者引用
export interface ReceiverRef {
  id: string // 统一ID（userID, groupID等）
  type: ReceiverType // 类型
  display_name: string // 名称展示
  metadata: Record<string, any> // 附加信息（如电话、邮箱等）
}

// 升级步骤模版视图对象
export interface StepTemplateVO {
  id: number // 步骤模版 ID
  name: string // 步骤模版 名称
  description: string // 步骤模版描述
  channels: string[] // 通知渠道
  receivers: ReceiverRef[] // 通知人
  ctime: number // 创建时间
  utime: number // 更新时间
}

// 升级步骤视图对象
export interface StepVO {
  id: number // 步骤ID
  level: number // 升级级别（1-N，表示第几次升级）
  template_set_id: number // 模板集ID
  config_id?: number // 业务配置
  step_template_id: number // 模板 Step ID
  delay: number // 延迟时间（毫秒）
  max_retries: number // 重试次数
  retry_interval: number // 重试间隔（毫秒）
  skip_if_handled: boolean // 如果对象已被处理则跳过
  continue_on_fail: boolean // 前一步失败是否继续
  condition_expr: string // 条件表达式（如 "alert.severity >= 3"）
  urgency_level: number // 紧急程度（1-5，数字越大越紧急）
  escalation_step_template: StepTemplateVO // 使用模版信息
}

// 升级配置视图对象
export interface ConfigVO {
  id: number // 升级配置ID
  biz_id: number // 业务类型ID（1=告警，2=工单）
  key: string // 业务ID（告警规则ID或工单模板ID，字符串格式）
  name: string // 配置名称
  description: string // 配置描述
  enabled: boolean // 是否启用升级
  timeout: number // 超时时间（毫秒）
  triggers: EscalationTrigger[] // 升级触发条件
  trigger_logic: EscalationLogic // 触发条件计算逻辑
  steps: StepVO[] // 步骤处理
  created_by: string // 创建人
  ctime: number // 创建时间
  utime: number // 更新时间
}

// 创建升级配置请求
export interface CreateConfigReq {
  biz_id: number // 业务类型ID（1=告警，2=工单）
  key: string // 业务唯一值（告警规则ID或工单模板ID，字符串格式）
  name: string // 配置名称
  description: string // 配置描述
  enabled: boolean // 是否启用
  timeout: number // 超时时间（毫秒）
  triggers: EscalationTrigger[] // 触发条件
  trigger_logic: EscalationLogic // 触发逻辑
  steps: EscalationStep[] // 升级步骤
  created_by: string // 创建人
}

// 创建升级配置响应
export interface CreateConfigResp {
  config: ConfigVO
}

// 更新升级配置请求
export interface UpdateConfigReq {
  id: number // 配置ID
  name: string // 配置名称
  description: string // 配置描述
  enabled: boolean // 是否启用
  timeout: number // 超时时间（毫秒）
  triggers: EscalationTrigger[] // 触发条件
  trigger_logic: EscalationLogic // 触发逻辑
}

// 获取升级配置响应
export interface GetConfigResp {
  config: ConfigVO
}

// 获取升级配置列表请求
export interface ListConfigsReq {
  offset?: number // 偏移量
  limit?: number // 限制数量
}

// 获取升级配置列表响应
export interface ListConfigsResp {
  configs: ConfigVO[]
  total: number
}

// 获取启用的升级配置请求
export interface ListEnabledConfigsReq {
  biz_id: number // 业务ID
}

// 获取启用的升级配置响应
export interface ListEnabledConfigsResp {
  configs: ConfigVO[]
}

// 创建升级步骤请求
export interface CreateStepReq {
  config_id?: number // 配置ID
  level: number // 升级级别
  template_set_id: number // 模板集ID
  step_template_id?: number // 步骤模板ID
  delay: number // 延迟时间（毫秒）
  max_retries: number // 最大重试次数
  retry_interval: number // 重试间隔（毫秒）
  skip_if_handled: boolean // 如果已处理则跳过
  continue_on_fail: boolean // 前一步失败是否继续
  condition_expr: string // 条件表达式
  urgency_level: number // 紧急程度
}

// 创建升级步骤响应
export interface CreateStepResp {
  step: StepVO
}

// 更新升级步骤请求
export interface UpdateStepReq {
  id: number // 步骤ID
  config_id?: number // 配置ID
  level: number // 升级级别
  template_set_id: number // 模板集ID
  step_template_id?: number // 步骤模板ID
  delay: number // 延迟时间（毫秒）
  max_retries: number // 最大重试次数
  retry_interval: number // 重试间隔（毫秒）
  skip_if_handled: boolean // 如果已处理则跳过
  continue_on_fail: boolean // 前一步失败是否继续
  condition_expr: string // 条件表达式
  urgency_level: number // 紧急程度
}

// 获取升级步骤响应
export interface GetStepResp {
  step: StepVO
}

// 根据配置ID获取升级步骤列表请求
export interface ListStepsByConfigIDReq {
  config_id: number // 配置ID
}

export interface ListConfigsByBizIDAndKeyReq {
  biz_id: number // 业务类型ID（1=告警，2=工单）
  key: string // 业务唯一值（告警规则ID或工单模板ID，字符串格式）
}

// 根据配置ID获取升级步骤列表响应
export interface ListStepsByConfigIDResp {
  steps: StepVO[]
  total: number
}

// 创建升级步骤模板请求
export interface CreateStepTemplateReq {
  name: string // 模板名称
  description: string // 模板描述
  channels: string[] // 通知渠道
  receivers: ReceiverRef[] // 接收者
}

// 创建升级步骤模板响应
export interface CreateStepTemplateResp {
  template: StepTemplateVO
}

// 更新升级步骤模板请求
export interface UpdateStepTemplateReq {
  id: number // 模板ID
  name: string // 模板名称
  description: string // 模板描述
  channels: string[] // 通知渠道
  receivers: ReceiverRef[] // 接收者
}

// 获取升级步骤模板响应
export interface GetStepTemplateResp {
  template: StepTemplateVO
}

// 获取升级步骤模板列表请求
export interface ListStepTemplatesReq {
  offset?: number // 偏移量
  limit?: number // 限制数量
}

// 根据ID列表获取升级步骤模板请求
export interface ListStepTemplatesByIDsReq {
  ids: number[] // 模板ID列表
}

// 获取升级步骤模板列表响应
export interface ListStepTemplatesResp {
  templates: StepTemplateVO[]
  total: number
}

// 交换步骤等级请求
export interface SwapStepLevelsReq {
  src_id: number // 源步骤ID
  dst_id: number // 目标步骤ID
}

// 交换配置优先级请求
export interface SwapConfigPrioritiesReq {
  src_id: number // 源配置ID
  dst_id: number // 目标配置ID
}
