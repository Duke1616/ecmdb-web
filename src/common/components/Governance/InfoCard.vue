<script setup lang="ts">
/**
 * 治理资料卡组件
 * 用于详情页展示主体的核心标识资料
 */
export interface InfoItem {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
  full?: boolean
  desc?: boolean
}

defineProps<{
  title: string
  icon: any
  items: InfoItem[]
  gridCols?: number
}>()

const emit = defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <div class="info-card consolidated-card">
    <div class="info-header">
      <el-icon><component :is="icon" /></el-icon>
      <span>{{ title }}</span>
    </div>
    <div class="info-content" :class="gridCols ? `grid-${gridCols}-cols` : 'grid-4-cols'">
      <div v-for="(item, index) in items" :key="index" class="info-item" :class="{ full: item.full }">
        <div class="label">{{ item.label }}</div>
        <div
          class="value"
          :class="{ mono: item.mono, copyable: item.copyable, desc: item.desc }"
          @click="item.copyable && emit('copy', item.value)"
        >
          {{ item.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;
    .el-icon {
      color: #3b82f6;
    }
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      margin-left: 12px;
    }
  }

  .info-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 24px;

    &.grid-3-cols {
      grid-template-columns: repeat(3, 1fr);
    }
    &.grid-4-cols {
      grid-template-columns: 1fr 1fr 1.5fr;
    }

    .info-item {
      &.full {
        grid-column: 1 / -1;
      }
      .label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .value {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
        &.mono {
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        &.copyable {
          cursor: pointer;
          &:hover {
            color: #3b82f6;
            text-decoration: underline;
          }
        }
        &.desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
