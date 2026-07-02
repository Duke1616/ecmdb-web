import { ref, computed } from "vue"
import { useListManager } from "@/common/composables/useListManager"

/**
 * 资源选择器配置选项 (透传给 useListManager)
 */
export interface UseResourceSelectorOptions<T, Q> {
  fetchApi: (params: any) => Promise<{ data: { [key: string]: any; total: number } }>
  listKey: string
  rowKey: keyof T | ((row: T) => string)
  initialQuery: Q
}

/**
 * NOTE: 资源选择器专用 Hook
 * 优雅地组合了基础列表能力 (useListManager) 与跨页选中逻辑。
 */
export function useResourceSelector<T, Q extends object>(options: UseResourceSelectorOptions<T, Q>) {
  // 1. 实例化基础管理器
  const manager = useListManager<T, Q>({
    fetchApi: options.fetchApi,
    listKey: options.listKey,
    initialQuery: options.initialQuery,
    immediate: false
  })

  // 2. 扩展选择器特性
  const tableRef = ref()
  //使用 ref(Map) 时，修改内部元素不会触发响应式，必须通过替换 Map 对象来触发
  const selectedMap = ref(new Map<string, T>())

  const selectedList = computed(() => Array.from(selectedMap.value.values()))
  const selectedTotal = computed(() => selectedMap.value.size)

  const getRowKey = (item: T): string => {
    return typeof options.rowKey === "function" ? options.rowKey(item) : String(item[options.rowKey])
  }

  const handleSelectionChange = (selection: T[]) => {
    const newMap = new Map<string, T>()
    selection.forEach((item) => newMap.set(getRowKey(item), item))
    selectedMap.value = newMap
  }

  const removeSelection = (item: T) => {
    tableRef.value?.toggleRowSelection(item, false)
    // 触发响应式：替换 Map 对象
    const newMap = new Map(selectedMap.value)
    newMap.delete(getRowKey(item))
    selectedMap.value = newMap
  }

  const clearSelection = () => {
    tableRef.value?.clearSelection()
    // 触发响应式：重置为新 Map
    selectedMap.value = new Map()
  }

  // 覆写重置逻辑：不触发网络请求
  const reset = () => {
    manager.pagination.currentPage = 1
    manager.query.keyword = ""
    if (options.initialQuery) Object.assign(manager.query, options.initialQuery)
    manager.list.value = []
    manager.total.value = 0
    clearSelection()
  }

  // 3. 完美组合并返回
  return {
    ...manager,
    tableRef,
    selectedMap,
    selectedList,
    selectedTotal,
    handleSelectionChange,
    removeSelection,
    clearSelection,
    reset
  }
}
