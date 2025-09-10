<template>
  <div class="manager-header">
    <div class="header-left">
      <h2 class="manager-title">{{ title }}</h2>
      <p class="manager-subtitle">{{ subtitle }}</p>
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
}

withDefaults(defineProps<Props>(), {
  addButtonText: "新增",
  showAddButton: true,
  showRefreshButton: true
})

defineEmits<{
  add: []
  refresh: []
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

.action-btn {
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

.refresh-btn {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}

/* 响应式设计 */
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
