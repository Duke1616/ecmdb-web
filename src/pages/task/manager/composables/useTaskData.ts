import { cloneDeep } from "lodash-es"
import {
  TaskType,
  TaskProtocol,
  NotificationChannel,
  NotificationTriggerStatus,
  type CreateTaskReq,
  type ExecutionNotificationRule,
  type TaskItem,
  type TaskParamOverrideRule
} from "@/api/task/manager/type"
import type { HandlerDetail } from "@/api/task/resource/type"
import type { ProgramSpec } from "@/api/task/program"
import { Connection, Cpu, Link } from "@element-plus/icons-vue"

// ---------------------------------------------------------
// 前端数据模型（UI 层独立定义，与后端嵌套结构解耦，保证字段平坦化）
// ---------------------------------------------------------

/**
 * 扁平化的任务表单 UI 状态接口
 */
export interface TaskFormState {
  name: string
  type: TaskType
  cron_expr: string
  protocol: TaskProtocol

  // gRPC 关联配置
  grpc_service: string
  grpc_handler: string
  grpc_params: Record<string, string>
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
}

/** 前端通知配置组；一套通知配置可以同时关联多个执行终态。 */
export interface ExecutionNotificationGroup {
  /** 使用该模板、渠道和接收者配置的执行终态。 */
  trigger_statuses: NotificationTriggerStatus[]
  recipients: ExecutionNotificationRule["recipients"]
  channels: ExecutionNotificationRule["channels"]
  /** 模板集 ID；0 表示使用 ETask 内置默认模板集。 */
  template_set_id: number
  enabled: boolean
}

// ---------------------------------------------------------
// 静态选项配置与初值工厂
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
  protocol: TaskProtocol.GRPC,
  grpc_service: "",
  grpc_handler: "",
  grpc_params: {},
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
  notification_groups: []
})

/** ETask 内置任务执行通知模板集的保留 ID，0 表示使用默认模板。 */
export const ETASK_DEFAULT_TEMPLATE_SET_ID = 0

// ---------------------------------------------------------
// 数据转换层（Mappers）
// ---------------------------------------------------------

/**
 * 将 API 后端嵌套结构精细化解析并摊平至 UI 状态机，保证模板安全
 * @param data 后端返回的原始任务详情数据
 * @returns 摊平后的表单状态数据
 */
export const mapToFormState = (data?: TaskItem): TaskFormState => {
  const state = createDefaultFormState()
  if (!data) return state

  state.name = data.name || ""
  state.type = data.type || TaskType.RECURRING
  state.cron_expr = data.cron_expr || ""

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

  return state
}

/**
 * 提交前将扁平 UI 状态进行深度剪裁与类型转换，组装出标准 API 嵌套载荷
 * @param state 摊平后的表单状态数据
 * @returns 组装后的创建/更新请求载荷
 */
export const mapToApiPayload = (state: TaskFormState): CreateTaskReq => {
  // NOTE: 后端为强类型嵌套结构，此处负责提取扁平表单中的多套协议配置并精准还原嵌套结构
  const payload: CreateTaskReq = {
    name: state.name,
    type: state.type,
    cron_expr: state.cron_expr,
    schedule_params: cloneDeep(state.schedule_params),
    param_override_rules: cloneDeep(state.param_override_rules),
    execution_notifications: state.notification_enabled
      ? expandExecutionNotificationGroups(state.notification_groups)
      : [],
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
    payload.grpc_config = {
      service_name: state.grpc_service,
      handler_name: state.grpc_handler,
      params: cloneDeep(state.grpc_params)
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

/**
 * 校验任务执行通知配置组是否具备终态、模板、渠道和接收对象。
 * @param groups 待提交的执行通知配置组
 * @returns 首个校验错误；全部有效时返回 undefined
 */
export const validateExecutionNotificationGroups = (groups: ExecutionNotificationGroup[]): string | undefined => {
  const statuses = new Set<string>()

  for (const [index, group] of groups.entries()) {
    const prefix = `第 ${index + 1} 条执行通知`
    if (group.trigger_statuses.length === 0) return `${prefix}请至少选择一个触发状态`
    for (const status of group.trigger_statuses) {
      if (statuses.has(status)) return `${prefix}与其他规则的触发状态重复`
      statuses.add(status)
    }

    const templateSetID = Number(group.template_set_id)
    if (!Number.isSafeInteger(templateSetID) || templateSetID < 0) return `${prefix}请选择有效的模板集`
    if (
      templateSetID === ETASK_DEFAULT_TEMPLATE_SET_ID &&
      group.channels.some((channel) => channel !== NotificationChannel.LARK_CARD)
    ) {
      return `${prefix}系统默认模板目前仅支持飞书卡片，请选择自定义模板集`
    }
    if (group.channels.length === 0) return `${prefix}请至少选择一个通知渠道`
    if (group.recipients.length === 0) return `${prefix}请配置接收者`

    const hasInvalidTarget = group.recipients.some(
      (recipient) =>
        recipient.target_ids.length === 0 || recipient.target_ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    )
    if (hasInvalidTarget) return `${prefix}包含无效的接收者 ID，请重新配置接收者`
  }

  return undefined
}

/** 创建一组尚待补充模板、渠道和接收者的默认通知配置。 */
export const createDefaultExecutionNotificationGroup = (
  status: NotificationTriggerStatus = NotificationTriggerStatus.FAILED
): ExecutionNotificationGroup => ({
  trigger_statuses: [status],
  recipients: [],
  channels: [NotificationChannel.LARK_CARD],
  template_set_id: ETASK_DEFAULT_TEMPLATE_SET_ID,
  enabled: true
})

const notificationStatusOrder: NotificationTriggerStatus[] = [
  NotificationTriggerStatus.FAILED,
  NotificationTriggerStatus.SUCCESS,
  NotificationTriggerStatus.CANCELLED
]

const notificationConfigKey = (rule: ExecutionNotificationRule) =>
  JSON.stringify({
    enabled: rule.enabled,
    template_set_id: rule.template_set_id ?? ETASK_DEFAULT_TEMPLATE_SET_ID,
    channels: [...rule.channels].sort(),
    recipients: rule.recipients
      .map((recipient) => ({ type: recipient.type, target_ids: [...recipient.target_ids].sort((a, b) => a - b) }))
      .sort((a, b) => a.type.localeCompare(b.type))
  })

/** 将后端单终态规则合并为前端多终态配置组。 */
export const groupExecutionNotifications = (rules: ExecutionNotificationRule[]): ExecutionNotificationGroup[] => {
  const groups = new Map<string, ExecutionNotificationGroup>()

  for (const rule of rules) {
    const key = notificationConfigKey(rule)
    const existing = groups.get(key)
    if (existing) {
      if (!existing.trigger_statuses.includes(rule.trigger_status)) existing.trigger_statuses.push(rule.trigger_status)
      continue
    }
    groups.set(key, {
      trigger_statuses: [rule.trigger_status],
      recipients: cloneDeep(rule.recipients),
      channels: cloneDeep(rule.channels),
      template_set_id: rule.template_set_id ?? ETASK_DEFAULT_TEMPLATE_SET_ID,
      enabled: rule.enabled
    })
  }

  return [...groups.values()].map((group) => ({
    ...group,
    trigger_statuses: notificationStatusOrder.filter((status) => group.trigger_statuses.includes(status))
  }))
}

/** 将前端多终态配置组展开为后端要求的一终态一规则结构。 */
export const expandExecutionNotificationGroups = (groups: ExecutionNotificationGroup[]): ExecutionNotificationRule[] =>
  groups.flatMap((group) =>
    group.trigger_statuses.map((status) => ({
      trigger_status: status,
      recipients: cloneDeep(group.recipients),
      channels: cloneDeep(group.channels),
      template_set_id: group.template_set_id,
      enabled: group.enabled
    }))
  )
