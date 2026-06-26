<template>
  <div class="step-form-container">
    <el-form
      ref="formRef"
      label-position="top"
      :model="modelValue"
      :rules="formRules"
      label-width="auto"
      class="step-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="template_set_id" label="模板集" class="form-item">
            <TemplateSetPicker v-model="modelValue.template_set_id" placeholder="请选择模板集" variant="element" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="channels" label="通知渠道" class="form-item">
            <div class="channel-inline-options">
              <div
                v-for="option in channelOptions"
                :key="option.value"
                class="channel-chip"
                :class="{ active: modelValue.channels.includes(option.value) }"
                @click="toggleChannel(option.value)"
              >
                <img :src="getChannelIcon(option.value)" class="channel-icon-img" :alt="option.label" />
                <span>{{ option.label }}</span>
              </div>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="receivers" label="接收者" class="form-item">
            <div class="strategy-workbench">
              <div class="user-input-wrapper">
                <el-input
                  :value="receiverSummary"
                  placeholder="尚未配置接收者策略"
                  class="modern-input with-action"
                  readonly
                />
                <el-button :icon="Setting" class="action-btn" @click="openReceiverSelector()"> 配置策略 </el-button>
              </div>

              <div v-if="receiverStrategyPreview.length > 0" class="strategy-shelf scroll-slim">
                <div
                  v-for="strategy in receiverStrategyPreview"
                  :key="strategy.rule"
                  class="shelf-item"
                  @click="openReceiverSelector(strategy.rule)"
                >
                  <div class="item-tag" :class="strategy.rule">{{ strategy.label }}</div>
                  <div class="item-val">{{ strategy.text }}</div>
                  <el-button link :icon="Close" class="item-del" @click.stop="removeReceiverStrategy(strategy.rule)" />
                </div>
              </div>
            </div>
          </el-form-item>
        </div>
      </div>

      <!-- 时间配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>时间配置</span>
        </div>

        <div class="time-config-row">
          <div class="time-config-item">
            <div class="time-config-header">
              <span class="time-config-label">延迟时间</span>
              <span class="time-config-unit">min</span>
            </div>
            <div class="time-stepper">
              <el-button
                :icon="Minus"
                class="time-stepper-btn"
                :disabled="modelValue.delay <= 0"
                @click="adjustNumber('delay', -1, 0, 1440)"
              />
              <el-input-number
                v-model="modelValue.delay"
                :min="0"
                :max="1440"
                :controls="false"
                class="time-stepper-input"
              />
              <el-button
                :icon="Plus"
                class="time-stepper-btn"
                :disabled="modelValue.delay >= 1440"
                @click="adjustNumber('delay', 1, 0, 1440)"
              />
            </div>
          </div>
          <div class="time-config-item">
            <div class="time-config-header">
              <span class="time-config-label">最大重试</span>
              <span class="time-config-unit">times</span>
            </div>
            <div class="time-stepper">
              <el-button
                :icon="Minus"
                class="time-stepper-btn"
                :disabled="modelValue.max_retries <= 0"
                @click="adjustNumber('max_retries', -1, 0, 10)"
              />
              <el-input-number
                v-model="modelValue.max_retries"
                :min="0"
                :max="10"
                :controls="false"
                class="time-stepper-input"
              />
              <el-button
                :icon="Plus"
                class="time-stepper-btn"
                :disabled="modelValue.max_retries >= 10"
                @click="adjustNumber('max_retries', 1, 0, 10)"
              />
            </div>
          </div>
          <div class="time-config-item">
            <div class="time-config-header">
              <span class="time-config-label">重试间隔</span>
              <span class="time-config-unit">sec</span>
            </div>
            <div class="time-stepper">
              <el-button
                :icon="Minus"
                class="time-stepper-btn"
                :disabled="modelValue.retry_interval <= 1"
                @click="adjustNumber('retry_interval', -1, 1, 3600)"
              />
              <el-input-number
                v-model="modelValue.retry_interval"
                :min="1"
                :max="3600"
                :controls="false"
                class="time-stepper-input"
              />
              <el-button
                :icon="Plus"
                class="time-stepper-btn"
                :disabled="modelValue.retry_interval >= 3600"
                @click="adjustNumber('retry_interval', 1, 1, 3600)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 行为配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Operation /></el-icon>
          <span>行为配置</span>
        </div>

        <div class="switch-cards">
          <div class="switch-card" @click="toggleSkipIfHandled">
            <div class="switch-card-label">
              <span>跳过已处理</span>
              <el-tooltip content="已处理时不再执行当前步骤" placement="top">
                <el-icon class="help-icon" @click.stop><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-switch
              :model-value="modelValue.skip_if_handled"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @click.stop
              @change="toggleSkipIfHandled"
            />
          </div>
          <div class="switch-card" @click="toggleContinueOnFail">
            <div class="switch-card-label">
              <span>失败继续</span>
              <el-tooltip content="失败后继续执行后续步骤" placement="top">
                <el-icon class="help-icon" @click.stop><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-switch
              :model-value="modelValue.continue_on_fail"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @click.stop
              @change="toggleContinueOnFail"
            />
          </div>
        </div>
      </div>

      <!-- 条件配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>条件配置</span>
        </div>

        <div class="textarea-item">
          <label class="input-label">条件表达式</label>
          <el-input
            v-model="modelValue.condition_expr"
            type="textarea"
            :rows="4"
            placeholder="如: alert.severity >= 3"
            maxlength="500"
            show-word-limit
            class="textarea-field"
          />
        </div>
      </div>
    </el-form>

    <CommonReceiverSelector
      v-model:visible="receiverDialogVisible"
      title="配置接收者"
      result-panel-title="已选接收者"
      empty-text="暂无接收者"
      :initial-assignees="receiverAssignees"
      :initial-tab="selectedReceiverTab"
      :modes="['user', 'team', 'department', 'on_call']"
      :rule-options="receiverRuleOptions"
      :username-to-display-name="receiverDisplayNames"
      user-value-key="id"
      @confirm="handleReceiverConfirm"
      @update-user-names="handleReceiverDisplayNameUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Setting, Clock, Operation, Filter, Close, QuestionFilled, Minus, Plus } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { CreateStepReq, ReceiverRef } from "@/api/alert/escalation/types"
import { RECEIVER_TYPES } from "@/api/alert/escalation/types"
import type { ChannelType } from "@/api/alert/template/types"
import { getChannelIcon, getChannelOptions } from "../../template/config/channels"
import { getReceiverTypeLabel } from "../utils"
import { escalationStepFormRules } from "../config/validation"
import TemplateSetPicker from "@@/components/Pickers/TemplateSetPicker/index.vue"
import CommonReceiverSelector from "@@/components/ReceiverSelector/index.vue"
import type { Assignee } from "@@/components/ReceiverSelector/composables/useAssignees"

const modelValue = defineModel<CreateStepReq>({ required: true })

const formRef = ref<FormInstance>()

const channelOptions = getChannelOptions()
const receiverDialogVisible = ref(false)
const selectedReceiverTab = ref("user")
const receiverDisplayNames = ref<Record<string, string>>({})

const receiverRuleOptions = [
  { label: "用户", value: "appoint" },
  { label: "团队", value: "team" },
  { label: "部门", value: "department" },
  { label: "排班", value: "on_call" }
]

// 使用导入的验证规则
const formRules = escalationStepFormRules

const receiverSummary = computed(() =>
  receiverAssignees.value.length ? `已配置 ${receiverAssignees.value.length} 条策略` : ""
)

const receiverAssignees = computed<Assignee[]>(() => {
  const groups: Record<string, string[]> = {
    appoint: [],
    team: [],
    department: [],
    on_call: []
  }

  modelValue.value.receivers.forEach((receiver) => {
    const rule = receiverTypeToRule(receiver.type)
    if (!rule) return
    groups[rule].push(String(receiver.id))
    receiverDisplayNames.value[String(receiver.id)] = receiver.display_name
  })

  return Object.entries(groups)
    .filter(([, values]) => values.length > 0)
    .map(([rule, values]) => ({ rule, values }))
})

const receiverStrategyPreview = computed(() =>
  receiverAssignees.value.map((assignee) => ({
    rule: assignee.rule,
    label: getReceiverRuleLabel(assignee.rule),
    text: assignee.values.map((value) => receiverDisplayNames.value[String(value)] || value).join("、")
  }))
)

const toggleChannel = (channelValue: ChannelType) => {
  const channels = [...modelValue.value.channels]
  const index = channels.indexOf(channelValue)
  if (index > -1) {
    channels.splice(index, 1)
  } else {
    channels.push(channelValue)
  }
  modelValue.value.channels = channels
}

const receiverTypeToRule = (type: string) => {
  const map: Record<string, string> = {
    [RECEIVER_TYPES.USER]: "appoint",
    [RECEIVER_TYPES.TEAM]: "team",
    [RECEIVER_TYPES.DEPARTMENT]: "department",
    [RECEIVER_TYPES.ONCALL]: "on_call"
  }
  return map[type] || ""
}

const receiverRuleToType = (rule: string) => {
  const map: Record<string, ReceiverRef["type"]> = {
    appoint: RECEIVER_TYPES.USER,
    team: RECEIVER_TYPES.TEAM,
    department: RECEIVER_TYPES.DEPARTMENT,
    on_call: RECEIVER_TYPES.ONCALL
  }
  return map[rule]
}

const getReceiverRuleLabel = (rule: string) => {
  return receiverRuleOptions.find((option) => option.value === rule)?.label || rule
}

const getReceiverRuleTab = (rule: string) => {
  const map: Record<string, string> = {
    appoint: "user",
    team: "team",
    department: "department",
    on_call: "on_call"
  }
  return map[rule] || "user"
}

const adjustNumber = (field: "delay" | "max_retries" | "retry_interval", delta: number, min: number, max: number) => {
  const current = Number(modelValue.value[field] ?? min)
  modelValue.value[field] = Math.min(max, Math.max(min, current + delta))
}

// 切换函数
const toggleSkipIfHandled = () => {
  modelValue.value.skip_if_handled = !modelValue.value.skip_if_handled
}

const toggleContinueOnFail = () => {
  modelValue.value.continue_on_fail = !modelValue.value.continue_on_fail
}

const openReceiverSelector = (rule?: string) => {
  selectedReceiverTab.value = rule ? getReceiverRuleTab(rule) : "user"
  receiverDialogVisible.value = true
}

const removeReceiverStrategy = (rule: string) => {
  const type = receiverRuleToType(rule)
  if (!type) return
  modelValue.value.receivers = modelValue.value.receivers.filter((receiver) => receiver.type !== type)
}

const handleReceiverDisplayNameUpdate = (names: Record<string, string>) => {
  receiverDisplayNames.value = {
    ...receiverDisplayNames.value,
    ...names
  }
}

const handleReceiverConfirm = (assignees: Assignee[]) => {
  const receivers: ReceiverRef[] = []
  assignees.forEach((assignee) => {
    const type = receiverRuleToType(assignee.rule)
    if (!type) return

    assignee.values.forEach((value) => {
      receivers.push({
        id: Number(value),
        type,
        display_name: receiverDisplayNames.value[String(value)] || `${getReceiverTypeLabel(type)} #${value}`,
        metadata: {}
      })
    })
  })
  modelValue.value.receivers = receivers
}

// 暴露表单验证方法
defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields()
})
</script>

<style lang="scss" scoped>
.step-form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.step-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

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

  .form-row {
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .time-config-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .time-config-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 14px 16px;
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease;

    & + .time-config-item {
      border-left: 1px solid #e2e8f0;
    }

    &:hover {
      background: #f8fbff;
      box-shadow: inset 0 0 0 1px #bfdbfe;
    }
  }

  .time-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .time-config-label {
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  .time-config-unit {
    flex-shrink: 0;
    padding: 2px 6px;
    color: #64748b;
    background: #f1f5f9;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
  }

  .time-stepper {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) 30px;
    align-items: center;
    height: 34px;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
  }

  .time-stepper-btn {
    width: 30px;
    height: 32px;
    padding: 0;
    color: #64748b;
    background: transparent;
    border: 0;
    border-radius: 0;

    &:hover:not(.is-disabled) {
      color: #2563eb;
      background: #eff6ff;
    }
  }

  :deep(.el-input-number.time-stepper-input) {
    width: 100%;

    .el-input__wrapper {
      background: transparent;
      border: 0;
      border-right: 1px solid #dbe3ef;
      border-left: 1px solid #dbe3ef;
      border-radius: 0;
      box-shadow: none;
      padding: 0 4px;
    }

    .el-input__inner {
      color: #334155;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
    }
  }

  .input-label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .switch-cards {
    display: flex;
    gap: 12px;
  }

  .switch-card {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 58px;
    padding: 14px 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #bfdbfe;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
  }

  .switch-card-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    span {
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
    }
  }

  .help-icon {
    color: #94a3b8;
    cursor: help;
    font-size: 14px;
  }

  .textarea-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .textarea-field {
    width: 100%;
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-textarea__inner) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-input-number) {
      .el-input__wrapper {
        border-radius: 6px;
        border: 1px solid #d1d5db;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;

        &:hover {
          border-color: #9ca3af;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }
    }

    :deep(.el-switch) {
      .el-switch__core {
        border-radius: 20px;
        transition: all 0.2s ease;
      }
    }
  }

  .channel-inline-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
  }

  .channel-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    white-space: nowrap;

    &:hover,
    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    &.active {
      color: #1d4ed8;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .channel-icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      flex-shrink: 0;
    }

    span {
      font-size: 13px;
      font-weight: 600;
    }
  }

  .modern-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px;
      box-shadow: none !important;
      padding: 2px 10px;
    }
  }

  .strategy-workbench {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .user-input-wrapper {
    display: flex;
    height: 40px;

    .modern-input.with-action {
      flex: 1;

      :deep(.el-input__wrapper) {
        border-right: none !important;
        border-radius: 8px 0 0 8px !important;
      }
    }

    .action-btn {
      height: 100%;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: none;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      font-weight: 700;

      &:hover:not(:disabled) {
        color: #6366f1;
        background: #f1f5f9;
      }
    }
  }

  .strategy-shelf {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 220px;
    padding: 8px;
    overflow-y: auto;
    background: #fbfcfe;
    border: 1px solid #f1f5f9;
    border-radius: 10px;
  }

  .shelf-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid #eef2f6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transform: translateY(-1px);
    }
  }

  .item-tag {
    flex-shrink: 0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;

    &.appoint {
      color: #2563eb;
      background: #eff6ff;
    }

    &.department {
      color: #dc2626;
      background: #fef2f2;
    }

    &.team {
      color: #ea580c;
      background: #fff7ed;
    }

    &.on_call {
      color: #9333ea;
      background: #faf5ff;
    }
  }

  .item-val {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-del {
    flex-shrink: 0;
    color: #cbd5e1;

    &:hover {
      color: #ef4444;
    }
  }

  .scroll-slim {
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
  }
}

// 按钮样式优化
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.el-button--primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  &.el-button--large {
    padding: 12px 24px;
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .step-form-container {
    padding: 16px;
  }

  .step-form {
    .form-section {
      margin-bottom: 20px;
    }

    .section-title {
      padding: 8px 12px;
      margin-bottom: 12px;

      .section-icon {
        font-size: 14px;
      }

      span {
        font-size: 13px;
      }
    }

    .form-row {
      margin-bottom: 12px;
    }

    .time-config-row {
      grid-template-columns: 1fr;
    }

    .time-config-item + .time-config-item {
      border-top: 1px solid #e2e8f0;
      border-left: 0;
    }

    .switch-cards {
      flex-direction: column;
    }

    .channel-inline-options {
      grid-template-columns: 1fr;
    }

    .user-input-wrapper {
      height: auto;
      align-items: stretch;
      flex-direction: column;
    }

    .user-input-wrapper .modern-input.with-action {
      :deep(.el-input__wrapper) {
        border-right: 1px solid #cbd5e1 !important;
        border-radius: 8px 8px 0 0 !important;
      }
    }

    .user-input-wrapper .action-btn {
      height: 38px;
      border: 1px solid #cbd5e1;
      border-top: 1px solid #e2e8f0;
      border-radius: 0 0 8px 8px;
    }
  }
}
</style>
