<template>
  <div class="page-container">
    <!-- Query Card -->
    <div class="query-card">
      <!-- Toolbar -->
      <div class="toolbar-container">
        <div class="toolbar-left">
          <div class="datasource-wrapper">
            <span class="datasource-label">数据源</span>
            <el-select
              v-model="datasourceId"
              placeholder="Select Datasource"
              class="datasource-select"
              size="default"
              filterable
            >
              <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
          </div>
          <div class="toolbar-separator" />
          <div class="time-controls">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="to"
              start-placeholder="Start"
              end-placeholder="End"
              :shortcuts="shortcuts"
              size="default"
              class="date-picker"
              @change="handleTimeRangeChange"
              :prefix-icon="Calendar"
            />
            <el-tooltip content="Auto-refresh (Coming soon)" placement="top">
              <el-button circle size="small"><i class="fa fa-refresh" /></el-button>
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
            <el-button type="primary" size="default" @click="runQuery">
              <el-icon class="mr-1"><Search /></el-icon> 查询
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- Query Input Area -->
      <div class="query-input-wrapper">
        <div class="query-editor-container">
          <!-- Built-in Metrics Sidebar -->
          <div class="metrics-sidebar group">
            <span class="metrics-text">内置指标</span>
            <i class="fa fa-angle-right metrics-icon" />
          </div>

          <!-- Code Editor -->
          <div class="editor-wrapper cm-editor-custom">
            <codemirror
              v-model="query"
              placeholder="输入查询语句. 按 Ctrl+Enter 执行查询"
              :style="{ fontSize: '13px', fontFamily: 'Menlo, Monaco, Consolas, monospace' }"
              :autofocus="true"
              :indent-with-tab="true"
              :tab-size="2"
              :extensions="extensions"
              @keydown.ctrl.enter="runQuery"
              @keydown.meta.enter="runQuery"
              class="h-full"
            />
          </div>
        </div>
        <!-- <div class="footer-wrapper">
          <span class="footer-info"><i class="fa fa-info-circle mr-1" /> Press <b>Cmd+Enter</b> to execute</span>
        </div> -->
      </div>
    </div>

    <!-- Data View Card -->
    <div class="data-card">
      <!-- Graph Controls Header -->
      <div class="graph-header">
        <div class="graph-title"><i class="fa fa-line-chart mr-1" /> Graph</div>

        <div class="graph-controls">
          <el-checkbox v-model="showLegend" label="Show Legend" size="small" />
          <!-- toggle-group removed -->
          <span class="divider">|</span>
          <span class="text-gray-400">{{ series.length }} Series</span>
        </div>
      </div>

      <!-- Content -->
      <div class="content-area" v-loading="loading">
        <!-- Initial State: No Query Run Yet -->
        <div
          v-if="!hasRunQuery"
          class="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100"
        >
          <el-empty description="暂无数据" :image-size="100" />
        </div>

        <!-- Query Run but No Data -->
        <div
          v-else-if="hasRunQuery && series.length === 0 && !loading"
          class="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100"
        >
          <el-empty description="查询无结果" :image-size="100" />
        </div>

        <!-- Chart Section (Show only when there is data) -->
        <div v-show="series.length > 0" class="chart-section">
          <div class="chart-container">
            <div ref="chartRef" class="chart-canvas" />
          </div>

          <!-- Refined Legend -->
          <div v-if="showLegend && series.length > 0" class="legend-container custom-scrollbar">
            <table class="legend-table">
              <thead class="legend-thead">
                <tr>
                  <th class="legend-th">Metric Series</th>
                  <th class="legend-th right">Last Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr
                  v-for="(item, index) in series"
                  :key="index"
                  @click="toggleSeries(index)"
                  class="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                  :class="{ 'opacity-40': !item.visible }"
                >
                  <td class="legend-td-name">
                    <span class="legend-color-dot" :style="{ backgroundColor: item.color }" />
                    <div class="legend-metric-name">
                      {{ item.name }}
                    </div>
                  </td>
                  <td class="legend-td-value">
                    {{ formatValue(item.lastValue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import * as echarts from "echarts"
import { listDatasourceApi } from "@/api/alert/datasource"
import { QueryRangeApi } from "@/api/alert/proxy"
import type { Datasource } from "@/api/alert/datasource/types/datasource"

// CodeMirror imports
import { Codemirror } from "vue-codemirror"
// import { javascript } from '@codemirror/lang-javascript' // Use JS logic for PromQL highlighting for now or generic
import { markdown } from "@codemirror/lang-markdown" // Markdown might be cleaner than JS for PromQL syntax highlighting approximation

import { Calendar, Search, Clock } from "@element-plus/icons-vue"

// State
const datasourceId = ref<number | undefined>(undefined)
const datasources = ref<Datasource[]>([])
const query = ref("")
const loading = ref(false)
const showLegend = ref(true)
const hasRunQuery = ref(false)

const timeRange = ref<[Date, Date] | null>([new Date(Date.now() - 1 * 60 * 60 * 1000), new Date()])

// Chart & Series
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const series = ref<any[]>([])

// Codemirror Extensions
const extensions = [markdown()] // Placeholder for PromQL highlighting

// Shortcuts
const shortcuts = [
  { text: "15m", value: () => [new Date(Date.now() - 15 * 60 * 1000), new Date()] },
  { text: "1h", value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
  { text: "6h", value: () => [new Date(Date.now() - 6 * 3600 * 1000), new Date()] },
  { text: "24h", value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] },
  { text: "7d", value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] }
]

// Methods
const fetchDatasources = async () => {
  try {
    const res = await listDatasourceApi({
      offset: 0,
      limit: 100,
      type: "PROMETHEUS" as any
    })
    if (res.data && res.data.data_sources) {
      datasources.value = res.data.data_sources.filter((d: any) => d.type === "PROMETHEUS")
      if (datasources.value.length > 0 && !datasourceId.value) {
        datasourceId.value = datasources.value[0].id
      }
    }
  } catch (error) {
    console.error("Failed to fetch datasources", error)
  }
}

const runQuery = async () => {
  if (!datasourceId.value || !query.value || !timeRange.value) return

  loading.value = true
  hasRunQuery.value = true
  try {
    const [start, end] = timeRange.value
    const step = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000 / 200))

    const res = await QueryRangeApi({
      datasource_id: datasourceId.value,
      query: query.value,
      start_time: Math.floor(start.getTime() / 1000),
      end_time: Math.floor(end.getTime() / 1000),
      step: step
    })

    processData(res.data.metrics)
  } catch (error) {
    console.error("Query failed", error)
    series.value = []
    if (chartInstance) chartInstance.clear()
  } finally {
    loading.value = false
  }
}

const processData = (metrics: any[]) => {
  if (!chartInstance) return

  // Colors palette like Prometheus/Grafana default
  const colors = [
    "#7EB26D",
    "#EAB839",
    "#6ED0E0",
    "#EF843C",
    "#E24D42",
    "#1F78C1",
    "#BA43A9",
    "#705DA0",
    "#508642",
    "#CCA300",
    "#447EBC",
    "#C15C17",
    "#890F02",
    "#0A437C",
    "#6D1F62",
    "#584477"
  ]

  const newSeries = metrics.map((metric, index) => {
    const name =
      Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(", ") || "Value" // Raw labels for now

    const data = metric.points.map((p: any) => [p.timestamp * 1000, p.value])
    const lastValue = data.length > 0 ? data[data.length - 1][1] : null
    const color = colors[index % colors.length]

    return {
      name,
      type: "line", // Default type, overridden in updateChart
      showSymbol: true,
      symbol: "circle",
      symbolSize: 8,
      data,
      smooth: false,
      lineStyle: { width: 1 },
      itemStyle: { color: color, opacity: 0 }, // Invisible by default
      lastValue: lastValue,
      color: color,
      visible: true,
      emphasis: {
        itemStyle: { opacity: 1, borderColor: "#fff", borderWidth: 2 } // Visible on hover
      }
    }
  })

  series.value = newSeries

  nextTick(() => {
    if (chartInstance) {
      chartInstance.resize()
      updateChart(newSeries)
    }
  })
}

const toggleSeries = (index: number) => {
  const s = series.value[index]
  const otherVisible = series.value.filter((item, i) => i !== index && item.visible).length > 0
  const isOnlyVisible = s.visible && !otherVisible

  if (isOnlyVisible) {
    // If it's the only one visible, show all
    series.value.forEach((item) => (item.visible = true))
  } else {
    // Otherwise, isolate this one
    series.value.forEach((item, i) => {
      item.visible = i === index
    })
  }
  updateChart(series.value)
}

const updateChart = (chartSeries: any[]) => {
  if (!chartInstance) return

  const visibleSeries = chartSeries.filter((s) => s.visible !== false)

  const option = {
    animation: false,
    tooltip: {
      trigger: "item",
      axisPointer: { type: "cross" },
      appendToBody: true,
      position: (point: any, params: any, dom: any, rect: any, size: any) => {
        const [x, y] = point
        const viewWidth = size.viewSize[0]
        const boxWidth = size.contentSize[0]
        // Mouse on left -> show tooltip on right; Mouse on right -> show tooltip on left
        // Add some offset so it doesn't overlap mouse
        return x < viewWidth / 2 ? [x + 20, y] : [x - boxWidth - 20, y]
      },
      formatter: (p: any) => {
        const date = new Date(p.value[0])
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`

        const color = series.value[p.seriesIndex]?.color || p.color

        let res = `<div class="mb-2 text-gray-500 font-medium border-b border-gray-100 pb-1">${dateStr}</div>`
        res += `<div style="max-width: 350px; white-space: normal; word-break: break-all; line-height: 1.4;">
                 <div class="flex items-start">
                   <span class="inline-block w-2.5 h-2.5 rounded-full mr-2 mt-1 flex-shrink-0" style="background:${color}"></span>
                   <div class="flex-1 text-xs text-gray-700 font-mono">
                     ${p.seriesName}: <span class="font-bold text-gray-900">${parseFloat(p.value[1]).toFixed(4)}</span>
                   </div>
                 </div>
               </div>`
        return res
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%", // Small bottom, but containLabel handles it
      top: "3%",
      containLabel: true
    },
    xAxis: {
      type: "time",
      splitLine: { show: false },
      axisPointer: {
        show: true,
        lineStyle: { type: "dashed" },
        label: { show: false }
      },
      axisLine: {
        show: true,
        lineStyle: { color: "#e5e7eb" }
      },
      axisLabel: {
        show: true,
        color: "#374151",
        hideOverlap: true
      }
    },
    yAxis: {
      type: "value",
      scale: true,
      splitLine: { lineStyle: { type: "dashed", color: "#f3f4f6" } },
      axisLabel: { color: "#374151" }
    },
    series: visibleSeries.map((s) => ({
      ...s
    }))
  }

  chartInstance.setOption(option, true) // true = notMerge (replace)
}

// Watchers
watch(showLegend, () => {
  // Legend is controlled via DOM v-if, no chart update needed really, but if chart had internal legend:
  // updateChart(series.value)
})

const formatValue = (val: any) => {
  if (val === null || val === undefined) return "-"
  return parseFloat(val).toFixed(5)
}

const handleTimeRangeChange = () => {
  if (query.value) runQuery()
}

// Lifecycle
onMounted(() => {
  fetchDatasources()
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener("resize", () => chartInstance?.resize())
  }
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
/* Ensure full height usage */
:deep(.cm-editor) {
  height: 100%;
}

/* Page Layout */
.page-container {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb; /* bg-gray-50 */
  gap: 1rem; /* space-y-4 */
  overflow-y: auto; /* Enable vertical scrolling for the entire page if needed */
}

/* Query Card */
.query-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6; /* border-gray-100 */
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* Prevent shrinking */
}

/* Toolbar */
.toolbar-container {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem; /* space-x-4 */
}
.datasource-wrapper {
  display: flex;
  align-items: center;
}
.datasource-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563; /* text-gray-600 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 0.5rem;
}
.datasource-select {
  width: 14rem; /* w-56 */
}
.toolbar-separator {
  height: 1rem;
  width: 1px;
  background-color: #e5e7eb; /* bg-gray-200 */
}
.time-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* space-x-2 */
}
.date-picker {
  width: 20rem; /* w-80 */
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Query Input */
.query-input-wrapper {
  margin-bottom: 1rem; /* mb-4 */
  padding-top: 1rem; /* pt-4 */
  border-top: 1px solid #f3f4f6; /* border-gray-100 */
}

.query-editor-container {
  display: flex;
  align-items: stretch;
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.375rem; /* rounded-md */
  background-color: white;
  /* overflow: hidden; Removed to allow scrolling interaction */
  min-height: 36px;
  transition: all 0.2s;

  &:focus-within {
    box-shadow: 0 0 0 1px #dbeafe; /* ring-1 ring-blue-100 */
    border-color: #dbeafe;
  }
}

.metrics-sidebar {
  padding-left: 0.75rem; /* px-3 */
  padding-right: 0.75rem;
  background-color: rgba(249, 250, 251, 0.5); /* bg-gray-50/50 */
  border-right: 1px solid #e5e7eb; /* border-gray-200 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s;
  user-select: none;
  white-space: nowrap;
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;

  &:hover {
    background-color: #f3f4f6; /* hover:bg-gray-100 */
  }
}

.metrics-text {
  font-size: 12px;
  color: #1f2937; /* text-gray-800 */
  font-weight: 400;
  margin-right: 0.25rem; /* mr-1 */
}

.metrics-icon {
  font-size: 12px;
  color: #6b7280; /* text-gray-500 */
  transition: color 0.15s;

  .metrics-sidebar:hover & {
    color: #374151; /* group-hover:text-gray-700 */
  }
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  /* cm-editor-custom logic here if any specific extra needed */
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.375rem; /* mt-1.5 */
  padding-left: 0.25rem; /* px-1 */
  padding-right: 0.25rem;
}

.footer-info {
  font-size: 10px; /* text-[10px] */
  color: #6b7280; /* text-gray-500 */
}

/* Customize codemirror to look cleaner */
:deep(.cm-editor-custom .cm-editor) {
  height: auto;
  min-height: 36px;
  max-height: 110px; /* Approx 4-5 lines */
  outline: none !important;
  background-color: transparent !important; /* Fix potential background color issue */
}
:deep(.cm-content) {
  padding-top: 8px; /* Compact padding */
  padding-bottom: 8px;
  font-family: Menlo, Monaco, Consolas, monospace;
}
:deep(.cm-line) {
  padding-left: 8px;
}
:deep(.cm-scroller) {
  overflow-y: auto !important; /* Allow scrolling */
}
:deep(.cm-gutters) {
  display: none !important;
}

/* Data View Card */
.data-card {
  /* flex: 1; Remove flex: 1 to allow content to dictate height, or keep it but limit chart height */
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  overflow: hidden;
  flex-shrink: 0; /* Prevent shrinking */
  /* min-height: 0; */
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
  color: #111827; /* text-gray-900 */
  margin-right: 0.5rem;
}
.graph-controls {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  gap: 0.75rem; /* space-x-3 */
}
.toggle-group {
  display: flex;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.125rem;
}
.toggle-btn {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.15s;

  &.active {
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    color: #1f2937; /* text-gray-800 */
  }
  &.inactive {
    color: #6b7280; /* text-gray-500 */
    &:hover {
      color: #374151;
    }
  }
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
}
.chart-container {
  height: 320px; /* Fixed height to "compress" the graph as requested */
  position: relative;
  width: 100%;
}
.chart-canvas {
  position: absolute;
  inset: 0;
}

/* Legend */
.legend-container {
  height: 12rem; /* Increased to h-48 approx */
  margin-top: 0.5rem;
  overflow-y: auto;
  border: 1px solid #f3f4f6;
  border-radius: 0.375rem;
  background-color: white;
}
.legend-table {
  width: 100%;
  font-size: 0.75rem;
}
.legend-thead {
  background-color: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.legend-th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #1f2937; /* text-gray-800 */

  &.right {
    text-align: right;
    width: 6rem;
  }
}
.legend-tr {
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(239, 246, 255, 0.5);
  }
}
.legend-td-name {
  padding: 0.375rem 0.75rem;
  display: flex;
  align-items: start;
}
.legend-color-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  margin-top: 0.375rem;
  margin-right: 0.5rem;
}
.legend-metric-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #374151; /* text-gray-700 */
  word-break: break-all;
  line-height: 1.25;
  transition: color 0.15s;

  .legend-tr:hover & {
    color: #2563eb;
  }
}
.legend-td-value {
  padding: 0.375rem 0.75rem;
  text-align: right;
  font-family: monospace;
  color: #111827;
  font-weight: 500;
}
</style>
