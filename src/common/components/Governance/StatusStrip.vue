<script setup lang="ts">
import type { TagProps } from "element-plus"

/**
 * 治理状态条组件
 * 用于详情页展示主体的状态、来源、风险等级等关键指标
 */
export interface StatusItem {
  label: string
  value: string
  type?: TagProps["type"]
  dot?: boolean
}

defineProps<{
  items: StatusItem[]
}>()
</script>

<template>
  <div class="governance-status-strip">
    <template v-for="(item, index) in items" :key="index">
      <div class="status-item">
        <span v-if="item.dot" class="dot" :class="item.type || 'default'" />
        <span class="label">{{ item.label }}:</span>
        <span class="value" :class="item.type || 'default'">{{ item.value }}</span>
      </div>
      <div v-if="index < items.length - 1" class="divider" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.governance-status-strip {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.success {
        background: #10b981;
      }
      &.info,
      &.primary {
        background: #3b82f6;
      }
      &.warning {
        background: #f59e0b;
      }
      &.danger {
        background: #ef4444;
      }
      &.default {
        background: #94a3b8;
      }
    }

    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      font-weight: 700;
      &.success {
        color: #10b981;
      }
      &.info,
      &.primary {
        color: #3b82f6;
      }
      &.warning {
        color: #f59e0b;
      }
      &.danger {
        color: #ef4444;
      }
      &.default {
        color: #334155;
      }
    }
  }

  .divider {
    width: 1px;
    height: 14px;
    background: #e2e8f0;
  }
}
</style>
