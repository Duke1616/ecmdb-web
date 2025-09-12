<template>
  <div class="manager-header">
    <div class="header-left" :class="{ 'has-back-button': showBackButton }">
      <div class="title-section">
        <button v-if="showBackButton" @click="$emit('back')" class="back-button">
          <span class="back-icon">←</span>
        </button>
        <div class="title-content">
          <h2 class="manager-title">{{ title }}</h2>
          <p class="manager-subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- 可选的详细信息区域 -->
      <div v-if="$slots.details" class="details-section">
        <slot name="details" />
      </div>

      <!-- 可选的额外信息区域 -->
      <div v-if="$slots.extra" class="extra-section">
        <slot name="extra" />
      </div>
    </div>
    <div class="header-right">
      <slot name="actions">
        <el-button v-if="showAddButton" type="primary" :icon="CirclePlus" class="action-btn" @click="$emit('add')">
          {{ addButtonText }}
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button
            v-if="showRefreshButton"
            type="primary"
            :icon="RefreshRight"
            circle
            class="refresh-btn"
            @click="$emit('refresh')"
          />
        </el-tooltip>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"

interface Props {
  title: string
  subtitle: string
  addButtonText?: string
  showAddButton?: boolean
  showRefreshButton?: boolean
  showBackButton?: boolean
}

withDefaults(defineProps<Props>(), {
  addButtonText: "新增",
  showAddButton: true,
  showRefreshButton: true,
  showBackButton: false
})

defineEmits<{
  add: []
  refresh: []
  back: []
}>()
</script>

<style scoped lang="scss">
/* 头部区域 */
.manager-header {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 65px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        border-color: #9ca3af;
        background: #f9fafb;
      }

      &:active {
        transform: translateY(1px);
      }

      .back-icon {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        line-height: 1;
      }
    }

    .title-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }

  .details-section {
    margin-top: 12px;
  }

  .extra-section {
    margin-top: 8px;
  }
}

.manager-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.manager-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 全局按钮样式 - 使用 :deep() 确保覆盖所有子元素 */
:deep(.action-btn) {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.danger {
    background: #ef4444;
    border-color: #ef4444;

    &:hover {
      background: #dc2626;
      border-color: #dc2626;
    }
  }
}

:deep(.refresh-btn) {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}

/* 高分辨率屏幕优化 */
@media (min-width: 1440px) {
  .manager-header {
    padding: 20px 24px;
    min-height: 70px;
    margin-bottom: 20px;
  }

  .manager-title {
    font-size: 22px;
  }

  .manager-subtitle {
    font-size: 15px;
  }

  .header-left {
    gap: 6px;

    .title-section {
      gap: 14px;

      .back-button {
        width: 36px;
        height: 36px;

        .back-icon {
          font-size: 18px;
        }
      }
    }

    .details-section {
      margin-top: 14px;
    }

    .extra-section {
      margin-top: 10px;
    }
  }

  .header-right {
    gap: 14px;
  }

  :deep(.action-btn) {
    height: 40px;
    padding: 0 18px;
    font-size: 15px;
    gap: 8px;
  }

  :deep(.refresh-btn) {
    width: 40px;
    height: 40px;
  }
}

/* 超高分辨率屏幕优化 */
@media (min-width: 1920px) {
  .manager-header {
    padding: 22px 26px;
    min-height: 75px;
    margin-bottom: 22px;
  }

  .manager-title {
    font-size: 24px;
  }

  .manager-subtitle {
    font-size: 16px;
  }

  .header-left {
    gap: 8px;

    .title-section {
      gap: 16px;

      .back-button {
        width: 40px;
        height: 40px;

        .back-icon {
          font-size: 20px;
        }
      }
    }

    .details-section {
      margin-top: 16px;
    }

    .extra-section {
      margin-top: 12px;
    }
  }

  .header-right {
    gap: 16px;
  }

  :deep(.action-btn) {
    height: 44px;
    padding: 0 20px;
    font-size: 16px;
    gap: 10px;
  }

  :deep(.refresh-btn) {
    width: 44px;
    height: 44px;
  }
}

/* 小屏幕优化 - Mac 等设备 - 强制应用 */
@media (max-width: 2000px) {
  .manager-header {
    padding: 12px 16px !important;
    min-height: 50px !important;
    margin-bottom: 12px !important;
  }

  .manager-title {
    font-size: 16px !important;
  }

  .manager-subtitle {
    font-size: 12px !important;
  }

  .header-left {
    gap: 3px;

    .title-section {
      gap: 10px;

      .back-button {
        width: 30px;
        height: 30px;

        .back-icon {
          font-size: 14px;
        }
      }
    }

    .details-section {
      margin-top: 10px;
    }

    .extra-section {
      margin-top: 6px;
    }
  }

  .header-right {
    gap: 10px;
  }

  :deep(.action-btn) {
    height: 28px !important;
    padding: 0 12px !important;
    font-size: 12px !important;
    gap: 3px !important;
  }

  :deep(.refresh-btn) {
    width: 28px !important;
    height: 28px !important;
  }
}

/* 中等屏幕优化 */
@media (max-width: 1023px) and (min-width: 769px) {
  .manager-header {
    padding: 14px 18px;
    min-height: 55px;
    margin-bottom: 14px;
  }

  .manager-title {
    font-size: 17px;
  }

  .manager-subtitle {
    font-size: 12px;
  }

  .header-left {
    gap: 2px;

    .title-section {
      gap: 8px;

      .back-button {
        width: 28px;
        height: 28px;

        .back-icon {
          font-size: 13px;
        }
      }
    }

    .details-section {
      margin-top: 8px;
    }

    .extra-section {
      margin-top: 4px;
    }
  }

  .header-right {
    gap: 8px;
  }

  :deep(.action-btn) {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    gap: 3px;
  }

  :deep(.refresh-btn) {
    width: 30px;
    height: 30px;
  }
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .manager-header {
    padding: 16px 18px;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .manager-title {
    font-size: 18px;
    text-align: center;
  }

  .manager-subtitle {
    text-align: center;
  }
}
</style>
