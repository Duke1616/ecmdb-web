<template>
  <BaseDialog
    v-model="visible"
    :title="title"
    :width="width"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    :type="dialogType"
    @closed="handleClosed"
  >
    <!-- 头部插槽 -->
    <template #header>
      <div class="form-dialog-header">
        <div class="header-icon">
          <el-icon><component :is="headerIcon" /></el-icon>
        </div>
        <div class="header-text">
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
      </div>
    </template>

    <!-- 弹窗内容 -->
    <div class="dialog-content">
      <slot />
    </div>

    <!-- 底部操作按钮 -->
    <template v-if="showFooter" #footer>
      <div class="form-dialog-footer">
        <div class="footer-info" v-if="showFooterInfo && dialogType === 'form'">
          <el-icon class="info-icon"><InfoFilled /></el-icon>
          <span class="info-text">{{ footerInfoText }}</span>
        </div>
        <div v-else class="footer-spacer" />
        <div class="footer-actions">
          <el-button @click="handleCancel" class="cancel-btn" size="large">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
            class="confirm-btn"
            size="large"
            :loading="confirmLoading"
            :disabled="confirmDisabled"
          >
            <el-icon><Check /></el-icon>
            {{ confirmText }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- 当 showFooter 为 false 时，提供一个空的 footer 插槽来覆盖默认行为 -->
    <template v-else #footer>
      <!-- 空的 footer 插槽 -->
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { InfoFilled, Close, Check } from "@element-plus/icons-vue"
import BaseDialog from "../Base/index.vue"

interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  width?: string | number
  showClose?: boolean
  closeOnClickModal?: boolean
  headerIcon?: any
  confirmText?: string
  confirmLoading?: boolean
  confirmDisabled?: boolean
  showFooter?: boolean
  showFooterInfo?: boolean
  footerInfoText?: string
  dialogType?: "form"
  beforeClose?: (done: () => void) => void
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
  (e: "confirm"): void
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: "",
  width: "50%",
  showClose: true,
  closeOnClickModal: false,
  headerIcon: "UserFilled",
  confirmText: "确认",
  confirmLoading: false,
  confirmDisabled: false,
  showFooter: true,
  showFooterInfo: true,
  footerInfoText: "请填写完整信息后点击确认",
  dialogType: "form"
})

const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const handleBeforeClose = (done: () => void) => {
  if (props.beforeClose) {
    props.beforeClose(done)
  } else {
    done()
  }
}

const handleClosed = () => {
  emits("closed")
}

const handleConfirm = () => {
  emits("confirm")
}

const handleCancel = () => {
  emits("cancel")
}
</script>

<style lang="scss" scoped>
.form-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;

  .header-icon {
    width: calc(2rem + 0.5vw);
    height: calc(2rem + 0.5vw);
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: calc(0.5rem + 0.1vw);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: calc(0.9rem + 0.2vw);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .header-text {
    h3 {
      margin: 0 0 calc(0.1rem + 0.05vw) 0;
      font-size: calc(0.9rem + 0.2vw);
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    p {
      margin: 0;
      font-size: calc(0.65rem + 0.15vw);
      color: #64748b;
      font-weight: 400;
    }
  }
}

.form-dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: calc(0.6rem + 0.2vw);

  .footer-info {
    display: flex;
    align-items: center;
    gap: calc(0.3rem + 0.1vw);
    padding: calc(0.3rem + 0.1vw) calc(0.5rem + 0.2vw);
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: calc(0.3rem + 0.1vw);
    flex: 1;

    .info-icon {
      font-size: calc(0.7rem + 0.15vw);
      color: #0ea5e9;
    }

    .info-text {
      font-size: calc(0.6rem + 0.15vw);
      color: #0369a1;
      font-weight: 500;
    }
  }

  .footer-spacer {
    flex: 1;
  }

  .footer-actions {
    display: flex;
    gap: calc(0.5rem + 0.2vw);
    flex-shrink: 0;

    .cancel-btn,
    .confirm-btn {
      display: flex;
      align-items: center;
      gap: calc(0.3rem + 0.1vw);
      padding: calc(0.5rem + 0.2vw) calc(1rem + 0.4vw);
      border-radius: calc(0.3rem + 0.1vw);
      font-weight: 600;
      font-size: calc(0.65rem + 0.15vw);
      transition: all 0.3s ease;
      min-width: calc(5rem + 1vw);
      justify-content: center;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .cancel-btn {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .confirm-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      &:hover {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>
