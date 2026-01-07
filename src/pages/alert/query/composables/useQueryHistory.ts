import { ref } from "vue"
import { ElMessage } from "element-plus"
import {
  addQueryHistoryApi,
  listQueryHistoryApi,
  deleteQueryHistoryApi,
  clearQueryHistoryApi
} from "@/api/alert/query_history"
import type { QueryHistoryItem as ApiQueryHistoryItem, TimeRange } from "@/api/alert/query_history/types"

/**
 * 扩展的查询历史记录项（包含数据源名称）
 */
export interface QueryHistoryItem extends ApiQueryHistoryItem {
  datasourceName: string // 数据源名称
}

/**
 * 查询历史记录管理
 */
export const useQueryHistory = () => {
  // 历史记录列表
  const historyList = ref<QueryHistoryItem[]>([])

  // 加载状态
  const loading = ref(false)

  // 数据源映射（用于显示名称）
  const datasourceMap = ref<Record<number, string>>({})

  /**
   * 设置数据源映射
   */
  const setDatasourceMap = (datasources: Array<{ id: number; name: string }>) => {
    datasourceMap.value = datasources.reduce(
      (map, ds) => {
        map[ds.id] = ds.name
        return map
      },
      {} as Record<number, string>
    )
  }

  /**
   * 获取查询历史列表
   */
  const fetchHistory = async (limit: number = 50) => {
    loading.value = true
    try {
      const { data } = await listQueryHistoryApi({ limit })

      // 转换数据，添加 datasourceName
      historyList.value = (data.items || []).map((item) => ({
        ...item,
        datasourceName: datasourceMap.value[item.datasource_id] || `数据源 #${item.datasource_id}`
      }))
    } catch (error) {
      historyList.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加新的历史记录
   */
  const addHistory = async (params: { query: string; datasourceId: number; timeRange: [Date, Date] }) => {
    try {
      // 转换时间范围为毫秒时间戳
      const timeRange: TimeRange = {
        start: params.timeRange[0].getTime(),
        end: params.timeRange[1].getTime()
      }

      await addQueryHistoryApi({
        query: params.query,
        datasource_id: params.datasourceId,
        time_range: timeRange
      })

      // 重新获取历史记录列表
      await fetchHistory()
    } catch (error) {
      // 静默失败，axios 统一错误处理
    }
  }

  /**
   * 删除指定历史记录
   */
  const removeHistory = async (timestamp: number) => {
    try {
      await deleteQueryHistoryApi(timestamp)

      // 从列表中移除
      historyList.value = historyList.value.filter((item) => item.timestamp !== timestamp)

      ElMessage.success("删除成功")
    } catch (error) {
      // axios 统一错误处理
    }
  }

  /**
   * 清空所有历史记录
   */
  const clearHistory = async () => {
    try {
      await clearQueryHistoryApi()
      historyList.value = []
      ElMessage.success("清空成功")
    } catch (error) {
      // axios 统一错误处理
    }
  }

  return {
    historyList,
    loading,
    fetchHistory,
    addHistory,
    removeHistory,
    clearHistory,
    setDatasourceMap
  }
}
