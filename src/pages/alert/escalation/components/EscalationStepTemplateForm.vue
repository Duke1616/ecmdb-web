<template>
  <div class="template-form-container">
    <el-form
      ref="formRef"
      label-position="top"
      :model="modelValue"
      :rules="formRules"
      label-width="auto"
      class="template-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Document /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="模板名称" class="form-item">
            <el-input v-model="modelValue.name" placeholder="请输入模板名称" size="large" clearable />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="description" label="模板描述" class="form-item">
            <el-input
              v-model="modelValue.description"
              type="textarea"
              :rows="3"
              placeholder="请输入模板描述"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </div>
      </div>

      <!-- 通知渠道 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Bell /></el-icon>
          <span>通知渠道</span>
        </div>

        <div class="form-row">
          <el-form-item prop="channels" class="form-item">
            <div class="channels-section">
              <div class="channels-grid">
                <div
                  v-for="option in channelOptions"
                  :key="option.value"
                  class="channel-option-card"
                  :class="{ active: modelValue.channels.includes(option.value) }"
                  @click="toggleChannel(option.value)"
                >
                  <div class="channel-checkbox">
                    <el-checkbox
                      :model-value="modelValue.channels.includes(option.value)"
                      @change="toggleChannel(option.value)"
                      @click.stop
                    />
                  </div>
                  <div class="channel-info">
                    <div class="channel-name">{{ option.label }}</div>
                    <div class="channel-desc">{{ option.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>
      </div>

      <!-- 接收者 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><User /></el-icon>
          <span>接收者</span>
        </div>

        <div class="form-row">
          <el-form-item prop="receivers" class="form-item">
            <div class="receivers-section">
              <div class="receivers-header">
                <div class="receivers-actions">
                  <div class="left-actions">
                    <el-button type="primary" :icon="Plus" @click="addReceiver">添加接收者</el-button>
                  </div>
                  <div class="right-actions">
                    <el-button
                      type="danger"
                      :icon="Delete"
                      :disabled="tableSelectedReceivers.length === 0"
                      @click="batchDeleteReceivers"
                    >
                      批量删除 ({{ tableSelectedReceivers.length }})
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
                </div>
              </div>
              <div class="receivers-table-wrapper">
                <DataTable
                  :data="modelValue.receivers"
                  :columns="receiverColumns"
                  :pagination="false"
                  :selection="true"
                  :show-selection="true"
                  :action-column-width="150"
                  @selection-change="handleReceiverSelectionChange"
                  class="receivers-table"
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
                      @click.stop="removeReceiver(index)"
                      title="删除"
                    />
                  </template>
                </DataTable>
              </div>
            </div>
          </el-form-item>
        </div>
      </div>
    </el-form>

    <!-- 接收者编辑Dialog -->
    <FormDialog
      v-model="receiverDialogVisible"
      title="添加接收者"
      width="60%"
      :before-close="handleReceiverDialogClose"
      @confirm="saveReceiver"
      @cancel="handleReceiverDialogClose"
      :confirm-loading="receiverSubmitLoading"
    >
      <ReceiverSelector
        ref="receiverSelectorRef"
        v-model="selectedReceivers"
        :default-receiver-type="currentReceiverType"
        @confirm="handleReceiverConfirm"
        @cancel="handleReceiverDialogClose"
      />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Plus, Delete, Document, Bell, User } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import type { CreateStepTemplateReq, ReceiverRef } from "@/api/alert/escalation/types"
import { RECEIVER_TYPES } from "@/api/alert/escalation/types"
import { getChannelOptions } from "../../template/config/channels"
import { FORM_RULES } from "../config/constants"
import { getReceiverTypeLabel, getReceiverTypeTagType } from "../utils"
import ReceiverSelector from "./ReceiverSelector.vue"
import DataTable from "@@/components/DataTable/index.vue"
import FormDialog from "@@/components/Dialogs/Form/index.vue"

const modelValue = defineModel<CreateStepTemplateReq>({ required: true })
const formRef = ref<FormInstance>()

// 渠道选项
const channelOptions = getChannelOptions()

// 接收者编辑相关
const receiverDialogVisible = ref(false)
const receiverSubmitLoading = ref(false)
const receiverSelectorRef = ref<InstanceType<typeof ReceiverSelector>>()

// 接收者选择器相关
const currentReceiverType = ref(RECEIVER_TYPES.USER)
const selectedReceivers = ref<ReceiverRef[]>([])

// 表格选择相关
const tableSelectedReceivers = ref<ReceiverRef[]>([])

// 接收者表格列配置
const receiverColumns = [
  {
    prop: "type",
    label: "类型",
    width: 150,
    slot: "receiverType"
  },
  {
    prop: "display_name",
    label: "名称",
    minWidth: 200
  }
]

// 表单验证规则
const formRules: FormRules = FORM_RULES.template

// 切换渠道选择
const toggleChannel = (channelValue: string) => {
  const currentChannels = [...modelValue.value.channels]
  const index = currentChannels.indexOf(channelValue)
  if (index > -1) {
    // 如果已选中，则移除
    currentChannels.splice(index, 1)
  } else {
    // 如果未选中，则添加
    currentChannels.push(channelValue)
  }
  modelValue.value.channels = currentChannels
}

// 处理表格选择变化
const handleReceiverSelectionChange = (selection: ReceiverRef[]) => {
  tableSelectedReceivers.value = selection
}

// 批量删除接收者
const batchDeleteReceivers = () => {
  if (tableSelectedReceivers.value.length === 0) return

  // 从modelValue.receivers中移除选中的接收者
  const currentReceivers = [...modelValue.value.receivers]
  tableSelectedReceivers.value.forEach((selectedReceiver) => {
    const index = currentReceivers.findIndex(
      (receiver) => receiver.id === selectedReceiver.id && receiver.type === selectedReceiver.type
    )
    if (index > -1) {
      currentReceivers.splice(index, 1)
    }
  })

  modelValue.value.receivers = currentReceivers
  // 清空选择
  tableSelectedReceivers.value = []
}

// 清空所有接收者
const clearAllReceivers = () => {
  modelValue.value.receivers = []
  tableSelectedReceivers.value = []
}

// 处理接收者确认
const handleReceiverConfirm = (receivers: ReceiverRef[]) => {
  selectedReceivers.value = receivers
  saveReceiver()
}

// 添加接收者（支持新增和编辑模式）
const addReceiver = () => {
  // 填充已存在的接收者数据（如果有的话）
  selectedReceivers.value = [...modelValue.value.receivers]
  currentReceiverType.value = RECEIVER_TYPES.USER
  receiverDialogVisible.value = true
}

// 移除接收者
const removeReceiver = (index: number) => {
  const currentReceivers = [...modelValue.value.receivers]
  currentReceivers.splice(index, 1)
  modelValue.value.receivers = currentReceivers
}

// 保存接收者
const saveReceiver = () => {
  receiverSubmitLoading.value = true

  // 替换所有接收者（支持添加和编辑模式）
  modelValue.value.receivers = [...selectedReceivers.value]

  receiverSubmitLoading.value = false
  handleReceiverDialogClose()
}

// 关闭接收者Dialog
const handleReceiverDialogClose = () => {
  receiverDialogVisible.value = false
  selectedReceivers.value = []
  currentReceiverType.value = RECEIVER_TYPES.USER
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields()
})
</script>

<style lang="scss" scoped>
.template-form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.template-form {
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
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
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
  }
}

// 渠道样式
.channels-section {
  .channels-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
    width: 100%;
  }

  .channel-option-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #fafbfc;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    min-height: 80px;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }
  }

  .channel-checkbox {
    flex-shrink: 0;
  }

  .channel-info {
    flex: 1;
    min-width: 0;
  }

  .channel-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .channel-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  }
}

// 接收者样式
.receivers-section {
  width: 100%;
  min-width: 0;

  .receivers-header {
    margin-bottom: 16px;
    width: 100%;
  }

  .receivers-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .left-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .right-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .receivers-table-wrapper {
    width: 100%;
    overflow: hidden;
  }

  .receivers-table {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
}

// 删除按钮样式
.remove-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
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
@media (max-width: 1200px) {
  .channels-section {
    .channels-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
  }
}

@media (max-width: 768px) {
  .template-form-container {
    padding: 16px;
  }

  .template-form {
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

  .channels-section {
    .channels-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .channel-option-card {
      padding: 12px;
      gap: 8px;
      min-height: 70px;
    }

    .channel-name {
      font-size: 13px;
    }

    .channel-desc {
      font-size: 11px;
    }
  }

  .receivers-section {
    .receivers-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;

      .left-actions,
      .right-actions {
        justify-content: center;
      }
    }
  }
}
</style>
