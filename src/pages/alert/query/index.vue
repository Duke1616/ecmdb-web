<template>
  <div class="page-container">
    <!-- Query Card -->
    <div class="query-card">
      <!-- Toolbar -->
      <QueryToolbar
        v-model:datasource-id="datasourceId"
        v-model:time-range="timeRange"
        :datasources="datasources"
        @run-query="handleRunQuery"
        @apply-history="handleApplyHistory"
      />

      <!-- Query Input Area -->
      <QueryInput v-model="query" @execute="handleRunQuery" />
    </div>

    <!-- Data View Card -->
    <ChartView
      ref="chartViewRef"
      :loading="loading"
      :has-run-query="hasRunQuery"
      :series="series"
      v-model:show-legend="showLegend"
      @toggle-series="handleToggleSeries"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, unref } from "vue"
import QueryToolbar from "./components/QueryToolbar.vue"
import QueryInput from "./components/QueryInput.vue"
import ChartView from "./components/ChartView.vue"
import { useAlertDatasource } from "./composables/useAlertDatasource"
import { useAlertQuery } from "./composables/useAlertQuery"
import { useAlertChart } from "./composables/useAlertChart"
import { useQueryHistory, type QueryHistoryItem } from "./composables/useQueryHistory"

// 使用 composables
const { datasourceId, datasources, fetchDatasources } = useAlertDatasource()
const { query, timeRange, loading, hasRunQuery, series, runQuery } = useAlertQuery()
const { chartRef, showLegend, initChart, processMetrics, updateChart, toggleSeries } = useAlertChart()

// 使用查询历史
const { addHistory } = useQueryHistory()

// ChartView 组件引用
const chartViewRef = ref<InstanceType<typeof ChartView> | null>(null)

/**
 * 确保图表已初始化
 * NOTE: 延迟初始化,在第一次有数据时才初始化图表
 */
const ensureChartInitialized = () => {
  if (!chartRef.value && chartViewRef.value?.chartRef) {
    const domElement = unref(chartViewRef.value.chartRef)
    if (domElement) {
      chartRef.value = domElement
      initChart()
    }
  }
}

/**
 * 执行查询
 * NOTE: 协调查询和图表更新，查询成功后保存到历史记录
 */
const handleRunQuery = async () => {
  if (!datasourceId.value || !query.value || !timeRange.value) return

  const metrics = await runQuery(datasourceId.value, query.value, timeRange.value)

  if (metrics && metrics.length > 0) {
    // 处理指标数据为图表系列
    series.value = processMetrics(metrics)

    // 等待 DOM 更新后初始化图表(如果还未初始化)
    await nextTick()
    ensureChartInitialized()

    // 更新图表
    await nextTick()
    updateChart(series.value)

    // 保存查询历史
    saveQueryHistory()
  } else {
    series.value = []
  }
}

/**
 * 保存查询历史
 * NOTE: 查询成功后自动保存，包含完整的查询上下文
 */
const saveQueryHistory = () => {
  if (!datasourceId.value || !query.value || !timeRange.value) return

  addHistory({
    query: query.value,
    datasourceId: datasourceId.value,
    timeRange: timeRange.value
  })
}

/**
 * 应用历史记录
 * NOTE: 恢复历史查询的所有参数并自动执行查询
 */
const handleApplyHistory = (item: QueryHistoryItem) => {
  query.value = item.query
  datasourceId.value = item.datasource_id

  // 转换时间戳为 Date 对象
  timeRange.value = [new Date(item.time_range.start), new Date(item.time_range.end)]

  // 自动执行查询
  nextTick(() => {
    handleRunQuery()
  })
}

/**
 * 切换系列显示/隐藏
 */
const handleToggleSeries = (index: number) => {
  toggleSeries(index, series.value)
}

/**
 * 数据源变化时清空查询结果
 * NOTE: 避免显示错误数据源的数据
 */
watch(datasourceId, () => {
  series.value = []
  hasRunQuery.value = false
})

// 生命周期
onMounted(async () => {
  // 获取数据源列表
  await fetchDatasources()

  // NOTE: 图表初始化延迟到第一次查询有数据时
  // 因为容器在没有数据时是隐藏的(display: none),ECharts 无法获取尺寸
})
</script>

<style lang="scss" scoped>
/* Page Layout */
.page-container {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
  gap: 1rem;
  overflow-y: auto;
}

/* Query Card */
.query-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
</style>
