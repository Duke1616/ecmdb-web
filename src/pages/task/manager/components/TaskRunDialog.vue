<template>
  <FormDialog
    v-model="visible"
    title="运行任务"
    width="500px"
    :confirm-loading="submitting"
    :confirm-text="confirmText"
    :show-footer-info="false"
    @confirm="submit"
    @cancel="visible = false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="run-task-form">
      <header class="task-summary">
        <div class="summary-icon">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="summary-body">
          <h3>{{ task?.name || "未选择任务" }}</h3>
          <div class="summary-meta">
            <el-tag :type="task?.type === TaskType.RECURRING ? 'primary' : 'warning'" effect="plain">
              {{ task?.type === TaskType.RECURRING ? "周期性任务" : "单次触发任务" }}
            </el-tag>
            <span class="code-text">{{ task?.cron_expr || "未配置调度表达式" }}</span>
          </div>
        </div>
      </header>

      <template v-if="task?.type === TaskType.ONE_TIME">
        <section class="run-section">
          <div class="section-heading">启动方式</div>
          <div class="mode-grid">
            <button
              v-for="item in runModes"
              :key="item.value"
              type="button"
              class="mode-card"
              :class="{ active: form.mode === item.value }"
              @click="form.mode = item.value"
            >
              <span class="mode-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <span class="mode-content">
                <span class="mode-title">{{ item.title }}</span>
                <span class="mode-desc">{{ item.desc }}</span>
              </span>
            </button>
          </div>
        </section>

        <template v-if="form.mode === 'reset'">
          <section class="run-section">
            <div class="section-heading">重置方式</div>
            <el-segmented v-model="form.resetMode" :options="resetModeOptions" block class="reset-segmented" />

            <el-form-item v-if="form.resetMode === 'datetime'" prop="runAt" class="compact-form-item">
              <VueDatePicker
                v-model="form.runAt"
                placeholder="请选择本次任务触发时间"
                model-type="timestamp"
                format="yyyy-MM-dd HH:mm:ss"
                :min-date="new Date()"
                :enable-seconds="true"
                :clearable="true"
                auto-apply
                class="run-datepicker"
              />
            </el-form-item>

            <el-form-item v-else prop="cronExpr" class="compact-form-item">
              <div class="schedule-field">
                <el-icon class="field-icon"><MagicStick /></el-icon>
                <el-input v-model="form.cronExpr" placeholder="通过调度助手选择单次触发表达式" class="cron-input" />
                <CronHelper :type="TaskType.ONE_TIME" @select="handleCronSelect" />
              </div>
            </el-form-item>
          </section>
        </template>

        <div v-if="form.mode === 'reset'" class="cron-preview">
          <span>提交表达式</span>
          <code>{{ generatedCronExpr || "--" }}</code>
        </div>
      </template>

      <div v-else class="run-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>周期性任务启动后将按原有调度计划触发，不会修改调度周期。</span>
      </div>
    </el-form>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { InfoFilled, MagicStick, Timer, VideoPlay } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import { VueDatePicker } from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"
import { FormDialog } from "@@/components/Dialogs"
import { TaskType, type TaskItem } from "@/api/task/manager/type"
import CronHelper from "./CronHelper.vue"

type RunMode = "now" | "reset"
type ResetMode = "datetime" | "helper"
export interface TaskRunSubmitPayload {
  id: number
  cron_expr?: string
}

const props = defineProps<{
  modelValue: boolean
  task: TaskItem | null
  onSubmit: (payload: TaskRunSubmitPayload) => Promise<void>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive<{
  mode: RunMode
  resetMode: ResetMode
  runAt: number | undefined
  cronExpr: string
}>({
  mode: "now",
  resetMode: "datetime",
  runAt: undefined,
  cronExpr: ""
})
const runModes = [
  { value: "now", title: "立即运行", desc: "马上触发一次任务执行", icon: VideoPlay },
  { value: "reset", title: "重置触发时间", desc: "更新数据库调度时间，等待调度器触发", icon: Timer }
] as const
const resetModeOptions = [
  { label: "指定时间", value: "datetime" },
  { label: "调度助手", value: "helper" }
]

const generatedCronExpr = computed(() => {
  if (form.mode !== "reset") return ""
  if (form.resetMode === "helper") return form.cronExpr.trim()
  if (!form.runAt) return ""
  const date = new Date(Number(form.runAt))
  return `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`
})
const confirmText = computed(() => {
  if (form.mode === "reset") return "更新触发时间"
  return props.task?.type === TaskType.RECURRING ? "启动调度" : "启动任务"
})

const rules = computed<FormRules>(() => ({
  runAt:
    form.mode === "reset" && form.resetMode === "datetime"
      ? [
          { required: true, message: "请选择触发时间", trigger: "change" },
          {
            validator: (_rule, value, callback) => {
              if (Number(value) <= Date.now()) {
                callback(new Error("触发时间必须晚于当前时间"))
              } else callback()
            },
            trigger: "change"
          }
        ]
      : [],
  cronExpr:
    form.mode === "reset" && form.resetMode === "helper"
      ? [
          { required: true, message: "请选择或填写调度表达式", trigger: ["blur", "change"] },
          {
            validator: (_rule, value, callback) => {
              if (!String(value || "").trim()) callback(new Error("请选择或填写调度表达式"))
              else callback()
            },
            trigger: ["blur", "change"]
          }
        ]
      : []
}))

const handleCronSelect = (value: string) => {
  form.cronExpr = value
  formRef.value?.validateField("cronExpr").catch(() => {})
}

const submit = async () => {
  if (!props.task) return
  await formRef.value?.validate()

  const payload: TaskRunSubmitPayload = { id: props.task.id }
  if (props.task.type === TaskType.ONE_TIME && form.mode === "reset") {
    payload.cron_expr = generatedCronExpr.value
  }

  submitting.value = true
  try {
    await props.onSubmit(payload)
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => form.runAt,
  () => {
    if (form.mode === "reset" && form.resetMode === "datetime" && form.runAt) {
      formRef.value?.validateField("runAt").catch(() => {})
    }
  }
)

watch(visible, (value) => {
  if (!value) return
  form.mode = "now"
  form.resetMode = "datetime"
  form.runAt = undefined
  form.cronExpr = ""
  formRef.value?.clearValidate()
})
</script>

<style scoped lang="scss">
.run-task-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary-icon {
  display: flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 8px;
  font-size: 16px;
}

.summary-body {
  min-width: 0;

  h3 {
    margin: 0 0 6px;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
  }
}

.summary-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.code-text,
.cron-preview code {
  overflow: hidden;
  color: #64748b;
  font-family: "Fira Code", Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-heading {
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 62px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }

  &.active {
    background: #eff6ff;
    border-color: #60a5fa;
    box-shadow: inset 0 0 0 1px #60a5fa;

    .mode-icon {
      color: #ffffff;
      background: #3b82f6;
    }

    .mode-title {
      color: #0f172a;
    }
  }
}

.mode-icon {
  display: inline-flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 15px;
  transition: inherit;
}

.mode-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.mode-title {
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
}

.mode-desc {
  color: #64748b;
  font-size: 11px;
  line-height: 1.3;
}

.reset-segmented {
  width: 100%;

  :deep(.el-segmented__item) {
    min-height: 32px;
    font-size: 13px;
  }
}

.compact-form-item {
  margin-bottom: 0;
}

.schedule-field {
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  gap: 8px;
  padding: 0 10px;
  background: #ffffff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  box-sizing: border-box;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover,
  &:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
  }
}

.field-icon {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 15px;
}

.cron-input {
  flex: 1;
  min-width: 0;
  width: 100%;

  :deep(.el-input__wrapper) {
    min-height: 34px;
    padding: 0;
    background: transparent;
    box-shadow: none !important;
  }

  :deep(.el-input__inner) {
    height: 34px;
    font-size: 13px;
  }
}

.run-datepicker {
  width: 100%;
  --dp-font-family: inherit;
  --dp-border-radius: 8px;
  --dp-input-padding: 6px 32px 6px 36px;
  --dp-border-color: #d8dee8;
  --dp-hover-border-color: #93c5fd;
  --dp-primary-color: #3b82f6;
  --dp-primary-text-color: #ffffff;
  --dp-text-color: #334155;
  --dp-icon-color: #64748b;
  --dp-menu-border-color: #e2e8f0;
  --dp-cell-border-radius: 6px;
  --dp-action-button-height: 30px;
  --dp-action-row-padding: 10px;

  :deep(.dp__input) {
    height: 36px;
    color: #334155;
    background: #ffffff;
    font-size: 13px;
    box-shadow: none;
  }

  :deep(.dp__input_wrap) {
    width: 100%;
  }

  :deep(.dp__input_icon) {
    color: #64748b;
  }
}

.cron-preview,
.run-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
}

.cron-preview {
  justify-content: space-between;

  code {
    color: #334155;
    font-weight: 600;
  }
}

@media (max-width: 560px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
