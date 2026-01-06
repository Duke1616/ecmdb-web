import { ref } from "vue"
import { listDatasourceApi } from "@/api/alert/datasource"
import type { Datasource } from "@/api/alert/datasource/types/datasource"

/**
 * 告警数据源管理 Composable
 * @returns 数据源相关的状态和方法
 */
export function useAlertDatasource() {
  // 当前选中的数据源 ID
  const datasourceId = ref<number | undefined>(undefined)

  // 数据源列表
  const datasources = ref<Datasource[]>([])

  /**
   * 获取数据源列表
   * NOTE: 只获取 PROMETHEUS 类型的数据源,自动选择第一个
   */
  const fetchDatasources = async () => {
    try {
      const res = await listDatasourceApi({
        offset: 0,
        limit: 100,
        type: "PROMETHEUS" as any
      })

      if (res.data && res.data.data_sources) {
        // 只保留 PROMETHEUS 类型的数据源
        datasources.value = res.data.data_sources.filter((d: any) => d.type === "PROMETHEUS")

        // 如果没有选中的数据源,自动选择第一个
        if (datasources.value.length > 0 && !datasourceId.value) {
          datasourceId.value = datasources.value[0].id
        }
      }
    } catch (error) {
      console.error("Failed to fetch datasources", error)
    }
  }

  return {
    datasourceId,
    datasources,
    fetchDatasources
  }
}
