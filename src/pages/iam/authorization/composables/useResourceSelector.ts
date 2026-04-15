import { ref, reactive, computed, type Ref } from "vue"
import { debounce } from "lodash-es"

/**
 * 资源选择器通用配置选项
 */
export interface UseResourceSelectorOptions<T, Q> {
  // API 获取函数
  fetchApi: (params: any) => Promise<{ data: { [key: string]: any; total: number } }>
  // API 返回结构中目标列表的字段名 (例如: 'subjects' 或 'policies')
  listKey: string
  // 列表中对象的唯一标识字段名，或者生成唯一标识的方法 (防主键冲突)
  rowKey: keyof T | ((row: T) => string)
  // 初始查询参数
  initialQuery: Q
}

/**
 * NOTE: 抽离资源选择逻辑，解耦表格的分页、加载、搜索、跨页选中和移除操作。
 * 用于实现“双面板选择器”模式（左侧源列表 + 右侧跨页购物车）。
 */
export function useResourceSelector<T, Q extends object>(options: UseResourceSelectorOptions<T, Q>) {
  const tableRef = ref()
  const loading = ref(false)
  const list = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)

  // 强类型查询参数，自动混入分页
  const query = reactive({
    ...options.initialQuery,
    page: 1,
    limit: 10
  }) as Q & { page: number; limit: number }

  const selectedMap = ref(new Map<string, T>())
  const selectedList = computed(() => Array.from(selectedMap.value.values()))
  const selectedTotal = computed(() => selectedMap.value.size)

  // 内部辅助函数：获取单行唯一 Key
  const getRowKey = (item: T): string => {
    return typeof options.rowKey === "function" ? options.rowKey(item) : String(item[options.rowKey])
  }

  const fetchList = async () => {
    loading.value = true
    try {
      // 预处理：过滤掉空字符串以适应后端的 omitempty 逻辑，避免类型错误
      const params: Record<string, any> = { ...query }
      Object.keys(params).forEach((key) => {
        if (params[key] === "") {
          params[key] = undefined
        }
      })

      const { data } = await options.fetchApi({
        ...params,
        offset: (query.page - 1) * query.limit,
        limit: query.limit
      })

      list.value = data[options.listKey]
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  // 搜索消抖
  const debouncedSearch = debounce(() => {
    query.page = 1
    fetchList()
  }, 300)

  // 跨页全量状态接管 (需配合表格 reserve-selection)
  const handleSelectionChange = (selection: T[]) => {
    const newMap = new Map<string, T>()
    selection.forEach((item) => newMap.set(getRowKey(item), item))
    // 强制触发响应式更新
    selectedMap.value = newMap
  }

  // 从已选中移除 (同时处理左侧表格状态)
  const removeSelection = (item: T) => {
    tableRef.value?.toggleRowSelection(item, false)
    selectedMap.value.delete(getRowKey(item))
  }

  // 每页条数切换
  const handleSizeChange = (val: number) => {
    query.limit = val
    query.page = 1
    fetchList()
  }

  // 清空所有选中
  const clearSelection = () => {
    tableRef.value?.clearSelection()
    selectedMap.value.clear()
  }

  // 重置外部状态 (通常用于关闭抽屉时)
  const reset = () => {
    query.page = 1
    ;(query as any).keyword = ""
    // 注意: initialQuery 可能包含其他字段
    Object.assign(query, options.initialQuery)
    clearSelection()
    list.value = []
    total.value = 0
  }

  return {
    tableRef,
    loading,
    list,
    total,
    query,
    selectedMap,
    selectedList,
    selectedTotal,
    fetchList,
    debouncedSearch,
    handleSelectionChange,
    handleSizeChange,
    removeSelection,
    clearSelection,
    reset
  }
}
