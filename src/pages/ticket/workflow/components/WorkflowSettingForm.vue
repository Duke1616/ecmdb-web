<template>
  <div class="setting-container">
    <div class="setting-content">
      <div class="form-card">
        <!-- 区块 1: 通知设置 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>通知设置</h3>
              <p>配置工作流执行时的通知方式和渠道</p>
            </div>
          </div>

          <div class="form-grid">
            <!-- 启用通知 -->
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">启用通知</span>
              </div>
              <div class="setting-row-card" :class="{ 'is-active': localFormData.is_notify }">
                <span class="row-desc">关键节点实时提醒</span>
                <el-switch v-model="localFormData.is_notify" @change="updateFormData" />
              </div>
            </div>

            <!-- 通知渠道 -->
            <div class="form-field" :class="{ 'is-disabled': !localFormData.is_notify }">
              <div class="field-label">
                <span class="label-text">通知渠道</span>
              </div>
              <div class="setting-row-card select-card">
                <div class="card-lead">
                  <el-icon class="lead-icon"><Connection /></el-icon>
                  <span class="lead-text">接收渠道</span>
                </div>
                <el-select
                  v-model="localFormData.notify_method"
                  placeholder="未选择"
                  :disabled="!localFormData.is_notify"
                  class="embedded-select"
                  @change="updateFormData"
                >
                  <el-option v-for="item in notifyMapping" :key="item.label" :label="item.label" :value="item.value">
                    <div class="custom-option">
                      <span class="dot" />
                      <span>{{ item.label }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>

          <!-- 常驻提示条 -->
          <div class="status-summary-bar" :class="{ 'is-deactivated': !localFormData.is_notify }">
            <el-icon><InfoFilled /></el-icon>
            <span v-if="localFormData.is_notify">
              配置已生效：通知通过 <b>{{ getNotifyMethodLabel() }}</b> 实时分发
            </span>
            <span v-else>当前已禁用：在该模式下，工作流执行时将不会发送任何外部通知消息</span>
          </div>
        </div>

        <!-- 区块 2: 流转与审批策略配置 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>流转与审批策略</h3>
              <p>配置工单运行时的操作权限与驳回规则</p>
            </div>
          </div>

          <div class="form-grid">
            <!-- 允许转签 -->
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">允许工单转签</span>
              </div>
              <el-tooltip
                :disabled="!isEasyFlow"
                content="当前引擎不支持转签功能"
                placement="top"
              >
                <div
                  class="setting-row-card"
                  :class="{
                    'is-active': localFormData.flow_policy?.allow_transfer && !isEasyFlow,
                    'is-disabled': isEasyFlow
                  }"
                >
                  <span class="row-desc">审批人可转签给他人处理</span>
                  <el-switch
                    v-model="localFormData.flow_policy.allow_transfer"
                    :disabled="isEasyFlow"
                    @change="updateFormData"
                  />
                </div>
              </el-tooltip>
            </div>

            <!-- 允许驳回 -->
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">允许审批驳回</span>
              </div>
              <div class="setting-row-card" :class="{ 'is-active': localFormData.flow_policy?.allow_reject }">
                <span class="row-desc">审批人可驳回当前工单</span>
                <el-switch v-model="localFormData.flow_policy.allow_reject" @change="handleRejectSwitchChange" />
              </div>
            </div>
          </div>

          <!-- 驳回模式选择（仅当开启驳回时展示） -->
          <div v-if="localFormData.flow_policy?.allow_reject" class="policy-sub-section">
            <div class="field-label">
              <span class="label-text">支持的驳回方式</span>
              <span class="field-hint">（至少选择一项）</span>
            </div>

            <div class="reject-modes-grid">
              <!-- 模式 1: 退回上一环节 (顺序驳回) -->
              <el-tooltip
                :disabled="!isEasyFlow"
                content="当前引擎不支持退回上一环节"
                placement="top"
              >
                <div
                  class="reject-mode-card"
                  :class="{
                    'is-selected': isModeSelected('history'),
                    'is-disabled': isEasyFlow
                  }"
                  @click="toggleRejectMode('history')"
                >
                  <div class="mode-header">
                    <el-checkbox
                      :model-value="isModeSelected('history')"
                      :disabled="isEasyFlow"
                      @click.stop
                      @change="toggleRejectMode('history')"
                    />
                    <span class="mode-title">退回上一环节（顺序驳回）</span>
                  </div>
                  <div class="mode-desc">
                    按流转路径回退至紧邻的上一审批环节，默认推荐
                  </div>
                </div>
              </el-tooltip>

              <!-- 模式 2: 退回发起人 -->
              <el-tooltip
                :disabled="!isEasyFlow"
                content="当前引擎不支持退回发起人"
                placement="top"
              >
                <div
                  class="reject-mode-card"
                  :class="{
                    'is-selected': isModeSelected('starter'),
                    'is-disabled': isEasyFlow
                  }"
                  @click="toggleRejectMode('starter')"
                >
                  <div class="mode-header">
                    <el-checkbox
                      :model-value="isModeSelected('starter')"
                      :disabled="isEasyFlow"
                      @click.stop
                      @change="toggleRejectMode('starter')"
                    />
                    <span class="mode-title">退回发起人</span>
                  </div>
                  <div class="mode-desc">
                    退回给发起人修改并重新提审，表单数据自动回填
                  </div>
                </div>
              </el-tooltip>

              <!-- 模式 3: 直接否决终止 -->
              <div
                class="reject-mode-card reject-mode-card--danger"
                :class="{ 'is-selected': isModeSelected('terminate') }"
                @click="toggleRejectMode('terminate')"
              >
                <div class="mode-header">
                  <el-checkbox
                    :model-value="isModeSelected('terminate')"
                    @click.stop
                    @change="toggleRejectMode('terminate')"
                  />
                  <span class="mode-title">直接否决</span>
                </div>
                <div class="mode-desc">
                  一票否决并办结归档，工单不再继续流转
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <FormActions @previous="previous" @save="save" @cancel="close" :show-next="false" :show-save="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue"
import { InfoFilled, Connection } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useFormHandler } from "@/common/composables/useFormHandler"
import FormActions from "@/common/components/FormActions/index.vue"
import type { RejectMode } from "@/api/ticket/workflow/types/workflow"

const notifyMapping = [
  {
    value: 1,
    label: "飞书",
    recommended: true
  }
]

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(["previous", "save", "close", "update:formData"])

const { localFormData, updateFormData, setFormData, close, previous, save } = useFormHandler(
  props.formData,
  emits,
  "setting"
)

const isEasyFlow = computed(() => {
  return localFormData.value.engine_type === "easy-workflow"
})

const initPolicy = () => {
  if (!localFormData.value.flow_policy) {
    localFormData.value.flow_policy = {
      allow_transfer: false,
      allow_reject: true,
      reject_modes: isEasyFlow.value ? ["terminate"] : ["history"]
    }
  } else {
    if (isEasyFlow.value) {
      localFormData.value.flow_policy.allow_transfer = false
      localFormData.value.flow_policy.reject_modes = ["terminate"]
    }
  }
}

const isModeSelected = (mode: RejectMode) => {
  return localFormData.value.flow_policy?.reject_modes?.includes(mode) || false
}

const toggleRejectMode = (mode: RejectMode) => {
  if (isEasyFlow.value && mode !== "terminate") return
  if (!localFormData.value.flow_policy) return

  const modes: RejectMode[] = [...(localFormData.value.flow_policy.reject_modes || [])]
  const idx = modes.indexOf(mode)
  if (idx > -1) {
    if (modes.length <= 1) {
      ElMessage.warning("至少需要保留一种驳回方式")
      return
    }
    modes.splice(idx, 1)
  } else {
    modes.push(mode)
  }
  localFormData.value.flow_policy.reject_modes = modes
  updateFormData()
}

const handleRejectSwitchChange = (val: string | number | boolean) => {
  if (Boolean(val)) {
    const modes = localFormData.value.flow_policy.reject_modes
    if (!modes || modes.length === 0) {
      localFormData.value.flow_policy.reject_modes = isEasyFlow.value
        ? ["terminate"]
        : ["history"]
    }
  }
  updateFormData()
}

const getNotifyMethodLabel = () => {
  const method = notifyMapping.find((item) => item.value === localFormData.value.notify_method)
  return method ? method.label : "未选择"
}

/** 监听外部 props.formData 变更，同步本地数据 */
watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
    initPolicy()
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.setting-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  min-height: 500px;
}

.setting-content {
  flex: 1;
  padding: 0px 32px 32px;
  overflow-y: auto;

  .form-card {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 800px;
    margin: 0 auto;
  }
}

.form-section {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;

    .section-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: white;

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .section-title {
      h3 {
        margin: 0 0 3px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }
    }
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.form-field {
  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;

    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
  }

  &.is-disabled {
    opacity: 0.6;
    filter: grayscale(0.2);
  }
}

// 统一风格的设置行卡片
.setting-row-card {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 16px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;

  &:hover:not(.is-disabled) {
    border-color: #cbd5e1;
    background: #ffffff;
  }

  &:focus-within:not(.is-disabled) {
    border-color: #764ba2;
    box-shadow: 0 0 0 1px rgba(118, 75, 162, 0.15);
  }

  &.is-active {
    border-color: #764ba2;
    background: white;
    box-shadow: 0 0 0 1px rgba(118, 75, 162, 0.15);

    .row-desc {
      color: #1e293b;
      font-weight: 500;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    background: #f8fafc;
    border-color: #e2e8f0;
    opacity: 0.7;
  }

  &.select-card {
    padding-right: 8px; // 给 Select 的箭头留一点空隙
  }

  .row-desc {
    font-size: 13px;
    color: #94a3b8;
    transition: color 0.3s;
  }
}

// 嵌入式选择器：彻底移除 Select 自身边框与阴影，无缝融合进卡片
:deep(.embedded-select) {
  flex: 1;
  width: 100%;

  .el-select__wrapper {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 4px !important;
    height: 100% !important;
    min-height: 38px !important;
    line-height: 38px !important;

    &.is-focused,
    &:hover {
      box-shadow: none !important;
    }
  }

  .el-input__wrapper {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 4px !important;
    height: 100% !important;
    min-height: 38px !important;
    line-height: 38px !important;

    &.is-focus,
    &:hover {
      box-shadow: none !important;
    }
  }

  .el-select__placeholder,
  .el-select__selected-item,
  .el-input__inner {
    text-align: right;
    font-size: 13px;
    color: #1e293b;
    font-weight: 500;
    justify-content: flex-end;
  }

  .el-select__suffix,
  .el-input__suffix {
    margin-left: 4px;
  }
}

// 选择器左侧标识
.card-lead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  margin-right: 8px;
  border-right: 1px solid #e2e8f0;
  height: 20px;

  .lead-icon {
    font-size: 14px;
    color: #94a3b8;
  }

  .lead-text {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
  }
}

// 下拉项
.custom-option {
  display: flex;
  align-items: center;
  gap: 8px;
  .dot {
    width: 6px;
    height: 6px;
    background: #667eea;
    border-radius: 50%;
  }
}

// 状态汇总条 (对齐样式 + 常驻态)
.status-summary-bar {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background-color: #f0f9ff;
  border-radius: 10px;
  color: #0369a1;
  font-size: 13px;
  border: 1px solid #bae6fd;
  line-height: 1.4;
  transition: all 0.3s ease;

  // 禁用态样式
  &.is-deactivated {
    background-color: #f8fafc;
    border-color: #e2e8f0;
    color: #64748b;

    .el-icon {
      color: #94a3b8;
    }
  }

  .el-icon {
    font-size: 18px;
    color: #38bdf8;
    transition: color 0.3s;
  }

  b {
    color: #0c4a6e;
    margin: 0 4px;
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-color: rgba(56, 189, 248, 0.4);
  }
}

.policy-sub-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;

    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .field-hint {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.reject-modes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.reject-mode-card {
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  min-height: 82px;

  &:hover:not(.is-disabled) {
    border-color: #cbd5e1;
    background: #f8fafc;
    transform: translateY(-1px);
  }

  &.is-selected {
    border-color: #764ba2;
    background: #faf8fd;
    box-shadow: 0 0 0 1px rgba(118, 75, 162, 0.1);

    .mode-title {
      color: #633991;
      font-weight: 600;
    }
  }

  &.reject-mode-card--danger.is-selected {
    border-color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);

    .mode-title {
      color: #b91c1c;
      font-weight: 600;
    }
  }

  &.is-disabled {
    opacity: 0.6;
    background: #f8fafc;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }

  .mode-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .mode-title {
      font-size: 13px;
      font-weight: 500;
      color: #334155;
    }
  }

  .mode-desc {
    font-size: 11px;
    color: #64748b;
    line-height: 1.5;
  }
}
</style>
