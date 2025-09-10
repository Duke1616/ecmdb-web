<template>
  <BaseDialog
    v-model="visible"
    :title="title"
    :width="width"
    :height="height"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    type="permission"
    @closed="handleClosed"
  >
    <!-- 头部插槽 -->
    <template #header>
      <div class="permission-dialog-header">
        <div class="header-icon">
          <el-icon><component :is="headerIcon" /></el-icon>
        </div>
        <div class="header-text">
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
        <div class="header-stats" v-if="showStats">
          <div class="stat-item">
            <div class="stat-number">{{ selectedCount }}</div>
            <div class="stat-label">已选择</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-label">总数</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 权限内容 -->
    <div class="permission-dialog-content">
      <slot />
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="permission-dialog-footer">
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
            :disabled="selectedCount === 0"
          >
            <el-icon><Check /></el-icon>
            确认分配 ({{ selectedCount }})
          </el-button>
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Close, Check } from "@element-plus/icons-vue"
import BaseDialog from "../Base/index.vue"

interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  width?: string | number
  height?: string | number
  showClose?: boolean
  closeOnClickModal?: boolean
  showStats?: boolean
  selectedCount?: number
  totalCount?: number
  headerIcon?: any
  beforeClose?: (done: () => void) => void
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
  (e: "confirm"): void
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: "为角色分配相应的权限",
  width: "60%",
  height: "80vh",
  showClose: false,
  closeOnClickModal: false,
  showStats: true,
  selectedCount: 0,
  totalCount: 0,
  headerIcon: "Menu"
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
.permission-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .header-text {
    flex: 1;

    h3 {
      margin: 0 0 2px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 400;
    }
  }

  .header-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      text-align: center;

      .stat-number {
        font-size: 18px;
        font-weight: 700;
        color: #3b82f6;
        line-height: 1;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
    }
  }
}

.permission-dialog-content {
  height: 60vh;
  min-height: 400px;
  max-height: 70vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.permission-dialog-footer {
  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;

    .cancel-btn,
    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      min-width: 100px;
      justify-content: center;

      &:hover {
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
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

// 响应式设计
@media (max-width: 768px) {
  .permission-dialog-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;

    .header-stats {
      gap: 24px;
    }
  }

  .permission-dialog-footer {
    .footer-actions {
      flex-direction: column;
      gap: 12px;

      .cancel-btn,
      .confirm-btn {
        width: 100%;
        min-width: auto;
      }
    }
  }
}
</style>
