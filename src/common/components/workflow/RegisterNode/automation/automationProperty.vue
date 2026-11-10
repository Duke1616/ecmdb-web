<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status == '2'"
    class="property-form"
  >
    <!-- 节点基础 -->
    <FormSection title="节点基础" tooltip="设置自动化节点的唯一标识与名称" theme-color="slate">
      <template #icon>
        <el-icon><Document /></el-icon>
      </template>
      <el-form-item label="节点名称" prop="name" class="form-item last-form-item">
        <el-input
          v-model="propertyForm.name"
          clearable
          placeholder="e.g. 自动化-同步资产"
          class="modern-input"
          :disabled="flowDetail.status == '2'"
        />
      </el-form-item>
    </FormSection>

    <!-- 逻辑执行 -->
    <FormSection title="逻辑执行" tooltip="选择该节点执行的脚本文件与执行节点" theme-color="purple">
      <template #icon>
        <el-icon><Setting /></el-icon>
      </template>
      <el-form-item label="脚本文件" prop="codebook_id" class="form-item">
        <CodebookPicker
          :model-value="propertyForm.codebook_id || undefined"
          placeholder="请选择脚本文件"
          variant="element"
          class="modern-select"
          :disabled="flowDetail.status == '2'"
          @update:model-value="handleCodebookUpdate"
        />
      </el-form-item>

      <el-form-item label="默认执行单元" prop="runner_id" class="form-item">
        <div class="execution-unit-control">
          <el-select
            v-model="propertyForm.runner_id"
            filterable
            clearable
            :loading="runnersLoading"
            :placeholder="runnerPlaceholder"
            :disabled="!propertyForm.codebook_id || flowDetail.status == '2'"
            class="modern-select runner-select"
            popper-class="automation-runner-select-dropdown"
          >
            <el-option v-for="item in runners" :key="item.id" :label="item.name" :value="item.id">
              <div class="runner-option">
                <span class="runner-name">{{ item.name }}</span>
                <span class="runner-meta">
                  {{ getProgramKindLabel(item.program_kind) }}
                  <template v-if="item.target || item.handler">
                    <span class="runner-meta-divider">·</span>
                    <span class="runner-handler">{{ [item.target, item.handler].filter(Boolean).join(" / ") }}</span>
                  </template>
                </span>
              </div>
            </el-option>
          </el-select>

          <AutomationRouteWorkbench
            :workflow-id="props.id"
            :automation-node-id="props.nodeData?.id"
            :automation-node-name="propertyForm.name"
            :codebook-id="propertyForm.codebook_id"
            :default-runner-id="propertyForm.runner_id"
            :runners="runners"
            :disabled="flowDetail.status == '2'"
          />
        </div>
      </el-form-item>

      <el-form-item label="任务执行超时" prop="max_execution_seconds" class="form-item last-form-item">
        <TimeoutEditor
          v-model="propertyForm.max_execution_seconds"
          :disabled="flowDetail.status == '2'"
        />
      </el-form-item>
    </FormSection>

    <!-- 执行时间（核心调度能力） -->
    <FormSection
      title="执行时间"
      tooltip="设置节点到达后的单次执行时间与调度策略"
      theme-color="orange"
    >
      <template #icon>
        <el-icon><Timer /></el-icon>
      </template>
      <template #extra>
        <el-switch
          v-model="scheduleEnabled"
          active-color="#6366f1"
          inactive-color="#e2e8f0"
          :disabled="flowDetail.status == '2'"
        />
      </template>
      <ScheduleEditor
        ref="scheduleEditorRef"
        v-model="propertyForm.schedule"
        :disabled="flowDetail.status == '2'"
      />
    </FormSection>

    <!-- 撤回补偿 -->
    <FormSection
      title="撤回补偿"
      tooltip="当前节点执行成功后，流程撤回时立即执行所选补偿节点"
      theme-color="slate"
      class="compensation-section"
      :class="{ 'is-enabled': compensationEnabled }"
    >
      <template #icon>
        <el-icon><RefreshLeft /></el-icon>
      </template>
      <template #extra>
        <el-switch
          v-model="compensationEnabled"
          active-color="#6366f1"
          inactive-color="#e2e8f0"
          :disabled="flowDetail.status == '2'"
        />
      </template>
      <transition name="expand">
        <el-form-item
          v-if="compensationEnabled"
          label="补偿节点"
          prop="compensation_node_id"
          class="form-item last-form-item"
        >
          <el-select
            v-model="propertyForm.compensation_node_id"
            filterable
            :placeholder="compensationNodeOptions.length ? '请选择补偿节点' : '暂无可用的自动化节点'"
            :disabled="flowDetail.status == '2'"
            class="modern-select"
            @visible-change="handleCompensationSelectVisible"
          >
            <el-option v-for="item in compensationNodeOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </transition>
    </FormSection>

    <!-- 状态通知 -->
    <FormSection
      title="状态通知"
      tooltip="执行完成后发送即时通知给相关人员"
      theme-color="green"
    >
      <template #icon>
        <el-icon><Bell /></el-icon>
      </template>
      <template #extra>
        <el-switch
          v-model="propertyForm.is_notify"
          active-color="#6366f1"
          inactive-color="#e2e8f0"
          :disabled="flowDetail.status == '2'"
        />
      </template>

      <transition name="expand">
        <div v-if="propertyForm.is_notify" class="notify-config-box">
          <el-form-item label="通知时机" prop="notify_method" class="form-item last-form-item">
            <div class="notify-card-stack">
              <div
                v-for="opt in notify_method_options"
                :key="opt.value"
                class="notify-timing-card"
                :class="{
                  'is-active': propertyForm.notify_method.includes(opt.value),
                  'is-disabled': flowDetail.status == '2'
                }"
                @click="toggleNotifyMethod(opt.value)"
              >
                <div class="card-checkbox">
                  <el-icon v-if="propertyForm.notify_method.includes(opt.value)"><Check /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">{{ opt.title }}</div>
                  <div class="card-desc">{{ opt.desc }}</div>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>
      </transition>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { listRunnerByCodebookIdApi } from "@/api/task/runner"
import type { runner } from "@/api/task/runner/types/runner"
import { getProgramKindLabel } from "@/api/task/program"
import { FormInstance, FormRules } from "element-plus"
import { Bell, Check, Document, QuestionFilled, RefreshLeft, Setting, Timer } from "@element-plus/icons-vue"
import { computed, ref, onMounted, reactive, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { FormSection } from "../../PropertySetting"
import CodebookPicker from "@/common/components/CodebookPicker/index.vue"
import ScheduleEditor from "./components/ScheduleEditor.vue"
import AutomationRouteWorkbench from "./components/AutomationRouteWorkbench.vue"
import TimeoutEditor from "./components/TimeoutEditor.vue"
import {
  createFixedDelaySchedule,
  createImmediateSchedule,
  resolveFallbackSchedule,
  type ScheduleConfig
} from "./schedule"
import { getCompensationNodeOptions, type CompensationNodeOption } from "./compensation"

interface AutomationPropertyForm {
  name: string
  codebook_id: number
  runner_id?: number
  max_execution_seconds?: number
  is_notify: boolean
  schedule: ScheduleConfig
  notify_method: number[]
  compensation_node_id: string
}

// ── 属性与事件定义 ──────────────────────────────────────────────────────────
const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  id: Number,
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])

// ── 状态管理 ────────────────────────────────────────────────────────────
const DEFAULT_FORM_DATA: AutomationPropertyForm = {
  name: "自动化-",
  codebook_id: 0,
  runner_id: undefined,
  max_execution_seconds: undefined,
  is_notify: false,
  schedule: createImmediateSchedule() as ScheduleConfig,
  notify_method: [],
  compensation_node_id: ""
}

const propertyForm = reactive<AutomationPropertyForm>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const scheduleEditorRef = ref<InstanceType<typeof ScheduleEditor> | null>(null)
const runners = ref<runner[]>([])
const runnersLoading = ref(false)
const activeScheduleDraft = ref<ScheduleConfig>(createFixedDelaySchedule())
const compensationNodeOptions = ref<CompensationNodeOption[]>([])
const compensationEnabled = ref(false)

const runnerPlaceholder = computed(() => {
  if (!propertyForm.codebook_id) return "请先选择脚本文件"
  if (runnersLoading.value) return "正在加载执行单元..."
  if (runners.value.length === 0) return "当前脚本暂无可用执行单元"
  return "请选择默认执行单元（可选）"
})

watch(
  () => propertyForm.schedule,
  (schedule) => {
    if (schedule.type !== "immediate") activeScheduleDraft.value = cloneDeep(schedule)
  },
  { deep: true }
)

const scheduleEnabled = computed({
  get: () => propertyForm.schedule.type !== "immediate",
  set: (enabled: boolean) => {
    propertyForm.schedule = enabled ? cloneDeep(activeScheduleDraft.value) : createImmediateSchedule()
  }
})

const loadRunners = async () => {
  if (!propertyForm.codebook_id) {
    runners.value = []
    return
  }
  runnersLoading.value = true
  try {
    const { data } = await listRunnerByCodebookIdApi(propertyForm.codebook_id)
    runners.value = data.runners || []
    if (!runners.value.some((item) => item.id === propertyForm.runner_id)) {
      propertyForm.runner_id = undefined
    }
  } catch (error) {
    console.log(error)
    runners.value = []
  } finally {
    runnersLoading.value = false
  }
}

const handleCodebookUpdate = (value: number | number[] | undefined) => {
  const codebookID = Array.isArray(value) ? value[0] || 0 : value || 0
  if (codebookID === propertyForm.codebook_id) return
  propertyForm.codebook_id = codebookID
  propertyForm.runner_id = undefined
  void loadRunners()
}

const refreshCompensationNodeOptions = () => {
  const graphData = props.lf?.getGraphData?.()
  compensationNodeOptions.value = getCompensationNodeOptions(graphData?.nodes || [], props.nodeData?.id)
}

const handleCompensationSelectVisible = (visible: boolean) => {
  if (visible) refreshCompensationNodeOptions()
}

watch(compensationEnabled, (enabled) => {
  if (enabled) {
    refreshCompensationNodeOptions()
    return
  }
  propertyForm.compensation_node_id = ""
  formRef.value?.clearValidate("compensation_node_id")
})

// ── 节点属性同步 ────────────────────────────────────────────────────────────
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    codebook_id: propertyForm.codebook_id,
    runner_id: propertyForm.runner_id,
    max_execution_seconds: propertyForm.max_execution_seconds ? Number(propertyForm.max_execution_seconds) : 0,
    is_notify: propertyForm.is_notify,
    schedule: cloneDeep(propertyForm.schedule),
    notify_method: propertyForm.notify_method,
    compensation_node_id: propertyForm.compensation_node_id
  })
  if (!propertyForm.runner_id) {
    props.lf?.deleteProperty?.(props.nodeData?.id, "runner_id")
  }
  if (!propertyForm.max_execution_seconds) {
    props.lf?.deleteProperty?.(props.nodeData?.id, "max_execution_seconds")
  }

  const deprecatedKeys = ["is_timing", "exec_method", "template_field", "template_id", "unit", "quantity"]
  deprecatedKeys.forEach((key) => props.lf?.deleteProperty?.(props.nodeData?.id, key))
}

const confirmFunc = () => {
  if (!scheduleEditorRef.value?.validate()) return
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

// ── UI 配置项 ──────────────────────────────────────────────────────────────
const notify_method_options = [
  {
    value: 2,
    title: "任务即时通知",
    desc: "当前自动化节点执行完毕后立即向相关人发送结果"
  },
  {
    value: 1,
    title: "工单归档汇总",
    desc: "待工单全流程流转完毕归档后，统一合并汇总推送"
  }
]

const toggleNotifyMethod = (val: number) => {
  if (props.flowDetail?.status === "2") return
  const idx = propertyForm.notify_method.indexOf(val)
  if (idx > -1) {
    propertyForm.notify_method.splice(idx, 1)
  } else {
    propertyForm.notify_method.push(val)
  }
}

const formRules: FormRules = {
  codebook_id: [{ required: true, type: "number", min: 1, message: "请选择脚本文件", trigger: "change" }],
  name: [
    { required: true, message: "名称不能为空" },
    { max: 50, message: "最大50字符" },
    {
      validator: (rule, value, callback) => {
        if (!value.startsWith("自动化-")) {
          callback(new Error("名称必须以'自动化-'开头"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  compensation_node_id: [
    {
      validator: (_rule, value, callback) => {
        if (!compensationEnabled.value) return callback()
        if (!value) return callback(new Error("请选择补偿节点"))
        refreshCompensationNodeOptions()
        const target = compensationNodeOptions.value.find((item) => item.id === value)
        if (!target) return callback(new Error("请选择有效的自动化补偿节点"))
        callback()
      },
      trigger: "change"
    }
  ]
}

// ── 生命周期 ────────────────────────────────────────────────────────────
onMounted(async () => {
  propertyForm.name = props.nodeData?.properties.name || "自动化-"
  propertyForm.codebook_id = Number(props.nodeData?.properties.codebook_id) || 0
  const runnerID = Number(props.nodeData?.properties.runner_id)
  propertyForm.runner_id = runnerID > 0 ? runnerID : undefined
  const maxTimeout = Number(props.nodeData?.properties.max_execution_seconds)
  propertyForm.max_execution_seconds = maxTimeout > 0 ? maxTimeout : undefined
  propertyForm.is_notify = props.nodeData?.properties.is_notify
  propertyForm.schedule = resolveFallbackSchedule(props.nodeData?.properties)
  if (propertyForm.schedule.type !== "immediate") activeScheduleDraft.value = cloneDeep(propertyForm.schedule)
  propertyForm.notify_method = Array.isArray(props.nodeData?.properties.notify_method)
    ? props.nodeData?.properties.notify_method
    : [props.nodeData?.properties.notify_method].filter(Boolean)

  propertyForm.compensation_node_id = String(props.nodeData?.properties.compensation_node_id || "")
  compensationEnabled.value = !!propertyForm.compensation_node_id
  refreshCompensationNodeOptions()

  await loadRunners()
})

defineExpose({
  confirmFunc
})
</script>

<style scoped lang="scss">
.property-form {
  --automation-control-height: 36px;
  --automation-control-radius: 6px;
  --automation-control-border: #cbd5e1;
  --automation-control-border-hover: #94a3b8;
  --automation-control-border-focus: #94a3b8;
  --automation-control-text: #303133;
  --automation-control-placeholder: #a8abb2;

  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

.form-item {
  margin-bottom: 14px;

  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}


.last-form-item {
  margin-bottom: 0 !important;
}

// ── 通用控件 ───────────────────────────────────────────────────────────────
.modern-input,
.modern-select,
.modern-input-number {
  width: 100%;
}

.modern-input,
.modern-select,
.modern-input-number {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.picker-input-box) {
    min-height: var(--automation-control-height);
    height: var(--automation-control-height);
    padding: 2px 10px;
    background: #ffffff !important;
    border: 1px solid var(--automation-control-border) !important;
    border-radius: var(--automation-control-radius) !important;
    box-shadow: none !important;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--automation-control-border-hover) !important;
    }

    &.is-focus,
    &.is-focused {
      border-color: var(--automation-control-border-focus) !important;
      box-shadow: none !important;
    }
  }

  :deep(.el-input__inner),
  :deep(.el-select__placeholder),
  :deep(.el-select__selected-item),
  :deep(.single-text) {
    font-size: 14px;
    font-weight: 400;
    color: var(--automation-control-text);
  }

  :deep(.el-input__inner::placeholder),
  :deep(.el-select__placeholder.is-transparent) {
    color: var(--automation-control-placeholder);
  }

  :deep(.selected-single) {
    min-width: 0;
    gap: 6px;
  }

  :deep(.picker-arrow),
  :deep(.el-select__caret) {
    color: var(--automation-control-placeholder);
  }
}

// ── 布局结构 ────────────────────────────────────────────────────────────
.withdraw-form-item {
  margin-bottom: 0;
}

.last-form-item {
  margin-bottom: 0;
}

.execution-unit-control {
  display: flex;
  width: 100%;

  .runner-select {
    min-width: 0;
    flex: 1;

    :deep(.el-select__wrapper) {
      border-radius: var(--automation-control-radius) 0 0 var(--automation-control-radius) !important;
    }
  }
}

.compensation-section:not(.is-enabled) {
  :deep(.section-header) {
    margin-bottom: 0;
  }

  :deep(.section-content) {
    display: none;
  }
}

// ── 状态通知卡片组件 ──────────────────────────────────────────────────
.notify-config-box {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.notify-card-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.notify-timing-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  &:hover:not(.is-disabled) {
    background: #fcfdfd;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  &.is-active {
    background: #f0fdf4;
    border-color: #86efac;

    .card-checkbox {
      background: #10b981;
      border-color: #10b981;
      color: #ffffff;
    }

    .card-title {
      color: #166534;
      font-weight: 600;
    }

    .card-desc {
      color: #15803d;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .card-checkbox {
    width: 16px;
    height: 16px;
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    background: #ffffff;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .card-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .card-title {
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      line-height: 1.3;
      transition: color 0.2s ease;
    }

    .card-desc {
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.3;
      transition: color 0.2s ease;
    }
  }
}

.option-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.runner-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;

  .runner-name {
    min-width: 0;
    overflow: hidden;
    color: #303133;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .runner-meta {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    min-width: 0;
    color: #909399;
    font-size: 12px;
    white-space: nowrap;
  }

  .runner-meta-divider {
    margin: 0 6px;
    color: #c0c4cc;
  }

  .runner-handler {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}


// ── 动画 ────────────────────────────────────────────────────────────
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
</style>
