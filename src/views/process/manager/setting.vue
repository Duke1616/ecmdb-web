<template>
  <div class="setting-container">
    <div class="setting-content">
      <div class="form-card">
        <!-- 核心区块：保持与 info.vue 一致 -->
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
      </div>
    </div>

    <!-- 操作按钮 -->
    <FormActions @previous="previous" @save="save" @cancel="close" :show-next="false" :show-save="true" />
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue"
import { InfoFilled, Connection } from "@element-plus/icons-vue"
import { useFormHandler } from "@/common/composables/useFormHandler"
import FormActions from "@/common/components/FormActions/index.vue"

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

const getNotifyMethodLabel = () => {
  const method = notifyMapping.find((item) => item.value === localFormData.value.notify_method)
  return method ? method.label : "未选择"
}

/** 监听消息是否变更 */
watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.setting-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

.setting-content {
  flex: 1;
  padding: 0px 32px;
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

      svg {
        width: 16px;
        height: 16px;
        color: white;
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
    pointer-events: none;
  }
}

// 统一风格的设置行卡片
.setting-row-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 16px;
  height: 46px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }

  &.is-active {
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.08);

    .row-desc {
      color: #1e293b;
      font-weight: 500;
    }
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

// 嵌入式选择器：彻底移除 Select 自身样式
:deep(.embedded-select) {
  flex: 1;
  .el-input__wrapper {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    height: 100% !important;
  }
  .el-input__inner {
    text-align: right;
    font-size: 13px;
    color: #1e293b;
    font-weight: 600;
    padding-right: 4px;
  }
  // 调整箭头位置
  .el-input__suffix {
    margin-left: 2px;
  }
}

// 选择器左侧标识
.card-lead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  margin-right: 12px;
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

@media (max-width: 480px) {
  .setting-content {
    padding: 16px;
  }
  .form-section {
    padding: 24px 20px;
  }
}
</style>
