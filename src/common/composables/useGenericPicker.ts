import { ref, nextTick, shallowRef, onBeforeUnmount } from "vue"

/**
 * 通用选择器交互控制与数据缓存管理组合式函数
 */
export function useGenericPicker<T, K extends string | number>(options: {
  searchApi: (params: { keyword: string; offset: number; limit: number }) => Promise<{ total: number; data: T[] }>
  resolveApi: (key: K) => Promise<T | null>
  keyField: keyof T
  pageSize?: number
  searchDebounce?: number
}) {
  const { searchApi, resolveApi, keyField, pageSize = 3, searchDebounce = 300 } = options

  const loading = ref(false)
  const keyword = ref("")
  const listData = shallowRef<T[]>([])
  const showDropdown = ref(false)
  const searchKeyword = ref("")
  const selectedItems = shallowRef<T[]>([])
  const selectedItem = shallowRef<T | null>(null)
  const searchInputRef = ref<HTMLInputElement>()

  const paginationData = ref({
    total: 0,
    currentPage: 1,
    pageSize
  })

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let requestSequence = 0

  const clearSearchTimer = () => {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
  }

  /**
   * 异步加载搜索数据
   */
  const loadData = async () => {
    const currentRequest = ++requestSequence
    const requestKeyword = keyword.value.trim()
    const requestPage = paginationData.value.currentPage
    const requestPageSize = paginationData.value.pageSize

    loading.value = true
    try {
      const { total, data } = await searchApi({
        keyword: requestKeyword,
        offset: (requestPage - 1) * requestPageSize,
        limit: requestPageSize
      })

      if (currentRequest !== requestSequence) return

      paginationData.value.total = total
      listData.value = data || []
    } catch (error) {
      if (currentRequest !== requestSequence) return

      console.error("GenericPicker loadData failed:", error)
      listData.value = []
      paginationData.value.total = 0
    } finally {
      if (currentRequest === requestSequence) {
        loading.value = false
      }
    }
  }

  /**
   * 关闭下拉面板
   */
  const closeDropdown = () => {
    clearSearchTimer()
    showDropdown.value = false
  }

  /**
   * 切换下拉面板展示状态
   */
  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
    if (showDropdown.value) {
      clearSearchTimer()
      paginationData.value.currentPage = 1
      keyword.value = searchKeyword.value.trim()
      loadData()
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }

  /**
   * 触发关键词搜索
   */
  const handleSearch = () => {
    clearSearchTimer()
    searchTimer = setTimeout(() => {
      keyword.value = searchKeyword.value.trim()
      paginationData.value.currentPage = 1
      loadData()
    }, searchDebounce)
  }

  /**
   * 切换分页码
   */
  const handlePageChange = (page: number) => {
    clearSearchTimer()
    paginationData.value.currentPage = page
    loadData()
  }

  /**
   * 解析对象详情，内置防抖本地缓存和降级兜底生成逻辑
   */
  const resolveDetail = async (key: K, fallbackBuilder: (key: K) => T): Promise<T> => {
    // 1. 优先在当前已选中的 selectedItems 列表中查找缓存，防止重复请求
    const inSelected = selectedItems.value.find((item) => (item[keyField] as unknown as K) === key)
    if (inSelected) return inSelected

    // 2. 在当前已模糊查询拉出的 listData 列表中查找缓存
    const inList = listData.value.find((item) => (item[keyField] as unknown as K) === key)
    if (inList) return inList

    // 3. 本地无缓存，发起后端 API 请求远程反解
    try {
      if (key === undefined || key === null || key === "" || key === 0 || key === "0") {
        return fallbackBuilder(key)
      }
      const detail = await resolveApi(key)
      return detail || fallbackBuilder(key)
    } catch (error) {
      console.error(`GenericPicker resolveDetail failed for key ${key}:`, error)
      return fallbackBuilder(key)
    }
  }

  onBeforeUnmount(() => {
    clearSearchTimer()
  })

  return {
    loading,
    listData,
    showDropdown,
    searchKeyword,
    selectedItems,
    selectedItem,
    searchInputRef,
    paginationData,
    loadData,
    clearSearchTimer,
    toggleDropdown,
    closeDropdown,
    handleSearch,
    handlePageChange,
    resolveDetail
  }
}
