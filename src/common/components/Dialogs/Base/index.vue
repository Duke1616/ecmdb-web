<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :height="height"
    :class="dialogClass"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    @closed="handleClosed"
  >
    <!-- 头部插槽 -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- 内容区域 -->
    <div class="dialog-content">
      <slot />
    </div>

    <!-- 底部插槽 -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  height?: string | number
  showClose?: boolean
  closeOnClickModal?: boolean
  type?: "standard" | "form" | "permission" | "custom"
  beforeClose?: (done: () => void) => void
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "50%",
  height: "80vh",
  showClose: false,
  closeOnClickModal: false,
  type: "standard"
})

const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const dialogClass = computed(() => {
  const baseClass = "base-dialog"
  const typeClass = `base-dialog--${props.type}`
  return [baseClass, typeClass]
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
</script>

<style lang="scss" scoped>
.base-dialog {
  :deep(.el-dialog) {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;
    margin: 0;
    flex-shrink: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
  }

  // 表单类型弹窗
  &--form {
    :deep(.el-dialog) {
      max-height: 80vh;
    }

    :deep(.el-dialog__body) {
      padding: 24px;
    }
  }

  // 权限分配类型弹窗
  &--permission {
    :deep(.el-dialog) {
      max-height: 85vh;
    }

    :deep(.el-dialog__body) {
      padding: 0;
      margin: 0;
    }
  }

  // 自定义类型弹窗
  &--custom {
    :deep(.el-dialog) {
      max-height: 90vh;
    }

    :deep(.el-dialog__body) {
      padding: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .base-dialog {
    :deep(.el-dialog) {
      max-height: 95vh;
      margin: 5vh auto;
    }

    :deep(.el-dialog__header) {
      padding: 16px 20px;
    }

    :deep(.el-dialog__body) {
      padding: 16px 20px;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 20px;
    }

    // 移动端不同类型弹窗的高度调整
    &--form {
      :deep(.el-dialog) {
        max-height: 90vh;
      }
    }

    &--permission {
      :deep(.el-dialog) {
        max-height: 95vh;
      }
    }

    &--custom {
      :deep(.el-dialog) {
        max-height: 95vh;
      }
    }
  }
}
</style>
