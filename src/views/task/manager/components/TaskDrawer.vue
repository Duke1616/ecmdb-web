<template>
  <Drawer
    v-model="visible"
    :title="taskId ? '编辑调度任务' : '创建调度任务'"
    :subtitle="taskId ? '调整当前分布式任务的执行逻辑与资源引用' : '配置基于 gRPC 或 HTTP 协议的自动化调度流程'"
    :header-icon="Calendar"
    size="35%"
    :confirm-loading="saving"
    @confirm="submit"
    @cancel="visible = false"
  >
    <div class="task-form-container">
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-position="top"
        class="task-form"
        :validate-on-rule-change="false"
      >
        <!-- 1. 基础核心配置 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>基础核心配置</span>
            </div>
          </div>

          <el-form-item prop="name" label="任务名称">
            <el-input v-model="form.name" placeholder="请输入任务唯一业务标识" size="large" class="premium-input" />
          </el-form-item>

          <!-- 触发模式: 统一卡片样式 -->
          <div class="mode-selector">
            <div
              v-for="type in [
                { label: '周期间隔', value: TaskType.RECURRING, icon: Timer, desc: '按 Cron 计划持续调度' },
                { label: '单次触发', value: TaskType.ONE_TIME, icon: Pointer, desc: '立即或指定一次执行' }
              ]"
              :key="type.value"
              class="mode-card"
              :class="{ 'is-active': form.type === type.value }"
              @click="form.type = type.value"
            >
              <div class="mode-card__icon">
                <el-icon><component :is="type.icon" /></el-icon>
              </div>
              <div class="mode-card__body">
                <span class="mode-card__title">{{ type.label }}</span>
                <span class="mode-card__desc">{{ type.desc }}</span>
              </div>
              <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
            </div>
          </div>

          <transition name="el-zoom-in-top">
            <el-form-item prop="cron_expr" label="执行计划 (Cron Expression)" class="mt-4">
              <el-input
                v-model="form.cron_expr"
                placeholder="*/5 * * * * *"
                size="large"
                class="code-font premium-input"
              >
                <template #prefix>
                  <el-icon><Calendar /></el-icon>
                </template>
                <template #suffix>
                  <CronHelper :type="form.type" @select="handleCronSelect" />
                </template>
              </el-input>
            </el-form-item>
          </transition>
        </div>

        <!-- 2. 执行引擎选择 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Cpu /></el-icon>
              <span>执行引擎与协议</span>
            </div>
          </div>

          <div class="mode-selector">
            <div
              v-for="item in protocols"
              :key="item.value"
              class="mode-card"
              :class="{ 'is-active': form.protocol === item.value }"
              @click="handleProtocolChange(item.value)"
            >
              <div class="mode-card__icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <div class="mode-card__body">
                <span class="mode-card__title">{{ item.label }}</span>
                <span class="mode-card__desc">{{ item.desc }}</span>
              </div>
              <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
            </div>
          </div>

          <div class="protocol-content-wrapper" v-loading="resourceLoading">
            <transition name="slide-fade" mode="out-in">
              <div :key="form.protocol" class="protocol-pane">
                <!-- gRPC 模式 -->
                <div v-if="form.protocol === TaskProtocol.GRPC" class="grpc-config-pane">
                  <div class="service-selector-row flex-row gap-4">
                    <el-form-item label="执行器服务" prop="grpc_service" class="flex-1">
                      <el-autocomplete
                        v-model="form.grpc_service"
                        :fetch-suggestions="queryServiceSuggestions"
                        placeholder="选择注册节点"
                        size="large"
                        class="premium-input"
                        @select="handleServiceSelect"
                      >
                        <template #prefix>
                          <el-icon><Connection /></el-icon>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                    <el-form-item label="处理方法" prop="grpc_handler" class="flex-1">
                      <el-autocomplete
                        v-model="form.grpc_handler"
                        :fetch-suggestions="queryHandlers"
                        placeholder="绑定接口能力"
                        size="large"
                        class="premium-input"
                        @select="handleHandlerSelect"
                      >
                        <template #prefix>
                          <el-icon><Monitor /></el-icon>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                  </div>

                  <!-- 动态元数据区域 -->
                  <div
                    v-if="currentHandler"
                    class="metadata-container animate-in"
                    :class="{ 'has-metadata': currentHandler?.metadata?.length }"
                  >
                    <div class="metadata-header">
                      <div class="metadata-title">
                        <span class="dot" />
                        <span>调用载荷与参数元数据</span>
                      </div>
                    </div>

                    <div class="parameters-grid-wrapper">
                      <TaskParamsEditor
                        v-if="currentHandler?.metadata?.length"
                        v-model="form.grpc_params"
                        v-model:task-metadata="form.metadata"
                        :metadata="currentHandler.metadata"
                      />
                      <div v-else class="empty-params">
                        <el-empty :image-size="60" description="未识别到元数据，支持自由 Payload 配置" />
                        <div class="manual-map-box">
                          <KVEditor v-model="form.grpc_params" show-secret />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- HTTP 模式 -->
                <div v-else-if="form.protocol === TaskProtocol.HTTP" class="http-config-pane animate-in">
                  <div class="metadata-container has-metadata">
                    <div class="metadata-header">
                      <div class="metadata-title">
                        <span class="dot" />
                        <span>HTTP 回源与报文配置</span>
                      </div>
                    </div>

                    <div class="http-form-content">
                      <el-form-item prop="http_endpoint" required class="mb-6">
                        <el-input
                          v-model="form.http_endpoint"
                          placeholder="请输入全路径地址 (https://...)"
                          size="large"
                          class="code-font premium-input endpoint-input"
                        >
                          <template #prefix>
                            <span class="http-prefix-tag">POST</span>
                          </template>
                        </el-input>
                      </el-form-item>

                      <div class="http-advanced-settings">
                        <div class="settings-nav">
                          <div class="nav-left">
                            <el-icon class="nav-icon"><Operation /></el-icon>
                            <span>协议扩展参数</span>
                          </div>
                          <el-radio-group v-model="httpConfigTab" size="small" class="settings-tabs">
                            <el-radio-button label="headers">请求头部</el-radio-button>
                            <el-radio-button label="params">请求主体</el-radio-button>
                          </el-radio-group>
                        </div>

                        <div class="settings-content">
                          <transition name="fade" mode="out-in">
                            <div :key="httpConfigTab" class="params-editor-box">
                              <KVEditor
                                v-if="httpConfigTab === 'headers'"
                                v-model="form.http_headers"
                                title-key="头部字段"
                                title-value="内容值"
                                add-text="新增请求头..."
                                empty-text="无需配置自定义请求头部"
                              />
                              <KVEditor
                                v-else
                                v-model="form.http_params"
                                title-key="参数名"
                                title-value="参数值"
                                add-text="新增 Body 字段..."
                                empty-text="无需配置请求主体 (Body)"
                              />
                            </div>
                          </transition>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 3. 重试配置 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><RefreshRight /></el-icon>
              <span>重试配置与超时</span>
            </div>
            <div class="title-right">
              <el-switch v-model="form.retry_enabled" inline-prompt active-text="启用" inactive-text="关闭" />
            </div>
          </div>

          <transition name="el-zoom-in-top">
            <RetryConfigEditor
              v-if="form.retry_enabled"
              v-model:maxExecutionSeconds="form.max_execution_seconds"
              v-model:maxRetries="form.max_retries"
              v-model:initialInterval="form.initial_interval"
              v-model:maxInterval="form.max_interval"
            />
          </transition>
        </div>
      </el-form>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue"
import {
  Setting,
  Cpu,
  Connection,
  Link,
  CircleCheckFilled,
  RefreshRight,
  Calendar,
  Monitor,
  Timer,
  Pointer,
  Operation
} from "@element-plus/icons-vue"
import { createTaskApi, updateTaskApi, getTaskDetailApi } from "@/api/etask/manager"
import { TaskType, TaskProtocol, type CreateTaskReq, type TaskItem, type UpdateTaskReq } from "@/api/etask/manager/type"
import type { HandlerDetail } from "@/api/etask/executor/type"
import { useTaskResources } from "../composables/useTaskResources"
import KVEditor from "./KVEditor.vue"
import CronHelper from "./CronHelper.vue"
import TaskParamsEditor from "./TaskParamsEditor.vue"
import RetryConfigEditor from "./RetryConfigEditor.vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { Drawer } from "@@/components/Dialogs"

// NOTE: 该组件为纯业务抽屉控制器，使用 defineModel 进行开放/折叠的 UI 状态双向绑定
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  taskId?: number
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

// --- 外部注册中心资源 ---
const {
  loading: resourceLoading,
  executorList,
  fetchResources,
  queryServiceSuggestions,
  queryHandlerSuggestions
} = useTaskResources()

// --- 扁平化 UI 状态定义 ---
interface TaskFormState {
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

const formRef = ref<FormInstance>()
const saving = ref(false)
const httpConfigTab = ref("headers")

const protocols = [
  { label: "gRPC", value: TaskProtocol.GRPC, icon: Connection, desc: "分布式标准通信协议" },
  { label: "HTTP", value: TaskProtocol.HTTP, icon: Link, desc: "标准 RESTful 后端回调" }
] as const

/** 完美的零脏值默认扁平化状态初始化 */
const createDefaultFormState = (): TaskFormState => ({
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

const form = ref<TaskFormState>(createDefaultFormState())

// --- 计算属性与辅助查询 ---
const currentHandler = computed(() => {
  const serviceName = form.value.grpc_service
  if (!serviceName) return null

  const executor = executorList.value.find((e) => e.name === serviceName)
  if (!executor) return null

  return executor.handlers.find((h) => h.name === form.value.grpc_handler) ?? null
})

// --- 表单联动与 UI 事件处理 ---
const handleServiceSelect = () => {
  form.value.grpc_handler = ""
}

const handleHandlerSelect = (item: Record<string, any>) => {
  const handler = item as HandlerDetail
  const params = form.value.grpc_params

  for (const meta of handler.metadata ?? []) {
    params[meta.key] = params[meta.key] || meta.default || ""
  }
}

const queryHandlers = (qs: string, cb: (res: (HandlerDetail & { value: string })[]) => void) => {
  const serviceName = form.value.grpc_service
  queryHandlerSuggestions(serviceName, qs, cb)
}

const handleCronSelect = (val: string) => {
  form.value.cron_expr = val
  formRef.value?.validateField("cron_expr").catch(() => {})
}

const handleProtocolChange = (protocol: TaskProtocol) => {
  form.value.protocol = protocol
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// --- 类型安全与高度智能的扁平化校验规则 ---
const rules = computed<FormRules<TaskFormState>>(() => {
  const r: FormRules<TaskFormState> = {
    name: [{ required: true, message: "请输入任务标识", trigger: "blur" }]
  }

  if (form.value.type === TaskType.RECURRING) {
    r.cron_expr = [{ required: true, message: "请输入有效的 Cron 表达式", trigger: ["blur", "change"] }]
  }

  if (form.value.protocol === TaskProtocol.GRPC) {
    r.grpc_service = [{ required: true, message: "请选择执行器服务", trigger: "change" }]
    r.grpc_handler = [{ required: true, message: "请选择处理方法", trigger: "change" }]
  } else {
    r.http_endpoint = [{ required: true, message: "请输入接口地址", trigger: "blur" }]
  }

  return r
})

// --- UI 隔离映射层（Mappers） ---

/** 将 API 后端嵌套结构精细化解析并摊平至 UI 状态机，保证模板安全 */
const mapToFormState = (data?: TaskItem): TaskFormState => {
  const state = createDefaultFormState()
  if (!data) return state

  state.name = data.name || ""
  state.type = data.type || TaskType.RECURRING
  state.cron_expr = data.cron_expr || ""

  // 协议推断
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

/** 提交前将扁平 UI 状态进行深度剪裁与类型转换，组装出标准 API 嵌套载荷 */
const mapToApiPayload = (state: TaskFormState): CreateTaskReq => {
  const payload: CreateTaskReq = {
    name: state.name,
    type: state.type,
    cron_expr: state.type === TaskType.RECURRING ? state.cron_expr : "",
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

// --- 生命周期与数据加载 ---
const loadDetail = async () => {
  if (!props.taskId) return

  try {
    const { data } = await getTaskDetailApi(props.taskId)
    form.value = mapToFormState(data)
  } catch (error) {
    console.error("加载任务详情失败:", error)
  }
}

onMounted(async () => {
  await fetchResources()
})

// 当抽屉开启状态变化时，决定是拉取详情还是重置状态
watch(visible, async (val) => {
  if (val) {
    if (props.taskId) {
      await loadDetail()
    } else {
      form.value = createDefaultFormState()
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  }
})

// --- 提交操作 ---
const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  saving.value = true
  try {
    const payload = mapToApiPayload(form.value)

    if (props.taskId) {
      await updateTaskApi({ ...payload, id: props.taskId } as UpdateTaskReq)
      ElMessage.success("更新任务成功")
    } else {
      await createTaskApi(payload)
      ElMessage.success("创建任务成功")
    }

    visible.value = false
    emit("success")
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.task-form-container {
  padding: 12px 16px;
  background: #fdfdfe;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  justify-content: space-between;

  .title-left {
    display: flex;
    align-items: center;
  }

  .section-icon {
    margin-right: 6px;
    font-size: 16px;
    color: #3b82f6;
  }

  span {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
}

.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;

  .mode-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fafafa;
    position: relative;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f0f7ff;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

      .mode-card__icon {
        background: #3b82f6;
        .el-icon {
          color: #fff;
        }
      }

      .mode-card__title {
        color: #1d4ed8;
      }

      .mode-card__check {
        opacity: 1;
        color: #3b82f6;
      }
    }

    &__icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .el-icon {
        font-size: 18px;
        color: #64748b;
      }
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      line-height: 1;
    }

    &__desc {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
    }

    &__check {
      font-size: 18px;
      opacity: 0;
      flex-shrink: 0;
    }
  }
}

.http-advanced-settings {
  background: white;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.03);

  .settings-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;

    .nav-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;

      .nav-icon {
        color: #3b82f6;
        font-size: 14px;
      }
    }
  }

  .settings-content {
    padding: 12px;
    background: white;
  }
}

.http-prefix-tag {
  color: #10b981;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 0 10px;
  border-right: 1.5px solid #e2e8f0;
  height: 20px;
  display: flex;
  align-items: center;
  margin-right: 6px;
}

.settings-tabs :deep(.el-radio-button__inner) {
  border: none !important;
  background: transparent !important;
  color: #94a3b8 !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 1px;
  padding: 6px 12px !important;
  box-shadow: none !important;
  transition: all 0.2s;
}

.settings-tabs :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #3b82f6 !important;
  background: #eff6ff !important;
  border-radius: 6px !important;
}

.endpoint-input :deep(.el-input__inner) {
  padding-left: 4px !important;
}

.metadata-container {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  position: relative;

  &.has-metadata::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }

  .metadata-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .metadata-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
      }
    }
  }
}

.premium-input :deep(.el-input__wrapper),
.premium-input :deep(.el-select__wrapper) {
  border-radius: 8px !important;
  border: 1px solid #d1d5db !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  padding: 0 16px;

  &:hover {
    border-color: #9ca3af !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
  }
  &.is-focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
  }
}

.service-selector-row {
  margin-bottom: 28px;
  :deep(.el-form-item) {
    margin-bottom: 0 !important;
  }
}

.manual-map-box {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #edf2f7;
  padding: 12px;
  &.standalone {
    background: #f8fafc;
  }
}

.flex-row {
  display: flex;
  align-items: flex-start;
}
.flex-1 {
  flex: 1;
}
.gap-4 {
  gap: 24px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.code-font :deep(input) {
  font-family: "Fira Code", "Cascadia Code", monospace;
  font-size: 13px;
}
</style>
