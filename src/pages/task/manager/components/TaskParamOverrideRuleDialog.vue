<template>
  <FormDialog
    v-model="visible"
    title="启动参数约束"
    :subtitle="`配置 ${parameter?.desc || parameter?.key || '当前参数'} 在手动启动时的输入方式`"
    width="600px"
    :header-icon="Operation"
    confirm-text="保存配置"
    :show-footer-info="false"
    class="param-rule-dialog"
    @confirm="save"
    @cancel="visible = false"
  >
    <div class="rule-content">
      <div class="parameter-context">
        <span class="context-label">当前参数</span>
        <strong>{{ parameter?.desc || parameter?.key }}</strong>
        <code>{{ parameter?.key }}</code>
      </div>

      <section class="input-settings">
        <div class="setting-item">
          <span class="setting-label">允许方式</span>
          <el-checkbox-group v-model="draft.allowed_modes" class="setting-control">
            <el-checkbox v-for="mode in allModeOptions" :key="mode.value" :value="mode.value">
              {{ mode.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div v-if="draft.allowed_modes.includes('SELECT')" class="setting-item multiple-setting">
          <div class="setting-title">
            <span>允许多选</span>
            <el-tooltip content="开启后可选择多个预设值，提交时使用逗号连接" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch v-model="draft.multiple" inline-prompt active-text="是" inactive-text="否" />
        </div>
      </section>

      <section v-if="draft.allowed_modes.includes('SELECT')" class="option-section">
        <div class="option-heading">
          <div>
            <h4>预设选项</h4>
            <p>填写用户看到的名称，以及任务实际收到的值</p>
          </div>
          <el-button :icon="Plus" plain @click="addOption">添加选项</el-button>
        </div>

        <div class="option-editor">
          <div class="option-table-header">
            <span>显示名称</span>
            <span>提交值</span>
            <span />
          </div>
          <div v-if="draft.options.length" class="option-list">
            <div v-for="(option, index) in draft.options" :key="index" class="option-row">
              <el-input v-model="option.label" placeholder="例如：全部主机" />
              <el-input v-model="option.value" placeholder="例如：all" />
              <el-tooltip content="删除选项" placement="top">
                <el-button
                  :icon="Delete"
                  circle
                  text
                  class="delete-option"
                  aria-label="删除选项"
                  @click="draft.options.splice(index, 1)"
                />
              </el-tooltip>
            </div>
          </div>
          <div v-else class="option-empty">
            <span>还没有预设选项</span>
            <el-button :icon="Plus" type="primary" text @click="addOption">添加第一个选项</el-button>
          </div>
        </div>
      </section>

      <div v-else class="manual-only-state">
        <span>当前仅允许手动填写</span>
        <small>启用“预设选择”后，可在这里维护名称和提交值。</small>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue"
import { Delete, Operation, Plus, QuestionFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import type { Parameter } from "@/api/task/resource/type"
import type { TaskParamInputMode, TaskParamOverrideRule, TaskParamOption } from "@/api/task/manager/type"

const props = defineProps<{ parameter?: Parameter; rule?: TaskParamOverrideRule }>()
const emit = defineEmits<{ save: [rule: TaskParamOverrideRule] }>()
const visible = defineModel<boolean>({ required: true })

interface RuleDraft {
  allowed_modes: TaskParamInputMode[]
  multiple: boolean
  options: TaskParamOption[]
}

const draft = reactive<RuleDraft>({
  allowed_modes: ["MANUAL"],
  multiple: false,
  options: []
})

const allModeOptions: Array<{
  label: string
  value: TaskParamInputMode
}> = [
  { label: "手动填写", value: "MANUAL" },
  { label: "预设选择", value: "SELECT" }
]

const resetDraft = () => {
  const rule = props.rule
  draft.allowed_modes = [...(rule?.allowed_modes ?? ["MANUAL"])]
  draft.multiple = rule?.select_config?.multiple ?? false
  draft.options = (rule?.select_config?.options ?? []).map((option) => ({ ...option }))
}

watch(visible, (value) => value && resetDraft())

const addOption = () => draft.options.push({ label: "", value: "" })

const save = () => {
  if (!props.parameter) return
  if (!draft.allowed_modes.length) {
    ElMessage.warning("请至少选择一种输入方式")
    return
  }
  const options = draft.options.map((option) => ({ label: option.label.trim(), value: option.value.trim() }))
  if (draft.allowed_modes.includes("SELECT")) {
    if (!options.length || options.some((option) => !option.label || !option.value)) {
      ElMessage.warning("请完整填写预设选项")
      return
    }
    if (options.some((option) => option.value.includes(","))) {
      ElMessage.warning("选项提交值不能包含逗号")
      return
    }
    if (new Set(options.map((option) => option.value)).size !== options.length) {
      ElMessage.warning("选项提交值不能重复")
      return
    }
  }
  emit("save", {
    param_key: props.parameter.key,
    allowed_modes: [...draft.allowed_modes],
    default_mode: draft.allowed_modes.includes("SELECT") ? "SELECT" : "MANUAL",
    select_config: draft.allowed_modes.includes("SELECT") ? { multiple: draft.multiple, options } : undefined
  })
  visible.value = false
}
</script>

<style scoped lang="scss">
.rule-content {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  max-height: calc(80vh - 190px);
  overflow: hidden;
}

.parameter-context {
  display: flex;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  code {
    min-width: 0;
    overflow: hidden;
    color: #475569;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #1e293b;
    font-size: 12px;
  }
}

.context-label {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 11px;
}

.input-settings {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.setting-item {
  display: flex;
  min-height: 64px;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 11px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  &:hover {
    border-color: #cbd5e1;
  }
}

.setting-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 20px;
}

.multiple-setting {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .setting-title {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }
}

.help-icon {
  flex: 0 0 auto;
  color: #94a3b8;
  cursor: help;
  font-size: 15px;
}

.option-section {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 8px;
  max-height: min(420px, calc(80vh - 320px));
}

.option-heading {
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

.option-editor {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe6ee;
  border-radius: 8px;
}

.option-table-header,
.option-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: center;
}

.option-table-header {
  padding: 7px 10px;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e7edf3;
  font-size: 11px;
  font-weight: 700;
}

.option-list {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.option-row {
  flex: 0 0 auto;
  padding: 7px 10px;

  & + & {
    border-top: 1px solid #edf1f5;
  }
}

.option-empty {
  display: flex;
  min-height: 72px;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 18px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.delete-option {
  color: #94a3b8;

  &:hover {
    color: #dc2626;
    background: #fef2f2;
  }
}

.manual-only-state {
  display: flex;
  min-height: 88px;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #d8e0eb;
  border-radius: 8px;
  font-size: 12px;

  small {
    color: #94a3b8;
    font-size: 11px;
  }
}

:deep(.el-checkbox),
:deep(.el-radio) {
  height: 20px;
  margin-right: 0;
  color: #334155;
  font-size: 12px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dbe3ec inset;
}

:deep(.form-dialog-header .header-icon) {
  color: #ffffff;
  background: #2563eb;
  border-radius: 8px;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
}

:deep(.form-dialog-header .header-text h3) {
  color: #111827;
  font-weight: 700;
}

:deep(.form-dialog-footer .footer-actions .cancel-btn),
:deep(.form-dialog-footer .footer-actions .confirm-btn) {
  height: 38px;
  min-width: 92px;
  border-radius: 6px;
  box-shadow: none;
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

@media (max-width: 640px) {
  .option-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .input-settings {
    grid-template-columns: 1fr;
  }

  .option-table-header {
    display: none;
  }

  .option-row {
    grid-template-columns: minmax(0, 1fr) 30px;

    :deep(.el-input:nth-child(2)) {
      grid-column: 1;
    }

    .delete-option {
      grid-row: 1 / span 2;
      grid-column: 2;
    }
  }
}
</style>

<style lang="scss">
body .el-overlay-dialog:has(.rule-content) {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

body .base-dialog--form:has(.rule-content) {
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
