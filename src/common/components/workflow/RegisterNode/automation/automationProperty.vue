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
      <el-form-item label="节点名称" prop="name" class="form-item">
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
    <FormSection title="逻辑执行" tooltip="配置业务代码模版与目标执行环境" theme-color="purple">
      <template #icon>
        <el-icon><Setting /></el-icon>
      </template>
      <div class="settings-stack">
        <el-form-item label="代码模版" prop="codebook_id">
          <CodebookPicker
            :model-value="propertyForm.codebook_id || undefined"
            placeholder="请选择代码模版"
            variant="element"
            class="modern-select"
            :disabled="flowDetail.status == '2'"
            @update:model-value="handleCodebookUpdate"
          />
        </el-form-item>

        <el-form-item label="执行节点" prop="tag">
          <el-select
            ref="tagSelect"
            v-model="propertyForm.tag"
            filterable
            :loading="runnerTagsLoading"
            :placeholder="runnerTagsPlaceholder"
            :disabled="!propertyForm.codebook_id || flowDetail.status == '2'"
            class="modern-select"
            popper-class="automation-runner-select-dropdown"
          >
            <el-option
              v-if="propertyForm.tag === 'auto'"
              class="hidden-auto-option"
              label="自动分发模式 (Auto)"
              value="auto"
            />
            <el-option v-for="item in availableTags" :key="item.id" :label="item.name" :value="item.tag">
              <div class="runner-option">
                <div class="runner-option-header">
                  <span class="runner-name">{{ item.name }}</span>
                  <el-tag size="small" :type="item.kind === 'GRPC' ? 'success' : 'warning'" effect="light" round>
                    {{ item.kind }}
                  </el-tag>
                </div>
                <div class="runner-option-desc">
                  <span>{{ item.tag }}</span>
                  <span v-if="item.target"> · {{ item.target }}</span>
                  <span v-if="item.handler"> / {{ item.handler }}</span>
                </div>
              </div>
            </el-option>
            <template #footer>
              <div class="footer-action">
                <el-button link type="primary" @click="setAutoTag" class="auto-发现-btn">
                  <el-icon class="mr-1"><MagicStick /></el-icon>
                  使用自动分发模式
                </el-button>
              </div>
            </template>
          </el-select>
        </el-form-item>
      </div>
    </FormSection>

    <!-- 触发控制 -->
    <FormSection title="定时任务" tooltip="开启后节点将按照设定的时间间隔自动触发" theme-color="orange">
      <template #icon>
        <el-icon><Timer /></el-icon>
      </template>
      <template #extra>
        <el-switch
          v-model="propertyForm.is_timing"
          @change="handleTimingChange"
          active-color="#6366f1"
          inactive-color="#e2e8f0"
          :disabled="flowDetail.status == '2'"
        />
      </template>

      <transition name="expand">
        <div v-if="propertyForm.is_timing" class="timing-config-box">
          <el-form-item label="配置方式" prop="exec_method">
            <el-radio-group v-model="propertyForm.exec_method" @change="handleChange" class="modern-radio-group">
              <el-radio-button label="hand">手动配置</el-radio-button>
              <el-radio-button label="template">动态提取</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div v-if="propertyForm.exec_method === 'hand'" class="grid-2">
            <el-form-item label="时间单位" prop="unit">
              <el-select v-model="propertyForm.unit" class="modern-select">
                <el-option v-for="item in unit" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="触发间隔" prop="quantity">
              <el-input-number
                v-model="propertyForm.quantity"
                :min="1"
                controls-position="right"
                class="modern-number"
              />
            </el-form-item>
          </div>

          <div v-if="propertyForm.exec_method === 'template'" class="grid-2">
            <el-form-item label="提取模版" prop="template_id">
              <el-select v-model="propertyForm.template_id" class="modern-select" placeholder="选择模版">
                <el-option v-for="item in templateRules" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="指定字段" prop="template_field">
              <el-select
                v-model="propertyForm.template_field"
                class="modern-select"
                placeholder="选择字段"
                :disabled="!propertyForm.template_id"
              >
                <el-option
                  v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id || 0))"
                  :key="field"
                  :label="title"
                  :value="field"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
      </transition>
    </FormSection>

    <!-- 结果通知 -->
    <FormSection title="状态通知" tooltip="执行完成后发送即时通知给相关人员" theme-color="green">
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
          <el-form-item label="通知策略" prop="notify_method">
            <el-checkbox-group v-model="propertyForm.notify_method" class="modern-checkbox-group">
              <el-checkbox v-for="item in notify_method_options" :key="item.value" :label="item.value" border>
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </div>
      </transition>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { listRunnerByCodebookIdApi } from "@/api/task/runner"
import { TagDetail, runner } from "@/api/task/runner/types/runner"
import { ElSelect, FormInstance, FormRules } from "element-plus"
import { Document, Setting, Timer, Bell, MagicStick } from "@element-plus/icons-vue"
import { computed, ref, onMounted, reactive } from "vue"
import { cloneDeep, uniqBy } from "lodash-es"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { FormSection } from "../../PropertySetting"
import CodebookPicker from "@/common/components/CodebookPicker/index.vue"

interface RunnerTagOption extends TagDetail {
  id: string
  name: string
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
const DEFAULT_FORM_DATA = {
  name: "自动化-",
  codebook_id: 0 as number,
  is_notify: false,
  is_timing: false,
  exec_method: "",
  template_field: "",
  template_id: null as number | null,
  notify_method: [],
  unit: null as number | null,
  quantity: null as number | null,
  tag: ""
}

const propertyForm = reactive(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const tagSelect = ref<InstanceType<typeof ElSelect> | null>(null)
const availableTags = ref<RunnerTagOption[]>([])
const runnerTagsLoading = ref(false)

const runnerTagsPlaceholder = computed(() => {
  if (!propertyForm.codebook_id) return "选择模版后选取可用执行节点"
  if (runnerTagsLoading.value) return "正在加载可用执行节点..."
  if (availableTags.value.length === 0) return "当前模版暂无可用执行节点"
  return "请选择执行节点"
})

// ── 模板与执行逻辑 ──────────────────────────────────────────────────────────
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

const handleChange = async () => {
  if (propertyForm.exec_method === "template") {
    propertyForm.unit = null
    propertyForm.quantity = null
  } else if (propertyForm.exec_method === "hand") {
    propertyForm.template_id = null
    propertyForm.template_field = ""
  } else {
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  }

  if (propertyForm.exec_method === "template" && props.id !== undefined) {
    await fetchTemplates(props.id)
  }
}

const handleTimingChange = () => {
  if (!propertyForm.is_timing) {
    propertyForm.exec_method = ""
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  } else if (!propertyForm.exec_method) {
    propertyForm.exec_method = "hand" // 默认手动
  }
}

// ── 标签与运行器逻辑 ────────────────────────────────────────────────────────
const toRunnerTagDetails = (runners: runner[]): RunnerTagOption[] => {
  const tags = runners.flatMap((item) =>
    (item.tags || []).map((tag) => ({
      id: `${item.id}:${tag}`,
      name: item.name,
      tag,
      kind: item.kind,
      target: item.target,
      handler: item.handler
    }))
  )

  return uniqBy(tags, (item) => [item.tag, item.kind, item.target, item.handler].join("|"))
}

const loadRunnerTagsByCodebook = async (clearTag = true) => {
  if (clearTag) {
    propertyForm.tag = ""
  }
  if (!propertyForm.codebook_id) {
    availableTags.value = []
    return
  }

  runnerTagsLoading.value = true
  try {
    const { data } = await listRunnerByCodebookIdApi({
      codebook_id: propertyForm.codebook_id,
      offset: 0,
      limit: 1000
    })
    availableTags.value = toRunnerTagDetails(data.runners || [])
  } catch (error) {
    console.log(error)
    availableTags.value = []
  } finally {
    runnerTagsLoading.value = false
  }
}

const handleCodebookUpdate = (value: number | number[] | undefined) => {
  propertyForm.codebook_id = Array.isArray(value) ? value[0] || 0 : value || 0
  loadRunnerTagsByCodebook(true)
}

function setAutoTag() {
  propertyForm.tag = "auto"
  tagSelect.value?.blur?.()
}

// ── 节点属性同步 ────────────────────────────────────────────────────────────
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    codebook_id: propertyForm.codebook_id,
    is_notify: propertyForm.is_notify,
    template_field: propertyForm.template_field,
    template_id: propertyForm.template_id,
    is_timing: propertyForm.is_timing,
    notify_method: propertyForm.notify_method,
    tag: propertyForm.tag,
    unit: propertyForm.unit,
    exec_method: propertyForm.exec_method,
    quantity: propertyForm.quantity
  })
}

const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

// ── UI 配置项 ──────────────────────────────────────────────────────────────
const unit = [
  { value: 1, label: "分钟" },
  { value: 2, label: "小时" },
  { value: 3, label: "天" }
]

const notify_method_options = [
  { value: 2, label: "实时发送：自动化任务结束后立即发送" },
  { value: 1, label: "合并发送：工单结束后统一合并发送" }
]

const formRules: FormRules = {
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
  ]
}

// ── 生命周期 ────────────────────────────────────────────────────────────
onMounted(async () => {
  propertyForm.name = props.nodeData?.properties.name || "自动化-"
  propertyForm.codebook_id = Number(props.nodeData?.properties.codebook_id) || 0
  propertyForm.is_notify = props.nodeData?.properties.is_notify
  propertyForm.is_timing = props.nodeData?.properties.is_timing
  propertyForm.notify_method = Array.isArray(props.nodeData?.properties.notify_method)
    ? props.nodeData?.properties.notify_method
    : [props.nodeData?.properties.notify_method].filter(Boolean)

  propertyForm.template_field = props.nodeData?.properties.template_field
  propertyForm.template_id = props.nodeData?.properties.template_id
  propertyForm.tag = props.nodeData?.properties.tag
  propertyForm.exec_method = props.nodeData?.properties.exec_method
  propertyForm.unit = props.nodeData?.properties.unit
  propertyForm.quantity = props.nodeData?.properties.quantity

  await loadRunnerTagsByCodebook(false)

  if (propertyForm.exec_method === "template" && props.id !== undefined) {
    await fetchTemplates(props.id)
  }
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

// ── 通用控件：统一 el-input / el-select / CodebookPicker / input-number ─────
.modern-input,
.modern-select,
.modern-number {
  width: 100%;
}

.modern-input,
.modern-select,
.modern-number {
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
  :deep(.single-text),
  :deep(.placeholder-text),
  :deep(.codebook-name) {
    font-size: 14px;
    font-weight: 400;
    color: var(--automation-control-text);
  }

  :deep(.el-input__inner::placeholder),
  :deep(.placeholder-text),
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

.modern-number {
  :deep(.el-input-number__increase),
  :deep(.el-input-number__decrease) {
    height: calc(var(--automation-control-height) - 2px);
    color: #64748b;
    background: #f8fafc;
    border-color: var(--automation-control-border);

    &:hover {
      color: var(--automation-control-border-focus);
      background: #eff6ff;
    }
  }

  :deep(.el-input-number__decrease) {
    border-right: 1px solid var(--automation-control-border);
  }
}

.modern-radio-group {
  width: 100%;
  display: flex !important;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  :deep(.el-radio-button) {
    flex: 1;
    .el-radio-button__inner {
      width: 100%;
      background: transparent;
      border: none !important;
      box-shadow: none !important;
      border-radius: 6px !important;
      font-size: 13px;
      padding: 7px 12px;
      color: #64748b;
      transition: all 0.2s;
    }
    &:hover:not(.is-active) .el-radio-button__inner {
      color: #1e293b;
    }
    &.is-active .el-radio-button__inner {
      background: #ffffff;
      color: #6366f1;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
    }
  }
}

// ── 布局结构 ────────────────────────────────────────────────────────────
.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

// ── 局部增强 ────────────────────────────────────────────────────────────
.timing-config-box,
.notify-config-box {
  margin-top: 10px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.modern-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  :deep(.el-checkbox) {
    margin: 0;
    height: 36px;
    background: #ffffff;
    border-radius: 8px;
    border-color: #e2e8f0;
    &.is-checked {
      border-color: #6366f1;
      background: #f5f3ff;
    }
  }
}

.option-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

:global(.automation-runner-select-dropdown .hidden-auto-option) {
  display: none !important;
}

.runner-option {
  padding: 4px 0;

  .runner-option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;

    .runner-name {
      min-width: 0;
      overflow: hidden;
      font-weight: 600;
      color: #0f172a;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .runner-option-desc {
    font-size: 11px;
    color: #94a3b8;
  }
}

.footer-action {
  padding: 8px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

.auto-发现-btn {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1 !important;
}

.form-item {
  margin-bottom: 0px;
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
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
