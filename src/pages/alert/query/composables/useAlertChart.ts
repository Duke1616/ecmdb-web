import { ref, onUnmounted } from "vue"
import * as echarts from "echarts"

/**
 * 图表管理 Composable
 * @returns 图表相关的状态和方法
 */
export function useAlertChart() {
  // 图表 DOM 引用
  const chartRef = ref<HTMLElement | null>(null)

  // 图表实例
  let chartInstance: echarts.ECharts | null = null

  // 是否显示图例
  const showLegend = ref(true)

  // Prometheus/Grafana 默认颜色调色板
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

  /**
   * 初始化图表实例
   * NOTE: 必须在 DOM 挂载后调用
   */
  const initChart = () => {
    if (chartRef.value && !chartInstance) {
      chartInstance = echarts.init(chartRef.value)

      // 监听窗口大小变化
      window.addEventListener("resize", handleResize)
    }
  }

  /**
   * 处理窗口大小变化
   */
  const handleResize = () => {
    chartInstance?.resize()
  }

  /**
   * 处理指标数据,转换为图表系列
   * @param metrics API 返回的指标数据
   * @returns 图表系列数据
   */
  const processMetrics = (metrics: any[]) => {
    return metrics.map((metric, index) => {
      // NOTE: 使用标签组合作为系列名称
      const name =
        Object.entries(metric.labels || {})
          .map(([k, v]) => `${k}="${v}"`)
          .join(", ") || "Value"

      const data = metric.points.map((p: any) => [p.timestamp * 1000, p.value])
      const lastValue = data.length > 0 ? data[data.length - 1][1] : null
      const color = colors[index % colors.length]

      return {
        name,
        type: "line",
        showSymbol: true,
        symbol: "circle",
        symbolSize: 8,
        data,
        smooth: false,
        lineStyle: { width: 1 },
        itemStyle: { color: color, opacity: 0 }, // 默认不可见
        lastValue: lastValue,
        color: color,
        visible: true,
        emphasis: {
          itemStyle: { opacity: 1, borderColor: "#fff", borderWidth: 2 } // 悬停时可见
        }
      }
    })
  }

  /**
   * 更新图表
   * @param chartSeries 图表系列数据
   */
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
          // 鼠标在左侧时,tooltip 显示在右侧;反之亦然
          return x < viewWidth / 2 ? [x + 20, y] : [x - boxWidth - 20, y]
        },
        formatter: (p: any) => {
          const date = new Date(p.value[0])
          const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
            .getHours()
            .toString()
            .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
            .getSeconds()
            .toString()
            .padStart(2, "0")}`

          const color = chartSeries[p.seriesIndex]?.color || p.color

          let res = `<div class="mb-2 text-gray-500 font-medium border-b border-gray-100 pb-1">${dateStr}</div>`
          res += `<div style="max-width: 600px; white-space: normal; word-break: break-all; line-height: 1.4;">
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
        bottom: "3%",
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
      series: visibleSeries.map((s) => ({ ...s }))
    }

    chartInstance.setOption(option, true) // true = notMerge (替换)
  }

  /**
   * 切换系列显示/隐藏
   * NOTE: 如果点击的是唯一可见的系列,则显示所有系列;否则只显示点击的系列
   * @param index 系列索引
   * @param seriesData 所有系列数据
   */
  const toggleSeries = (index: number, seriesData: any[]) => {
    const s = seriesData[index]
    const otherVisible = seriesData.filter((item, i) => i !== index && item.visible).length > 0
    const isOnlyVisible = s.visible && !otherVisible

    if (isOnlyVisible) {
      // 如果是唯一可见的,显示所有系列
      seriesData.forEach((item) => (item.visible = true))
    } else {
      // 否则,只显示当前系列
      seriesData.forEach((item, i) => {
        item.visible = i === index
      })
    }

    updateChart(seriesData)
  }

  /**
   * 销毁图表实例
   */
  const disposeChart = () => {
    window.removeEventListener("resize", handleResize)
    chartInstance?.dispose()
    chartInstance = null
  }

  // 组件卸载时自动销毁图表
  onUnmounted(() => {
    disposeChart()
  })

  return {
    chartRef,
    showLegend,
    initChart,
    processMetrics,
    updateChart,
    toggleSeries,
    disposeChart
  }
}
