<template>
  <div class="toolbar-container">
    <div class="toolbar-left">
      <div class="datasource-wrapper">
        <span class="datasource-label">数据源</span>
        <el-select
          :model-value="datasourceId"
          placeholder="Select Datasource"
          class="datasource-select"
          size="default"
          filterable
          @update:model-value="$emit('update:datasourceId', $event)"
        >
          <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
        </el-select>
      </div>
      <div class="toolbar-separator" />
      <div class="time-controls">
        <el-date-picker
          :model-value="timeRange"
          type="datetimerange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          :shortcuts="shortcuts"
          size="default"
          class="date-picker"
          :prefix-icon="Calendar"
          @update:model-value="$emit('update:timeRange', $event)"
        />
        <el-tooltip content="Auto-refresh (Coming soon)" placement="top">
          <el-button circle size="small">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="toolbar-right">
      <el-tooltip content="History" placement="bottom">
        <el-button size="default">
          <el-icon class="mr-1"><Clock /></el-icon> 历史记录
        </el-button>
      </el-tooltip>
      <el-tooltip content="Run Query (Cmd+Enter)" placement="bottom">
        <el-button type="primary" size="default" @click="$emit('run-query')">
          <el-icon class="mr-1"><Search /></el-icon> 查询
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Search, Clock, Refresh } from "@element-plus/icons-vue"
import type { Datasource } from "@/api/alert/datasource/types/datasource"

interface QueryToolbarProps {
  datasourceId?: number
  datasources: Datasource[]
  timeRange: [Date, Date] | null
}

defineProps<QueryToolbarProps>()

defineEmits<{
  "update:datasourceId": [id: number]
  "update:timeRange": [range: [Date, Date]]
  "run-query": []
}>()

// 时间快捷选项
const shortcuts = [
  { text: "15m", value: () => [new Date(Date.now() - 15 * 60 * 1000), new Date()] },
  { text: "1h", value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
  { text: "6h", value: () => [new Date(Date.now() - 6 * 3600 * 1000), new Date()] },
  { text: "24h", value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] },
  { text: "7d", value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] }
]
</script>

<style lang="scss" scoped>
.toolbar-container {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap; // 允许换行
  min-height: auto;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap; // 允许内部元素换行
  flex: 1;
  min-width: 0; // 允许压缩
}

.datasource-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0; // 防止标签被挤压
}

.datasource-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  margin-right: 0.75rem;
  white-space: nowrap; // 标签不换行
}

.datasource-select {
  width: 14rem;
  min-width: 10rem; // 最小宽度
}

.toolbar-separator {
  height: 1.25rem;
  width: 1px;
  background-color: #f3f4f6;
  margin: 0 0.5rem;

  // 在小屏幕上隐藏分隔符
  @media (max-width: 1024px) {
    display: none;
  }
}

.time-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 1; // 允许压缩
}

.date-picker {
  width: 20rem;
  min-width: 16rem; // 最小宽度

  // 小屏幕上缩小
  @media (max-width: 1200px) {
    width: 18rem;
  }

  @media (max-width: 1024px) {
    width: 16rem;
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0; // 保持按钮不被压缩
}
</style>
