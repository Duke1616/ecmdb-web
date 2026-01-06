<template>
  <div class="data-card">
    <!-- Graph Controls Header -->
    <div class="graph-header">
      <div class="graph-title">
        <el-icon class="mr-1"><DataLine /></el-icon> Graph
      </div>

      <div class="graph-controls">
        <el-checkbox
          :model-value="showLegend"
          label="Show Legend"
          size="small"
          @update:model-value="(val) => $emit('update:showLegend', !!val)"
        />
        <span class="divider">|</span>
        <span class="text-gray-400">{{ series.length }} Series</span>
      </div>
    </div>

    <!-- Content -->
    <div class="content-area" v-loading="loading">
      <!-- Initial State: No Query Run Yet -->
      <div v-if="!hasRunQuery" class="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100">
        <el-empty description="暂无数据" :image-size="100" />
      </div>

      <!-- Query Run but No Data -->
      <div
        v-else-if="hasRunQuery && series.length === 0 && !loading"
        class="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100"
      >
        <el-empty description="查询无结果" :image-size="100" />
      </div>

      <!-- Chart Section - Always rendered for ECharts initialization -->
      <div class="chart-section" :class="{ 'chart-hidden': !hasRunQuery || series.length === 0 }">
        <div class="chart-container">
          <div ref="chartRef" class="chart-canvas" />
        </div>

        <!-- Legend -->
        <ChartLegend v-if="showLegend && series.length > 0" :series="series" @toggle="$emit('toggle-series', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { DataLine } from "@element-plus/icons-vue"
import ChartLegend from "./ChartLegend.vue"

interface ChartViewProps {
  loading: boolean
  hasRunQuery: boolean
  series: any[]
  showLegend: boolean
}

defineProps<ChartViewProps>()

defineEmits<{
  "update:showLegend": [value: boolean]
  "toggle-series": [index: number]
}>()

// 图表 DOM 引用
const chartRef = ref<HTMLElement | null>(null)

// 暴露 chartRef 给父组件
defineExpose({
  chartRef
})
</script>

<style lang="scss" scoped>
.data-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  overflow: hidden;
  flex-shrink: 0;
}

/* Graph Header */
.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  background-color: rgba(249, 250, 251, 0.5);
}

.graph-title {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-right: 0.5rem;
}

.graph-controls {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  gap: 0.75rem;
}

.divider {
  color: #9ca3af;
}

/* Content Area */
.content-area {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.chart-section {
  display: flex;
  flex-direction: column;

  &.chart-hidden {
    display: none;
  }
}

.chart-container {
  height: 320px;
  position: relative;
  width: 100%;
}

.chart-canvas {
  position: absolute;
  inset: 0;
}
</style>
