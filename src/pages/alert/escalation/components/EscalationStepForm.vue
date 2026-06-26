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
            <el-select v-model="modelValue.template_set_id" placeholder="请选择模板集" size="large" clearable>
              <el-option
                v-for="templateSet in templateSets"
                :key="templateSet.id"
                :label="templateSet.name"
                :value="templateSet.id"
              >
                <span>{{ templateSet.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ templateSet.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="channels" label="通知渠道" class="form-item">
            <div class="channels-grid">
              <div
                v-for="option in channelOptions"
                :key="option.value"
                class="channel-option-card"
                :class="{ active: modelValue.channels.includes(option.value) }"
                @click="toggleChannel(option.value)"
              >
                <el-checkbox
                  :model-value="modelValue.channels.includes(option.value)"
                  @change="toggleChannel(option.value)"
                  @click.stop
                />
                <div class="channel-info">
                  <div class="channel-name">{{ option.label }}</div>
                  <div class="channel-desc">{{ option.description }}</div>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="receivers" label="接收者" class="form-item">
            <div class="receivers-section">
              <div class="receivers-actions">
                <el-button type="primary" :icon="Plus" @click="addReceiver">添加接收者</el-button>
                <el-button
                  type="danger"
                  :icon="Delete"
                  :disabled="selectedReceivers.length === 0"
                  @click="batchDeleteReceivers"
                >
                  批量删除 ({{ selectedReceivers.length }})
                </el-button>
                <el-button
                  type="warning"
                  :icon="Delete"
                  :disabled="modelValue.receivers.length === 0"
                  @click="clearAllReceivers"
                >
                  清空所有
                </el-button>
              </div>
              <DataTable
                :data="modelValue.receivers"
                :columns="receiverColumns"
                :pagination="false"
                :selection="true"
                :show-selection="true"
                :action-column-width="120"
                class="receivers-table"
                @selection-change="handleReceiverSelectionChange"
              >
                <template #receiverType="{ row }">
                  <el-tag :type="getReceiverTypeTagType(row.type)" size="small">
                    {{ getReceiverTypeLabel(row.type) }}
                  </el-tag>
                </template>
                <template #actions="{ index }">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    title="删除"
                    @click.stop="removeReceiver(index)"
                  />
                </template>
              </DataTable>
            </div>
          </el-form-item>
        </div>
      </div>

      <!-- 步骤配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>步骤配置</span>
        </div>

        <!-- 时间配置卡片 -->
        <div class="config-card">
          <div class="card-header">
            <el-icon class="card-icon"><Clock /></el-icon>
            <span class="card-title">时间配置</span>
          </div>
          <div class="card-content">
            <div class="input-grid">
              <div class="input-item">
                <label class="input-label">延迟时间（分钟）</label>
                <el-input-number v-model="modelValue.delay" :min="0" :max="1440" size="large" class="input-field" />
              </div>
              <div class="input-item">
                <label class="input-label">最大重试次数</label>
                <el-input-number v-model="modelValue.max_retries" :min="0" :max="10" size="large" class="input-field" />
              </div>
              <div class="input-item">
                <label class="input-label">重试间隔（秒）</label>
                <el-input-number
                  v-model="modelValue.retry_interval"
                  :min="1"
                  :max="3600"
                  size="large"
                  class="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 行为配置卡片 -->
        <div class="config-card">
          <div class="card-header">
            <el-icon class="card-icon"><Operation /></el-icon>
            <span class="card-title">行为配置</span>
          </div>
          <div class="card-content">
            <div class="checkbox-group">
              <div class="checkbox-item" @click="toggleSkipIfHandled">
                <div class="checkbox-icon" :class="{ checked: modelValue.skip_if_handled }">
                  <el-icon v-if="modelValue.skip_if_handled"><Check /></el-icon>
                </div>
                <div class="checkbox-content">
                  <span class="checkbox-label">跳过已处理</span>
                  <span class="checkbox-desc">如果该步骤已被处理，则跳过执行</span>
                </div>
              </div>
              <div class="checkbox-item" @click="toggleContinueOnFail">
                <div class="checkbox-icon" :class="{ checked: modelValue.continue_on_fail }">
                  <el-icon v-if="modelValue.continue_on_fail"><Check /></el-icon>
                </div>
                <div class="checkbox-content">
                  <span class="checkbox-label">失败继续</span>
                  <span class="checkbox-desc">即使当前步骤失败，也继续执行后续步骤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 条件配置卡片 -->
        <div class="config-card">
          <div class="card-header">
            <el-icon class="card-icon"><Filter /></el-icon>
            <span class="card-title">条件配置</span>
          </div>
          <div class="card-content">
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
        </div>
      </div>
    </el-form>

    <FormDialog
      v-model="receiverDialogVisible"
      title="添加接收者"
      width="60%"
      :confirm-loading="receiverSubmitLoading"
      @confirm="saveReceiver"
      @cancel="handleReceiverDialogClose"
    >
      <ReceiverSelector
        ref="receiverSelectorRef"
        v-model="receiverDraft"
        :default-receiver-type="defaultReceiverType"
        @confirm="handleReceiverConfirm"
        @cancel="handleReceiverDialogClose"
      />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Setting, Check, Clock, Operation, Filter, Plus, Delete } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { CreateStepReq, ReceiverRef } from "@/api/alert/escalation/types"
import { RECEIVER_TYPES } from "@/api/alert/escalation/types"
import type { ChannelType } from "@/api/alert/template/types"
import { listTemplateSetsApi } from "@/api/alert/template_set"
import type { TemplateSet } from "@/api/alert/template_set/types"
import { getChannelOptions } from "../../template/config/channels"
import { getReceiverTypeLabel, getReceiverTypeTagType } from "../utils"
import { escalationStepFormRules } from "../config/validation"
import ReceiverSelector from "./ReceiverSelector.vue"
import DataTable from "@@/components/DataTable/index.vue"
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import type { Column } from "@@/components/DataTable/types"

const modelValue = defineModel<CreateStepReq>({ required: true })

const formRef = ref<FormInstance>()

const templateSets = ref<TemplateSet[]>([])
const channelOptions = getChannelOptions()
const receiverDialogVisible = ref(false)
const receiverSubmitLoading = ref(false)
const receiverSelectorRef = ref<InstanceType<typeof ReceiverSelector>>()
const defaultReceiverType = ref(RECEIVER_TYPES.USER)
const receiverDraft = ref<ReceiverRef[]>([])
const selectedReceivers = ref<ReceiverRef[]>([])

const receiverColumns: Column[] = [
  {
    prop: "type",
    label: "类型",
    width: 120,
    slot: "receiverType"
  },
  {
    prop: "display_name",
    label: "名称",
    minWidth: 180
  }
]

// 使用导入的验证规则
const formRules = escalationStepFormRules

// 加载模板集数据
const loadTemplateSets = async () => {
  try {
    const response = await listTemplateSetsApi({
      offset: 0,
      limit: 1000 // 获取所有模板集
    })
    templateSets.value = response.data.template_sets || []
  } catch (error) {
    console.error("加载模板集失败:", error)
  }
}

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

// 切换函数
const toggleSkipIfHandled = () => {
  modelValue.value.skip_if_handled = !modelValue.value.skip_if_handled
}

const toggleContinueOnFail = () => {
  modelValue.value.continue_on_fail = !modelValue.value.continue_on_fail
}

const addReceiver = () => {
  receiverDraft.value = [...modelValue.value.receivers]
  defaultReceiverType.value = RECEIVER_TYPES.USER
  receiverDialogVisible.value = true
}

const handleReceiverSelectionChange = (selection: ReceiverRef[]) => {
  selectedReceivers.value = selection
}

const batchDeleteReceivers = () => {
  if (selectedReceivers.value.length === 0) return

  modelValue.value.receivers = modelValue.value.receivers.filter(
    (receiver) =>
      !selectedReceivers.value.some((selected) => selected.id === receiver.id && selected.type === receiver.type)
  )
  selectedReceivers.value = []
}

const clearAllReceivers = () => {
  modelValue.value.receivers = []
  selectedReceivers.value = []
}

const removeReceiver = (index: number) => {
  const receivers = [...modelValue.value.receivers]
  receivers.splice(index, 1)
  modelValue.value.receivers = receivers
}

const handleReceiverConfirm = (receivers: ReceiverRef[]) => {
  receiverDraft.value = receivers
  saveReceiver()
}

const saveReceiver = () => {
  receiverSubmitLoading.value = true
  try {
    modelValue.value.receivers = [...receiverDraft.value]
    receiverDialogVisible.value = false
  } finally {
    receiverSubmitLoading.value = false
  }
}

const handleReceiverDialogClose = () => {
  receiverDialogVisible.value = false
  receiverDraft.value = []
}

// 组件挂载时加载数据
onMounted(() => {
  loadTemplateSets()
})

// 暴露表单验证方法和数据加载方法
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

  .config-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: #d1d5db;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e5e7eb;

    .card-icon {
      margin-right: 8px;
      font-size: 16px;
      color: #3b82f6;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .card-content {
    padding: 20px;
  }

  .input-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .input-item {
    display: flex;
    flex-direction: column;
  }

  .input-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .input-field {
    width: 100%;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .checkbox-item {
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    user-select: none;
    padding: 12px;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: #f8fafc;
    }
  }

  .checkbox-icon {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-right: 12px;
    margin-top: 2px;

    &.checked {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .el-icon {
      font-size: 12px;
      font-weight: bold;
    }
  }

  .checkbox-content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .checkbox-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
  }

  .checkbox-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  }

  .textarea-item {
    display: flex;
    flex-direction: column;
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

  .channels-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
  }

  .channel-option-card {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover,
    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .channel-info {
      min-width: 0;
    }

    .channel-name {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }

    .channel-desc {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }
  }

  .receivers-section {
    width: 100%;
  }

  .receivers-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .receivers-table {
    width: 100%;
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
  }
}
</style>
