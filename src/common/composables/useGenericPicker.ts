import { ref, nextTick, shallowRef } from "vue"

/**
 * 通用选择器交互控制与数据缓存管理组合式函数
 */
export function useGenericPicker<T, K extends string | number>(options: {
  searchApi: (params: { keyword: string; offset: number; limit: number }) => Promise<{ total: number; data: T[] }>
  resolveApi: (key: K) => Promise<T | null>
  keyField: keyof T
  pageSize?: number
}) {
  const { searchApi, resolveApi, keyField, pageSize = 3 } = options

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

  /**
   * 异步加载搜索数据
   */
  const loadData = async () => {
    loading.value = true
    try {
      const { total, data } = await searchApi({
        keyword: keyword.value,
        offset: (paginationData.value.currentPage - 1) * paginationData.value.pageSize,
        limit: paginationData.value.pageSize
      })
      paginationData.value.total = total
      listData.value = data || []
    } catch (error) {
      console.error("GenericPicker loadData failed:", error)
      listData.value = []
      paginationData.value.total = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 关闭下拉面板
   */
  const closeDropdown = () => {
    showDropdown.value = false
  }

  /**
   * 切换下拉面板展示状态
   */
  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
    if (showDropdown.value) {
      paginationData.value.currentPage = 1
      keyword.value = searchKeyword.value
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
    keyword.value = searchKeyword.value
    paginationData.value.currentPage = 1
    loadData()
  }

  /**
   * 切换分页码
   */
  const handlePageChange = (page: number) => {
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
    toggleDropdown,
    closeDropdown,
    handleSearch,
    handlePageChange,
    resolveDetail
  }
}
