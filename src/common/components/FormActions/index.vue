<template>
  <div class="form-actions">
    <div class="actions-container">
      <!-- 上一步按钮 -->
      <el-button v-if="props.showPrevious" @click="handlePrevious" class="action-button previous-button" size="large">
        <div class="button-content">
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="button-text">{{ props.previousText }}</span>
        </div>
        <div class="button-glow" />
      </el-button>

      <!-- 下一步/保存按钮 -->
      <el-button
        v-if="props.showNext"
        @click="handleNext"
        type="primary"
        class="action-button next-button"
        size="large"
      >
        <div class="button-content">
          <span class="button-text">{{ props.nextText }}</span>
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div class="button-glow" />
      </el-button>

      <!-- 保存按钮 -->
      <el-button
        v-if="props.showSave"
        @click="handleSave"
        type="primary"
        class="action-button save-button"
        size="large"
      >
        <div class="button-content">
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="button-text">{{ props.saveText }}</span>
        </div>
        <div class="button-glow" />
      </el-button>

      <!-- 取消按钮 -->
      <el-button v-if="props.showCancel" @click="handleCancel" class="action-button cancel-button" size="large">
        <div class="button-content">
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="button-text">{{ props.cancelText }}</span>
        </div>
        <div class="button-glow" />
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // 按钮显示控制
  showPrevious?: boolean
  showNext?: boolean
  showSave?: boolean
  showCancel?: boolean

  // 按钮文本
  previousText?: string
  nextText?: string
  saveText?: string
  cancelText?: string

  // 按钮位置
  position?: "left" | "center" | "right" | "space-between"
}

const props = withDefaults(defineProps<Props>(), {
  showPrevious: true,
  showNext: true,
  showSave: false,
  showCancel: true,
  previousText: "上一步",
  nextText: "下一步",
  saveText: "保存",
  cancelText: "取消",
  position: "space-between"
})

const emits = defineEmits<{
  previous: []
  next: []
  save: []
  cancel: []
}>()

const handlePrevious = () => {
  emits("previous")
}

const handleNext = () => {
  emits("next")
}

const handleSave = () => {
  emits("save")
}

const handleCancel = () => {
  emits("cancel")
}
</script>

<style lang="scss" scoped>
.form-actions {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 24px;
  box-shadow:
    0 -2px 10px rgba(0, 0, 0, 0.05),
    0 -1px 2px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  min-height: 60px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  }

  .actions-container {
    display: flex;
    align-items: center;
    max-width: 800px;
    margin: 0 auto;
    gap: 24px;

    // 根据按钮数量自动调整布局
    &:has(.previous-button + .next-button:last-child),
    &:has(.previous-button + .save-button:last-child),
    &:has(.next-button + .cancel-button:last-child) {
      justify-content: space-between;
    }

    &:has(.previous-button + .next-button + .cancel-button:last-child),
    &:has(.previous-button + .save-button + .cancel-button:last-child) {
      justify-content: space-between;
    }

    // 其他情况居中显示
    &:not(:has(.previous-button + .next-button:last-child)):not(:has(.previous-button + .save-button:last-child)):not(
        :has(.next-button + .cancel-button:last-child)
      ):not(:has(.previous-button + .next-button + .cancel-button:last-child)):not(
        :has(.previous-button + .save-button + .cancel-button:last-child)
      ) {
      justify-content: center;
    }
  }

  .action-button {
    min-width: 120px;
    height: 42px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    border: none;

    .button-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .button-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      z-index: -1;
    }

    &:hover .button-glow {
      opacity: 0.3;
    }

    .button-icon {
      width: 16px;
      height: 16px;
      transition: transform 0.3s ease;
    }

    .button-text {
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  }

  .previous-button {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid #e2e8f0;
    color: #64748b;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.06),
      0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-color: #667eea;
      color: #475569;
      transform: translateY(-2px);
      box-shadow:
        0 6px 20px rgba(102, 126, 234, 0.15),
        0 3px 8px rgba(0, 0, 0, 0.08);

      .button-icon {
        transform: translateX(-2px);
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .next-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow:
      0 4px 15px rgba(102, 126, 234, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 25px rgba(102, 126, 234, 0.3),
        0 4px 15px rgba(0, 0, 0, 0.1);

      .button-icon {
        transform: translateX(2px);
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .save-button {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow:
      0 4px 15px rgba(16, 185, 129, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 25px rgba(16, 185, 129, 0.3),
        0 4px 15px rgba(0, 0, 0, 0.1);

      .button-icon {
        transform: scale(1.1);
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .cancel-button {
    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
    border: 2px solid #fecaca;
    color: #dc2626;
    box-shadow:
      0 2px 8px rgba(220, 38, 38, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-color: #f87171;
      color: #b91c1c;
      transform: translateY(-2px);
      box-shadow:
        0 6px 20px rgba(220, 38, 38, 0.2),
        0 3px 8px rgba(0, 0, 0, 0.08);

      .button-icon {
        transform: rotate(90deg);
      }
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions {
    padding: 16px;

    .actions-container {
      flex-direction: column-reverse;
      gap: 12px;
    }

    .action-button {
      width: 100%;
      justify-content: center;
      min-width: auto;
    }
  }
}

@media (max-width: 480px) {
  .form-actions {
    padding: 12px;

    .actions-container {
      gap: 10px;
    }

    .action-button {
      min-width: auto;
      height: 38px;
      font-size: 12px;

      .button-icon {
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style>
