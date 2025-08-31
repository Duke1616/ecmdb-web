<template>
  <div class="setting-container">
    <div class="setting-content">
      <div class="form-card">
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>通知设置</h3>
              <p>配置工作流执行时的通知方式和渠道</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">启用通知</span>
              </div>
              <div class="switch-wrapper">
                <el-switch
                  v-model="localFormData.is_notify"
                  width="50px"
                  class="modern-switch"
                  inline-prompt
                  @change="updateFormData"
                />
                <span
                  class="switch-label"
                  :class="{ enabled: localFormData.is_notify, disabled: !localFormData.is_notify }"
                >
                  {{ localFormData.is_notify ? "已启用" : "已禁用" }}
                </span>
              </div>
              <div class="input-hint">开启后，工作流执行时会发送通知消息</div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">通知渠道</span>
              </div>
              <div class="input-container">
                <el-select
                  v-model="localFormData.notify_method"
                  @change="updateFormData"
                  placeholder="请选择通知渠道"
                  class="modern-select"
                  :disabled="!localFormData.is_notify"
                >
                  <el-option v-for="item in notifyMapping" :key="item.label" :label="item.label" :value="item.value">
                    <div class="option-content">
                      <span class="option-label">{{ item.label }}</span>
                      <span v-if="item.recommended" class="option-badge">推荐</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>

          <div v-if="localFormData.is_notify" class="notification-preview">
            <div class="preview-header">
              <div class="preview-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="preview-info">
                <h4>通知预览</h4>
                <p class="preview-description">
                  当工作流执行时，将通过
                  <strong class="preview-method">{{ getNotifyMethodLabel() }}</strong> 发送通知消息
                </p>
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
import { watch } from "vue"
import { useFormHandler } from "./composables/useFormHandler"
import FormActions from "./components/FormActions/index.vue"

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
  "form"
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

// 页面头部
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 32px;
  color: white;
  text-align: center;

  .header-content {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .header-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);

    .icon {
      width: 32px;
      height: 32px;
      color: white;
    }
  }

  .page-title {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .page-subtitle {
    margin: 0;
    font-size: 16px;
    opacity: 0.9;
    line-height: 1.5;
  }
}

// 设置内容
.setting-content {
  flex: 1;
  padding: 0px 32px;
  overflow-y: auto;

  .form-card {
    background: white;
    border-radius: 16px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 800px;
    margin: 0 auto;
  }
}

// 表单区块
.form-section {
  padding: 32px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;

    .section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 20px;
        height: 20px;
        color: white;
      }
    }

    .section-title {
      h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
        line-height: 1.4;
      }
    }
  }
}

// 表单网格
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

// 表单字段
.form-field {
  &.full-width {
    grid-column: 1 / -1;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .label-text {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .input-container {
    .input-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }
  }
}

// 开关包装器
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;

  .switch-label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;

    &.enabled {
      color: #059669;
      font-weight: 600;
    }

    &.disabled {
      color: #9ca3af;
      font-weight: 500;
    }
  }
}

// 现代化开关样式
:deep(.modern-switch) {
  .el-switch__core {
    background-color: #e5e7eb;
    border-color: #d1d5db;
    transition: all 0.3s ease;

    &.is-checked {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: #10b981;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
  }

  .el-switch__action {
    transition: all 0.3s ease;

    &.is-checked {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

// 现代化选择器样式
:deep(.modern-select) {
  .el-input__wrapper {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 16px;
    min-height: 48px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #667eea;
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &.is-focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  }

  // 下拉选项样式优化
  .el-select-dropdown__item {
    padding: 12px 16px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      color: #0c4a6e;
    }

    &.selected {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      color: #065f46;
      font-weight: 600;
    }
  }
}

// 选项内容
.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 2px 0;

  .option-label {
    font-weight: 500;
    color: #1e293b;
    font-size: 14px;
  }

  .option-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 3px rgba(102, 126, 234, 0.2);
    position: relative;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &::before {
      content: "✓";
      margin-right: 2px;
      font-size: 7px;
      opacity: 0.9;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
  }
}

// 通知预览
.notification-preview {
  margin-top: 24px;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%);
  border: 1px solid #d1fae5;
  border-radius: 12px;
  padding: 20px;

  .preview-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;

    .preview-icon {
      width: 32px;
      height: 32px;
      background: #10b981;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 18px;
        height: 18px;
        color: white;
      }
    }

    .preview-info {
      flex: 1;

      .preview-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #065f46;
      }

      .preview-description {
        margin: 0;
        font-size: 14px;
        color: #047857;
        line-height: 1.5;

        .preview-method {
          color: #059669;
          font-weight: 600;
        }
      }
    }
  }
}

// 信息框
.info-box {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 20px;

  .info-icon {
    width: 32px;
    height: 32px;
    background: #f59e0b;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;
      color: white;
    }
  }

  .info-content {
    flex: 1;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #a16207;
      line-height: 1.5;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    padding: 32px 20px;

    .page-title {
      font-size: 24px;
    }

    .page-subtitle {
      font-size: 14px;
    }
  }

  .setting-content {
    padding: 20px;

    .form-card {
      border-radius: 12px;
    }
  }

  .form-section {
    padding: 24px 20px;

    .section-header {
      flex-direction: column;
      text-align: center;
      gap: 12px;

      .section-icon {
        margin: 0 auto;
      }
    }
  }

  .form-actions {
    padding: 20px;

    .actions-container {
      flex-direction: column-reverse;
      gap: 12px;
    }

    .action-button {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 24px 16px;

    .header-icon {
      width: 48px;
      height: 48px;

      .icon {
        width: 24px;
        height: 24px;
      }
    }

    .page-title {
      font-size: 20px;
    }

    .page-subtitle {
      font-size: 13px;
    }
  }

  .setting-content {
    padding: 16px;

    .form-card {
      border-radius: 10px;
    }
  }

  .form-section {
    padding: 20px 16px;

    .section-header {
      gap: 8px;

      .section-icon {
        width: 28px;
        height: 28px;

        svg {
          width: 14px;
          height: 14px;
        }
      }

      .section-title {
        h3 {
          font-size: 15px;
        }

        p {
          font-size: 12px;
        }
      }
    }
  }

  .form-actions {
    padding: 16px;

    .action-button {
      min-width: 120px;
      height: 44px;
      font-size: 13px;
    }
  }
}
</style>
