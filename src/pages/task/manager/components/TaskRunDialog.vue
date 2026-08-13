<template>
  <FormDialog
    v-model="visible"
    :title="dialogTitle"
    subtitle="确认启动方式，并按需覆盖本次执行参数"
    width="640px"
    :header-icon="VideoPlay"
    :confirm-loading="submitting"
    :confirm-text="confirmText"
    :show-footer-info="false"
    @confirm="submit"
    @cancel="visible = false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="run-task-form">
      <template v-if="task?.type === TaskType.ONE_TIME">
        <section class="execution-panel">
          <div class="execution-header">
            <div class="execution-title">
              <strong>执行方式</strong>
            </div>
            <div class="mode-selector" role="radiogroup" aria-label="执行方式">
              <button
                v-for="item in runModes"
                :key="item.value"
                type="button"
                role="radio"
                :aria-checked="form.mode === item.value"
                class="mode-option"
                :class="{ active: form.mode === item.value }"
                @click="form.mode = item.value"
              >
                <span class="mode-option-title">
                  <el-icon><component :is="item.icon" /></el-icon>
                  {{ item.title }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="form.mode === 'reset'" class="schedule-config">
            <div class="schedule-config-header">
              <div>
                <h4>触发设置</h4>
                <p>任务将在指定时间由调度器执行</p>
              </div>
              <div class="reset-mode-switcher" role="radiogroup" aria-label="触发设置方式">
                <button
                  v-for="item in resetModeOptions"
                  :key="item.value"
                  type="button"
                  role="radio"
                  :aria-checked="form.resetMode === item.value"
                  class="reset-mode-option"
                  :class="{ active: form.resetMode === item.value }"
                  @click="form.resetMode = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div class="schedule-config-body">
              <el-form-item v-if="form.resetMode === 'datetime'" prop="runAt" class="compact-form-item">
                <VueDatePicker
                  v-model="form.runAt"
                  placeholder="请选择本次任务触发时间"
                  model-type="timestamp"
                  format="yyyy-MM-dd HH:mm:ss"
                  :min-date="new Date()"
                  :enable-seconds="true"
                  :input-attrs="{ clearable: false }"
                  teleport
                  auto-apply
                  class="run-datepicker"
                >
                  <template #dp-input="{ value, openMenu, onClear }">
                    <div class="date-field">
                      <button
                        type="button"
                        class="date-trigger"
                        aria-label="选择本次任务触发时间"
                        @click.stop="openMenu"
                        @keydown.enter.prevent="openMenu"
                        @keydown.space.prevent="openMenu"
                      >
                        <el-icon class="field-icon"><Calendar /></el-icon>
                        <span class="date-field-value" :class="{ placeholder: !value }">
                          {{ value || "请选择本次任务触发时间" }}
                        </span>
                      </button>
                      <button
                        v-if="value"
                        type="button"
                        class="date-clear"
                        aria-label="清除触发时间"
                        @mousedown.prevent
                        @click.stop="onClear($event)"
                      >
                        <el-icon><Close /></el-icon>
                      </button>
                    </div>
                  </template>
                </VueDatePicker>
              </el-form-item>

              <el-form-item v-else prop="cronExpr" class="compact-form-item">
                <div class="schedule-field">
                  <el-icon class="field-icon"><MagicStick /></el-icon>
                  <el-input v-model="form.cronExpr" placeholder="通过调度助手选择单次触发表达式" class="cron-input" />
                  <CronHelper :type="TaskType.ONE_TIME" @select="handleCronSelect" />
                </div>
              </el-form-item>

              <div class="cron-result">
                <span>提交表达式</span>
                <code>{{ generatedCronExpr || "等待配置" }}</code>
              </div>
            </div>
          </div>
        </section>
      </template>

      <div v-else class="schedule-note">
        <el-icon><InfoFilled /></el-icon>
        <span>周期任务启动后将按原有调度计划执行，不会修改调度周期。</span>
      </div>

      <section class="parameter-section">
        <div class="section-heading parameter-heading">
          <div>
            <h4>本次执行参数</h4>
            <p>仅勾选需要临时修改的参数，不影响任务默认配置</p>
          </div>
        </div>
        <TaskRunParamOverrides v-if="task" :key="runSession" ref="paramOverridesRef" :task-id="task.id" />
      </section>
    </el-form>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { Calendar, Close, InfoFilled, MagicStick, Timer, VideoPlay } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import { VueDatePicker } from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"
import { FormDialog } from "@@/components/Dialogs"
import { TaskType, type RunParamOverride, type TaskItem } from "@/api/task/manager/type"
import CronHelper from "./CronHelper.vue"
import TaskRunParamOverrides from "./TaskRunParamOverrides.vue"

type RunMode = "now" | "reset"
type ResetMode = "datetime" | "helper"
export interface TaskRunSubmitPayload {
  id: number
  cron_expr?: string
  param_overrides?: Record<string, RunParamOverride>
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
const dialogTitle = computed(() => (props.task?.name ? `启动任务 · ${props.task.name}` : "启动任务"))

const formRef = ref<FormInstance>()
const submitting = ref(false)
const runSession = ref(0)
const paramOverridesRef = ref<InstanceType<typeof TaskRunParamOverrides>>()
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
  { value: "now", title: "立即运行", icon: VideoPlay },
  { value: "reset", title: "重置触发时间", icon: Timer }
] as const
const resetModeOptions: Array<{ label: string; value: ResetMode }> = [
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
          { required: true, message: "请选择任务触发时间", trigger: "change" },
          {
            validator: (_rule, value, callback) => {
              if (Number(value) <= Date.now()) {
                callback(new Error("该时间已过，请选择当前时间之后的时间"))
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
  const overrides = paramOverridesRef.value?.collect()
  if (overrides === undefined) return
  if (Object.keys(overrides).length) payload.param_overrides = overrides

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

watch(visible, async (value) => {
  if (!value) {
    paramOverridesRef.value?.clear()
    return
  }
  form.mode = "now"
  runSession.value++
  form.resetMode = "datetime"
  form.runAt = undefined
  form.cronExpr = ""
  formRef.value?.clearValidate()
})
</script>

<style scoped lang="scss">
.run-task-form {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  max-height: calc(80vh - 190px);
}

.execution-panel {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  background: #f8fafc;
  border: 1px solid #e5eaf1;
  border-radius: 7px;
}

.execution-header {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 7px 5px 11px;
}

.execution-title {
  display: flex;
  min-width: 0;
  strong {
    color: #1e293b;
    font-size: 13px;
    font-weight: 700;
  }
}

.mode-selector {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.mode-option {
  display: inline-flex;
  min-width: 0;
  height: 28px;
  align-items: center;
  padding: 0 10px;
  color: #475569;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    color: #2563eb;
    background: #ffffff;
  }

  &.active {
    color: #1d4ed8;
    background: #ffffff;
    border-color: #bfdbfe;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  }
}

.mode-option-title {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.cron-result code {
  overflow: hidden;
  color: #64748b;
  font-family: "Fira Code", Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parameter-section {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.section-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    color: #1f2937;
    font-size: 13px;
    font-weight: 700;
    line-height: 20px;
  }

  p {
    margin: 1px 0 0;
    color: #94a3b8;
    font-size: 11px;
    line-height: 16px;
  }
}

.schedule-config {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 9px 11px 10px;
  background: #fafbfc;
  border-top: 1px solid #edf1f5;
}

.schedule-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
  }

  p {
    margin: 0;
    color: #94a3b8;
    font-size: 10px;
    line-height: 15px;
  }
}

.schedule-config-body {
  --trigger-control-height: 34px;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.parameter-section {
  flex: 0 1 auto;
  max-height: min(420px, calc(80vh - 300px));
  overflow: hidden;
}

.reset-mode-switcher {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: #eef2f6;
  border-radius: 6px;
}

.reset-mode-option {
  height: 25px;
  box-sizing: border-box;
  padding: 0 9px;
  color: #64748b;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  outline: none;

  &:hover {
    color: #334155;
  }

  &.active {
    color: #1d4ed8;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
  }
}

.compact-form-item {
  width: 100%;
  margin-bottom: 0;

  :deep(.el-form-item__content) {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
    line-height: normal;
  }

  :deep(.el-form-item__error) {
    position: static;
    padding: 5px 2px 0;
    color: #dc5a5a;
    font-size: 11px;
    line-height: 16px;
  }

  &.is-error {
    .schedule-field,
    .date-field {
      border-color: #f2aaaa;
      box-shadow: 0 0 0 2px rgba(220, 90, 90, 0.06);
    }
  }
}

.schedule-field,
.date-field {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--trigger-control-height);
  height: var(--trigger-control-height);
  max-height: var(--trigger-control-height);
  gap: 6px;
  padding: 0 8px;
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

.date-field {
  gap: 0;
  padding: 0;
  outline: none;
}

.date-trigger {
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  outline: none;
  cursor: pointer;
}

.date-field-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  line-height: calc(var(--trigger-control-height) - 2px);
  text-overflow: ellipsis;
  white-space: nowrap;

  &.placeholder {
    color: #a8abb2;
  }
}

.date-clear {
  display: inline-flex;
  width: 30px;
  height: calc(var(--trigger-control-height) - 2px);
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #94a3b8;
  background: transparent;
  border: 0;
  outline: none;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #64748b;
  }
}

.field-icon {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 14px;
}

.cron-input {
  flex: 1;
  min-width: 0;
  width: 100%;

  :deep(.el-input__wrapper) {
    min-height: calc(var(--trigger-control-height) - 2px);
    height: calc(var(--trigger-control-height) - 2px);
    max-height: calc(var(--trigger-control-height) - 2px);
    padding: 0;
    background: transparent;
    box-shadow: none !important;
  }

  :deep(.el-input__inner) {
    height: calc(var(--trigger-control-height) - 2px);
    line-height: calc(var(--trigger-control-height) - 2px);
    font-size: 12px;
  }
}

.run-datepicker {
  width: 100%;
  --dp-font-family: inherit;
  --dp-border-radius: 8px;
  --dp-primary-color: #3b82f6;
  --dp-primary-text-color: #ffffff;
  --dp-text-color: #334155;
  --dp-icon-color: #64748b;
  --dp-menu-border-color: #e2e8f0;
  --dp-cell-border-radius: 6px;
  --dp-action-button-height: 30px;
  --dp-action-row-padding: 10px;

  :deep(.dp__main) {
    width: 100%;
  }

  :deep(.dp__clear_icon) {
    display: none;
  }

  :deep(.dp--clear-btn) {
    display: none;
  }
}

:deep(.schedule-field .cron-helper-trigger) {
  height: 28px;
  padding-right: 2px;
  font-size: 12px;

  .el-icon {
    font-size: 14px;
  }
}

.schedule-note {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
}

.schedule-note {
  padding: 7px 10px;
  font-size: 11px;
}

.cron-result {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 0 2px;
  color: #94a3b8;
  font-size: 10px;

  code {
    min-width: 0;
    color: #64748b;
    font-size: 11px;
  }
}

:deep(.form-dialog-header .header-icon) {
  width: 42px;
  height: 42px;
  color: #ffffff;
  background: #2563eb;
  border-radius: 8px;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
}

:deep(.form-dialog-header .header-text h3) {
  max-width: 460px;
  overflow: hidden;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.form-dialog-header .header-text p) {
  font-size: 12px;
}

:deep(.form-dialog-footer .footer-actions .cancel-btn),
:deep(.form-dialog-footer .footer-actions .confirm-btn) {
  height: 34px;
  min-width: 82px;
  padding: 0 14px;
  border-radius: 6px;
  box-shadow: none;
  font-size: 12px;
  transform: none;
}

:deep(.form-dialog-footer .footer-actions .cancel-btn:hover),
:deep(.form-dialog-footer .footer-actions .confirm-btn:hover) {
  transform: none;
}

:deep(.form-dialog-footer .footer-actions .confirm-btn) {
  background: #2563eb;
  border: 1px solid #2563eb;
}

:deep(.form-dialog-footer .footer-actions .confirm-btn:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
  box-shadow: none;
}

@media (max-width: 680px) {
  .section-heading,
  .execution-header,
  .schedule-config-header {
    align-items: stretch;
    flex-direction: column;
  }

  .mode-selector {
    width: 100%;
  }

  .mode-option {
    flex: 1;
    justify-content: center;
  }

  .reset-mode-switcher {
    width: fit-content;
  }

  .reset-mode-option {
    flex: 1;
  }
}
</style>

<style lang="scss">
body .el-overlay-dialog:has(.run-task-form) {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

body .base-dialog--form:has(.run-task-form) {
  display: flex;
  max-height: 80vh;
  flex-direction: column;
  margin: 0;

  .el-dialog__header {
    margin: 0;
    padding: 0 0 16px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .el-dialog__headerbtn {
    top: 16px;
    right: 18px;
    width: 32px;
    height: 32px;
    border-radius: 8px;

    &:hover {
      background: #f1f5f9;
    }
  }

  .el-dialog__body {
    min-height: 0;
    overflow: hidden;
    padding: 16px 0;
  }

  .el-dialog__footer {
    padding: 12px 0 0;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
  }
}
</style>
