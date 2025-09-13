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
  border-radius: calc(0.6rem + 0.1vw);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: calc(0.9rem + 0.3vw) calc(1.1rem + 0.4vw);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: calc(3.2rem + 0.5vw);
  margin-bottom: calc(0.9rem + 0.2vw);
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
  gap: calc(0.2rem + 0.05vw);

  .title-section {
    display: flex;
    align-items: center;
    gap: calc(0.6rem + 0.2vw);

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(1.6rem + 0.3vw);
      height: calc(1.6rem + 0.3vw);
      border: 1px solid #d1d5db;
      border-radius: calc(0.3rem + 0.05vw);
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
        font-size: calc(0.8rem + 0.1vw);
        font-weight: 600;
        color: #374151;
        line-height: 1;
      }
    }

    .title-content {
      display: flex;
      flex-direction: column;
      gap: calc(0.2rem + 0.05vw);
    }
  }

  .details-section {
    margin-top: calc(0.6rem + 0.1vw);
  }

  .extra-section {
    margin-top: calc(0.4rem + 0.1vw);
  }
}

.manager-title {
  font-size: calc(1rem + 0.3vw);
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.manager-subtitle {
  font-size: calc(0.7rem + 0.15vw);
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: calc(0.6rem + 0.2vw);
}

/* 全局按钮样式 - 使用 :deep() 确保覆盖所有子元素 */
:deep(.action-btn) {
  height: calc(1.8rem + 0.3vw);
  padding: 0 calc(0.8rem + 0.2vw);
  font-size: calc(0.7rem + 0.15vw);
  font-weight: 500;
  border-radius: calc(0.4rem + 0.05vw);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: calc(0.3rem + 0.05vw);

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
  width: calc(1.8rem + 0.3vw);
  height: calc(1.8rem + 0.3vw);
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}
</style>
