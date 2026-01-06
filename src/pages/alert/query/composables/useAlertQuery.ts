import { ref } from "vue"
import { QueryRangeApi } from "@/api/alert/proxy"

/**
 * 告警查询逻辑 Composable
 * @returns 查询相关的状态和方法
 */
export function useAlertQuery() {
  // 查询语句
  const query = ref("")

  // 时间范围
  const timeRange = ref<[Date, Date] | null>([new Date(Date.now() - 1 * 60 * 60 * 1000), new Date()])

  // 加载状态
  const loading = ref(false)

  // 是否已执行过查询
  const hasRunQuery = ref(false)

  // 查询结果系列数据
  const series = ref<any[]>([])

  /**
   * 执行查询
   * @param datasourceId 数据源 ID
   * @param queryText 查询语句
   * @param range 时间范围
   * @returns 处理后的指标数据
   */
  const runQuery = async (datasourceId: number, queryText: string, range: [Date, Date]) => {
    if (!datasourceId || !queryText || !range) return

    loading.value = true
    hasRunQuery.value = true

    try {
      const [start, end] = range
      // NOTE: step 计算为时间范围除以 200,最小为 1 秒
      const step = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000 / 200))

      const res = await QueryRangeApi({
        datasource_id: datasourceId,
        query: queryText,
        start_time: Math.floor(start.getTime() / 1000),
        end_time: Math.floor(end.getTime() / 1000),
        step: step
      })

      return res.data.metrics
    } catch (error) {
      console.error("Query failed", error)
      series.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    query,
    timeRange,
    loading,
    hasRunQuery,
    series,
    runQuery
  }
}
