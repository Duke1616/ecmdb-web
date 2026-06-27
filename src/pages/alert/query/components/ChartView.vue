<template>
  <div class="data-card">
    <div class="graph-header">
      <div class="graph-title">
        <el-icon><DataLine /></el-icon>
        <span>查询结果</span>
      </div>

      <div class="graph-controls">
        <el-checkbox v-model="showLegend" label="显示图例" size="small" />
        <span class="divider">|</span>
        <span class="series-count">{{ series.length }} 条序列</span>
      </div>
    </div>

    <div class="content-area" v-loading="loading">
      <div v-if="!hasRunQuery" class="empty-state">
        <el-empty description="输入查询语句后执行查询" :image-size="100" />
      </div>

      <div v-else-if="hasRunQuery && series.length === 0 && !loading" class="empty-state">
        <el-empty description="查询无结果" :image-size="100" />
      </div>

      <div class="chart-section" :class="{ 'chart-hidden': !hasRunQuery || series.length === 0 }">
        <div class="chart-container">
          <div ref="chartRef" class="chart-canvas" />
        </div>

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
}

defineProps<ChartViewProps>()

// NOTE: showLegend 是纯 UI 状态控制，使用 defineModel 进行父子组件状态同步
const showLegend = defineModel<boolean>("showLegend", { required: true })

defineEmits<{
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
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  flex-shrink: 0;
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #edf0f5;
  background: #ffffff;
}

.graph-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
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

.series-count {
  color: #6b7280;
}

.content-area {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.empty-state {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
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
