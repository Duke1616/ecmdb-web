import { cloneDeep } from "lodash-es"
import { TaskType, TaskProtocol, type CreateTaskReq, type TaskItem } from "@/api/task/manager/type"
import { Connection, Link } from "@element-plus/icons-vue"

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
  grpc_params: Record<string, any>

  // HTTP 关联配置
  http_endpoint: string
  http_headers: Record<string, string>
  http_params: Record<string, any>

  // 超时与退避重试
  retry_enabled: boolean
  max_retries: number
  initial_interval: number
  max_interval: number
  max_execution_seconds: number

  // 分布式调度系统内置扩展属性
  schedule_params: Record<string, any>
  metadata: Record<string, any>
}

// ---------------------------------------------------------
// 静态选项配置与初值工厂
// ---------------------------------------------------------

/**
 * 支持的执行引擎与协议卡片配置
 */
export const protocols = [
  { label: "gRPC", value: TaskProtocol.GRPC, icon: Connection, desc: "分布式标准通信协议" },
  { label: "HTTP", value: TaskProtocol.HTTP, icon: Link, desc: "标准 RESTful 后端回调" }
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
  http_endpoint: "",
  http_headers: {},
  http_params: {},
  retry_enabled: false,
  max_retries: 3,
  initial_interval: 1000,
  max_interval: 5000,
  max_execution_seconds: 360,
  schedule_params: {},
  metadata: {}
})

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

  // 协议推断：若有 HTTP 配置且无 gRPC 配置，视为 HTTP 回源协议
  if (data.http_config && !data.grpc_config) {
    state.protocol = TaskProtocol.HTTP
  } else {
    state.protocol = TaskProtocol.GRPC
  }

  if (data.grpc_config) {
    state.grpc_service = data.grpc_config.service_name || ""
    state.grpc_handler = data.grpc_config.handler_name || ""
    state.grpc_params = cloneDeep(data.grpc_config.params) ?? {}
  }

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
    metadata: cloneDeep(state.metadata)
  }

  if (state.protocol === TaskProtocol.GRPC) {
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
