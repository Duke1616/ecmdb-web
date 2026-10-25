import { cloneDeep } from "lodash-es"
import {
  TaskType,
  TaskProtocol,
  NotificationChannel,
  RecipientIdentifierType,
  BusinessRecipientMode,
  type NotificationRecipient,
  type CreateTaskReq,
  type TaskItem,
  type TaskParamOverrideRule,
  type VariableItem
} from "@/api/task/manager/type"
import type { HandlerDetail } from "@/api/task/resource/type"
import type { ProgramSpec } from "@/api/task/program"
import { Connection, Cpu, Link } from "@element-plus/icons-vue"
import {
  type ExecutionNotificationGroup,
  groupExecutionNotifications,
  expandExecutionNotificationGroups
} from "./taskNotifications"

// ---------------------------------------------------------
// 表单模型：保持界面状态扁平，避免模板直接依赖后端嵌套结构。
// ---------------------------------------------------------

/**
 * 扁平化的任务表单 UI 状态接口
 */

/** 业务通知表单聚合状态 */
export interface BusinessNotificationFormState {
  enabled: boolean
  mode: BusinessRecipientMode
  channels: NotificationChannel[]
  template_set_id: number
  identifier_type: RecipientIdentifierType
  recipients: NotificationRecipient[]
}

/** 业务通知默认初始状态 */
export const createDefaultBusinessNotificationState = (): BusinessNotificationFormState => ({
  enabled: false,
  mode: BusinessRecipientMode.DYNAMIC,
  channels: [NotificationChannel.LARK_CARD],
  template_set_id: 0,
  identifier_type: RecipientIdentifierType.USERNAME,
  recipients: []
})

/**
 * 校验业务通知表单有效性
 * @param state 业务通知配置
 * @returns 错误信息，若合法则返回 undefined
 */
export const validateBusinessNotification = (state: BusinessNotificationFormState): string | undefined => {
  if (!state.enabled) return undefined
  if (!state.channels.length) return "业务消息通知请至少选择一个通知渠道"
  if (!state.template_set_id || state.template_set_id <= 0) return "业务消息通知请选择有效的消息模板集"
  if (state.mode === BusinessRecipientMode.STATIC && !state.recipients.length) {
    return "业务消息通知固定指定模式下请配置接收者"
  }
  return undefined
}

export interface TaskFormState {
  name: string
  type: TaskType
  cron_expr: string
  skip_holiday: boolean
  protocol: TaskProtocol

  // gRPC 关联配置
  grpc_service: string
  grpc_handler: string
  grpc_params: Record<string, string>
  grpc_variables: VariableItem[]
  runner_id?: number
  runner_params: Record<string, string>
  program?: ProgramSpec

  // HTTP 关联配置
  http_endpoint: string
  http_headers: Record<string, string>
  http_params: Record<string, string>

  // 超时与退避重试
  retry_enabled: boolean
  max_retries: number
  initial_interval: number
  max_interval: number
  max_execution_seconds: number

  // 分布式调度系统内置扩展属性
  schedule_params: Record<string, string>
  metadata: Record<string, string>
  param_override_rules: TaskParamOverrideRule[]
  notification_enabled: boolean
  notification_groups: ExecutionNotificationGroup[]
  business_notification: BusinessNotificationFormState
}

// ---------------------------------------------------------
// 静态选项与初始状态工厂。
// ---------------------------------------------------------

/**
 * 支持的执行引擎与协议卡片配置
 */
export const protocols = [
  {
    label: "执行单元",
    value: TaskProtocol.RUNNER,
    icon: Cpu,
    desc: "复用 Runner 配置"
  },
  {
    label: "gRPC",
    value: TaskProtocol.GRPC,
    icon: Connection,
    desc: "直接调用节点"
  },
  {
    label: "HTTP",
    value: TaskProtocol.HTTP,
    icon: Link,
    desc: "标准回调接口"
  }
] as const

/**
 * 完美的零脏值默认扁平化状态初始化工厂
 * @returns 默认的空任务表单状态
 */
export const createDefaultFormState = (): TaskFormState => ({
  name: "",
  type: TaskType.RECURRING,
  cron_expr: "",
  skip_holiday: false,
  protocol: TaskProtocol.GRPC,
  grpc_service: "",
  grpc_handler: "",
  grpc_params: {},
  grpc_variables: [],
  runner_id: undefined,
  runner_params: {},
  program: undefined,
  http_endpoint: "",
  http_headers: {},
  http_params: {},
  retry_enabled: false,
  max_retries: 3,
  initial_interval: 1000,
  max_interval: 5000,
  max_execution_seconds: 360,
  schedule_params: {},
  metadata: {},
  param_override_rules: [],
  notification_enabled: false,
  notification_groups: [],
  business_notification: createDefaultBusinessNotificationState()
})

// ---------------------------------------------------------
// 数据转换：后端结构与表单状态互相转换。
// ---------------------------------------------------------

/**
 * 将 API 后端嵌套结构转换为表单使用的扁平状态。
 * @param data 后端返回的原始任务详情数据
 * @returns 摊平后的表单状态数据
 */
export const mapToFormState = (data?: TaskItem): TaskFormState => {
  const state = createDefaultFormState()
  if (!data) return state

  state.name = data.name || ""
  state.type = data.type || TaskType.RECURRING
  state.cron_expr = data.cron_expr || ""
  state.skip_holiday = data.skip_holiday ?? false

  // Runner 引用优先；没有 Runner 时再根据具体协议配置恢复表单模式。
  if (data.runner_id && data.runner_id > 0) {
    state.protocol = TaskProtocol.RUNNER
  } else if (data.http_config && !data.grpc_config) {
    state.protocol = TaskProtocol.HTTP
  } else {
    state.protocol = TaskProtocol.GRPC
  }

  if (data.grpc_config) {
    state.grpc_service = data.grpc_config.service_name || ""
    state.grpc_handler = data.grpc_config.handler_name || ""
    if (state.protocol === TaskProtocol.RUNNER) {
      state.runner_params = cloneDeep(data.grpc_config.params) ?? {}
    } else {
      state.grpc_params = cloneDeep(data.grpc_config.params) ?? {}
      if (data.grpc_config.variables?.length) {
        state.grpc_variables = cloneDeep(data.grpc_config.variables)
      }
    }
  }
  state.runner_id = data.runner_id && data.runner_id > 0 ? data.runner_id : undefined

  state.program = cloneDeep(data.program)

  if (data.http_config) {
    state.http_endpoint = data.http_config.endpoint || ""
    state.http_headers = cloneDeep(data.http_config.headers) ?? {}
    state.http_params = cloneDeep(data.http_config.params) ?? {}
  }

  if (data.retry_config) {
    state.retry_enabled = true
    state.max_retries = data.retry_config.max_retries ?? 3
    state.initial_interval = data.retry_config.initial_interval ?? 1000
    state.max_interval = data.retry_config.max_interval ?? 5000
  }

  if (data.max_execution_seconds) {
    state.retry_enabled = true
    state.max_execution_seconds = data.max_execution_seconds
  }

  state.schedule_params = cloneDeep(data.schedule_params) ?? {}
  state.metadata = cloneDeep(data.metadata) ?? {}
  state.param_override_rules = cloneDeep(data.param_override_rules) ?? []
  state.notification_groups = groupExecutionNotifications(data.execution_notifications ?? [])
  state.notification_enabled = state.notification_groups.some((group) => group.enabled)

  if (data.business_notification) {
    state.business_notification = {
      enabled: data.business_notification.enabled ?? false,
      mode: data.business_notification.mode ?? BusinessRecipientMode.DYNAMIC,
      channels: cloneDeep(data.business_notification.channels) ?? [NotificationChannel.LARK_CARD],
      template_set_id: data.business_notification.template_set_id ?? 0,
      identifier_type: data.business_notification.identifier_type ?? RecipientIdentifierType.USERNAME,
      recipients: cloneDeep(data.business_notification.recipients) ?? []
    }
  }

  return state
}

/**
 * 提交前将扁平表单状态组装为 API 要求的嵌套载荷。
 * @param state 摊平后的表单状态数据
 * @returns 组装后的创建/更新请求载荷
 */
export const mapToApiPayload = (state: TaskFormState, handler?: HandlerDetail | null): CreateTaskReq => {
  // 后端使用嵌套结构；这里集中还原各协议配置，避免提交逻辑散落在组件中。
  const payload: CreateTaskReq = {
    name: state.name,
    type: state.type,
    cron_expr: state.cron_expr,
    skip_holiday: state.skip_holiday,
    schedule_params: cloneDeep(state.schedule_params),
    param_override_rules: cloneDeep(state.param_override_rules),
    execution_notifications: state.notification_enabled
      ? expandExecutionNotificationGroups(state.notification_groups)
      : [],
    business_notification: state.business_notification.enabled
      ? {
          enabled: true,
          mode: state.business_notification.mode,
          channels: cloneDeep(state.business_notification.channels),
          template_set_id: state.business_notification.template_set_id,
          identifier_type: state.business_notification.identifier_type,
          recipients:
            state.business_notification.mode === BusinessRecipientMode.STATIC
              ? cloneDeep(state.business_notification.recipients)
              : []
        }
      : undefined,
    // 参数绑定只属于普通 gRPC 模式，避免切换到 Runner 后继续提交旧绑定。
    metadata: state.protocol === TaskProtocol.GRPC ? cloneDeep(state.metadata) : {}
  }

  if (state.protocol === TaskProtocol.RUNNER) {
    payload.runner_id = state.runner_id
    payload.grpc_config = {
      service_name: "",
      handler_name: "",
      params: cloneDeep(state.runner_params)
    }
  } else if (state.protocol === TaskProtocol.GRPC) {
    const params = cloneDeep(state.grpc_params) ?? {}
    const variables = cloneDeep(state.grpc_variables)
    const variableParameter = handler?.metadata?.find((item) => item.role === "variables")
    const variableKey = variableParameter?.key
    const variableMode = variableKey ? state.metadata[variableKey] : undefined
    const variableBinding = variableMode ? variableParameter?.bindings?.[variableMode] : undefined
    // 只有手动输入绑定使用结构化 variables；执行单元引用必须保留 Runner ID 参数。
    const usesRunnerReference = variableBinding?.component === "runner-picker" || variableMode === "runner"
    if (variableKey && !usesRunnerReference) delete params[variableKey]
    payload.grpc_config = {
      service_name: state.grpc_service,
      handler_name: state.grpc_handler,
      params,
      variables
    }
  } else {
    payload.http_config = {
      endpoint: state.http_endpoint,
      headers: cloneDeep(state.http_headers),
      params: cloneDeep(state.http_params)
    }
  }

  if (state.protocol === TaskProtocol.GRPC && state.program) {
    payload.program = cloneDeep(state.program)
  }

  if (state.retry_enabled) {
    payload.max_execution_seconds = state.max_execution_seconds
    payload.retry_config = {
      max_retries: state.max_retries,
      initial_interval: state.initial_interval,
      max_interval: state.max_interval
    }
  }

  return payload
}

/**
 * 校验动态参数当前选择的绑定和值是否匹配。
 * runner-picker 的值会被后端解析为 Runner ID，因此切换到该绑定后必须选择有效执行单元。
 */
export const validateBoundParameters = (state: TaskFormState, handler?: HandlerDetail | null): string | undefined => {
  if (state.protocol !== TaskProtocol.GRPC || !handler?.metadata?.length) return undefined

  for (const parameter of handler.metadata) {
    const value = state.grpc_params[parameter.key]?.trim() ?? ""
    const mode = state.metadata[parameter.key]
    const binding = mode ? parameter.bindings?.[mode] : undefined

    if (binding?.component === "runner-picker") {
      const runnerID = Number(value)
      if (!value || !Number.isSafeInteger(runnerID) || runnerID <= 0) {
        return `请选择${parameter.desc || parameter.key}对应的执行单元`
      }
    }

    if (parameter.required && !value) {
      return `请填写${parameter.desc || parameter.key}`
    }
  }

  return undefined
}
