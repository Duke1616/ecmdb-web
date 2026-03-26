<template>
  <Drawer
    v-model="visible"
    :title="isEdit ? '编辑调度任务' : '创建调度任务'"
    :subtitle="isEdit ? '调整当前分布式任务的执行逻辑与资源引用' : '配置基于 gRPC 或 HTTP 协议的自动化调度流程'"
    :header-icon="Calendar"
    size="640px"
    :confirm-loading="loading"
    @confirm="handleSave"
    @cancel="visible = false"
  >
    <div class="task-form-container">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="task-form">
        <!-- 1. 基础核心配置 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>基础核心配置</span>
            </div>
          </div>

          <el-form-item prop="name" label="任务名称">
            <el-input v-model="form.name" placeholder="请输入任务唯一业务标识" class="premium-input" />
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
              <el-input v-model="form.cron_expr" placeholder="*/5 * * * * *" class="code-font premium-input">
                <template #prefix
                  ><el-icon><Calendar /></el-icon
                ></template>
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
              :class="{ 'is-active': activeProtocol === item.value }"
              @click="activeProtocol = item.value"
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

          <div class="protocol-content-wrapper" v-loading="loading">
            <transition name="slide-fade" mode="out-in">
              <div :key="activeProtocol" class="protocol-pane">
                <!-- gRPC 模式 -->
                <div v-if="activeProtocol === 'grpc'" class="grpc-config-pane">
                  <div class="service-selector-row flex-row gap-4">
                    <el-form-item label="执行器服务" prop="grpc_config.service_name" class="flex-1">
                      <el-autocomplete
                        v-model="form.grpc_config!.service_name"
                        :fetch-suggestions="queryServiceSuggestions"
                        placeholder="选择注册节点"
                        class="premium-input"
                        @select="handleServiceSelect"
                      >
                        <template #prefix>
                          <el-icon><Connection /></el-icon>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                    <el-form-item label="处理方法" prop="grpc_config.handler_name" class="flex-1">
                      <el-autocomplete
                        v-model="form.grpc_config!.handler_name"
                        :fetch-suggestions="queryHandlers"
                        placeholder="绑定接口能力"
                        class="premium-input"
                        @select="handleHandlerSelect"
                      >
                        <template #prefix>
                          <el-icon><Monitor /></el-icon>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                  </div>

                  <!-- 动态元数据区域: 仅在选择 Handler 后且匹配到实体时显示 -->
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
                        v-model="form.grpc_config!.params!"
                        v-model:task-metadata="form.metadata!"
                        :metadata="currentHandler.metadata"
                      />
                      <div v-else class="empty-params">
                        <el-empty :image-size="60" description="未识别到元数据，支持自由 Payload 配置" />
                        <div class="manual-map-box">
                          <MapEditor v-model="form.grpc_config!.params" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- HTTP 模式 -->
                <div v-else-if="activeProtocol === 'http'" class="http-config-pane">
                  <el-form-item label="接口回源 Endpoint" prop="http_config.endpoint">
                    <el-input
                      v-model="form.http_config!.endpoint"
                      placeholder="https://..."
                      class="code-font premium-input"
                    />
                  </el-form-item>
                  <el-form-item label="HTTP 请求头 / 参数字典 (Headers & Params)">
                    <div class="manual-map-box standalone">
                      <KVEditor
                        v-model="form.http_config!.params"
                        title-key="请求参数名 (KEY)"
                        title-value="参数值 (VALUE)"
                        add-text="添加请求头或参数..."
                        empty-text="暂无自定义 HTTP 附加参数"
                      />
                    </div>
                  </el-form-item>
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
              <el-switch
                v-model="retryEnabled"
                inline-prompt
                active-text="启用"
                inactive-text="关闭"
                @change="handleRetryToggle"
              />
            </div>
          </div>

          <transition name="el-zoom-in-top">
            <RetryConfigEditor
              v-if="retryEnabled && form.retry_config"
              v-model:maxExecutionSeconds="form.max_execution_seconds"
              v-model:maxRetries="form.retry_config.max_retries"
              v-model:initialInterval="form.retry_config.initial_interval"
              v-model:maxInterval="form.retry_config.max_interval"
            />
          </transition>
        </div>
      </el-form>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue"
import { pick, cloneDeep } from "lodash-es"
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
  Pointer
} from "@element-plus/icons-vue"
import { TaskType, type CreateTaskReq, type TaskItem } from "@/api/etask/manager/type"
import type { HandlerDetail } from "@/api/etask/executor/type"
import { useTaskResources } from "../composables/useTaskResources"
import MapEditor from "./MapEditor.vue"
import KVEditor from "./KVEditor.vue"
import CronHelper from "./CronHelper.vue"
import TaskParamsEditor from "./TaskParamsEditor.vue"
import RetryConfigEditor from "./RetryConfigEditor.vue"
import { Drawer } from "@@/components/Dialogs"
import type { FormInstance, FormRules } from "element-plus"

/**
 * 任务配置抽屉组件
 * @description 采用 Metadata-Driven 交互模式，业务逻辑已解耦至 useTaskResources
 */
const props = defineProps<{
  isEdit?: boolean
  initialData?: TaskItem | null
}>()

const visible = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  (e: "save", payload: CreateTaskReq): void
}>()

// --- 外部资源联运 ---
const {
  loading: resourceLoading,
  executorList,
  fetchResources,
  queryServiceSuggestions,
  queryHandlerSuggestions
} = useTaskResources()

// --- 基础状态管理 ---
const formRef = ref<FormInstance>()
const saving = ref(false)
const activeProtocol = ref("grpc")

// 复合 Loading
const loading = computed(() => resourceLoading.value || saving.value)

// 重试配置开启状态
const retryEnabled = ref(false)

const handleRetryToggle = (val: boolean | string | number) => {
  if (!val) {
    // 关闭时，如果不想要这些字段，可以在保存时处理，或者这里直接清理
    // 保持状态同步
  } else {
    if (!form.retry_config) {
      form.retry_config = { max_retries: 3, initial_interval: 1000, max_interval: 5000 }
    }
  }
}

const protocols = [
  { label: "gRPC", value: "grpc", icon: Connection, desc: "分布式标准通信协议" },
  { label: "HTTP", value: "http", icon: Link, desc: "标准 RESTful 后端回调" }
]

const defaultForm = (): CreateTaskReq => ({
  name: "",
  type: TaskType.RECURRING,
  cron_expr: "",
  max_execution_seconds: 360,
  grpc_config: {
    service_name: "",
    handler_name: "",
    params: {}
  },
  http_config: { endpoint: "", params: {} },
  retry_config: { max_retries: 3, initial_interval: 1000, max_interval: 5000 },
  schedule_params: {},
  metadata: {}
})

const form = reactive<CreateTaskReq>(defaultForm())

// --- 表单联动逻辑 ---
const currentHandler = computed(() => {
  if (!form.grpc_config?.service_name) return null
  const ex = executorList.value.find((e) => e.name === form.grpc_config!.service_name)
  return ex?.handlers.find((h) => h.name === form.grpc_config!.handler_name)
})

const handleServiceSelect = () => {
  form.grpc_config!.handler_name = ""
}

const handleHandlerSelect = (item: Record<string, any>) => {
  const val = item as HandlerDetail
  if (val.metadata) {
    val.metadata.forEach((p) => {
      if (!form.grpc_config!.params![p.key]) {
        form.grpc_config!.params![p.key] = p.default || ""
      }
    })
  }
}

// 封装后的过滤器
const queryHandlers = (qs: string, cb: (res: (HandlerDetail & { value: string })[]) => void) =>
  queryHandlerSuggestions(form.grpc_config!.service_name, qs, cb)

const rules = computed<FormRules>(() => {
  const r: FormRules = {
    name: [{ required: true, message: "请输入任务标识", trigger: "blur" }]
  }

  // 周期性任务必须有 Cron
  if (form.type === TaskType.RECURRING) {
    r.cron_expr = [{ required: true, message: "请输入有效的 Cron 表达式", trigger: ["blur", "change"] }]
  }

  // 根据协议校验必填项
  if (activeProtocol.value === "grpc") {
    r["grpc_config.service_name"] = [{ required: true, message: "请选择执行器服务", trigger: "change" }]
    r["grpc_config.handler_name"] = [{ required: true, message: "请选择处理方法", trigger: "change" }]
  } else {
    r["http_config.endpoint"] = [{ required: true, message: "请输入接口地址", trigger: "blur" }]
  }

  return r
})

// --- 监听器集 ---

// 显隐同步
// 显隐同步：打开时刷新资源
watch(visible, (val) => val && fetchResources())

// 数据回填
watch(
  () => props.initialData,
  (val) => {
    // 1. 初始化/重置表单
    const base = defaultForm()
    if (!val) {
      Object.assign(form, base)
      activeProtocol.value = "grpc"
      retryEnabled.value = false
      return
    }

    // 2. 挑选业务需要的字段并深拷贝，自然过滤 ctime, utime, next_time 等系统字段
    const businessFields = [
      "id",
      "name",
      "type",
      "cron_expr",
      "max_execution_seconds",
      "grpc_config",
      "http_config",
      "retry_config",
      "schedule_params",
      "metadata"
    ]
    const cleanData = cloneDeep(pick(val, businessFields))

    // 3. 结构补全：确保嵌套对象始终存在，防止协议切换时 UI 访问到 null (业界健壮性标准)
    Object.assign(form, {
      ...base,
      ...cleanData,
      grpc_config: cleanData.grpc_config || base.grpc_config,
      http_config: cleanData.http_config || base.http_config,
      retry_config: cleanData.retry_config || base.retry_config,
      schedule_params: cleanData.schedule_params || base.schedule_params,
      metadata: cleanData.metadata || base.metadata
    })

    // 4. 同步 UI 辅助状态
    activeProtocol.value = val.grpc_config ? "grpc" : val.http_config ? "http" : "grpc"
    retryEnabled.value = !!(val.retry_config || val.max_execution_seconds)
  },
  { immediate: true }
)

// --- 核心操作 ---
const handleCronSelect = (val: string) => {
  form.cron_expr = val
  // 主动触发校验，清除可能存在的验证错误
  formRef.value?.validateField("cron_expr").catch(() => {})
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    saving.value = true
    const payload = cloneDeep(form)
    if (activeProtocol.value === "grpc") {
      delete payload.http_config
    } else {
      delete payload.grpc_config
    }

    // 处理重试配置与超时逻辑：未启用或数据为空时彻底剥离
    if (!retryEnabled.value || !payload.retry_config) {
      delete payload.retry_config
      delete (payload as any).max_execution_seconds
    }

    emit("save", payload)
  } catch (err) {
    // 校验未通过
  } finally {
    saving.value = false
  }
}

const handleClosed = () => formRef.value?.resetFields()
defineExpose({ handleClosed })
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

.premium-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 1.5px solid #e2e8f0;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: #cbd5e1;
  }
  &.is-focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
}

.service-selector-row {
  margin-bottom: 28px; // 留出足够空间放置校验错误提示
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
.gap-6 {
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
