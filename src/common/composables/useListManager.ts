import { ref, reactive, computed, toRaw, type Ref } from "vue"

/**
 * 列表响应的基础结构
 * 兼容性优化：不再强制要求索引签名，使用交叉类型 Record<string, any>
 */
export type ListResponse<T> = {
  total: number
} & Record<string, T[] | any>

/**
 * 列表管理配置项
 */
interface ListManagerOptions<_T, Q> {
  /**
   * API 请求函数
   * 返回值兼容项目的标准响应格式 { data: { total, ... } }
   */
  fetchApi: (params: Q & { offset: number; limit: number }) => Promise<{ data: any }>
  /** 列表数据在 data 对象中的键名 (如 'users', 'policies') */
  listKey: string
  /** 初始业务查询参数 */
  initialQuery?: Partial<Q>
  /** 是否立即加载 */
  immediate?: boolean
}

/**
 * 辅助函数：清理对象中的空字符串，适配后端 omitempty
 */
const cleanEmptyParams = (obj: Record<string, any>) => {
  const newObj = { ...obj }
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === "" || newObj[key] === null) {
      newObj[key] = undefined
    }
  })
  return newObj
}

/**
 * 通用列表管理逻辑 Hook
 */
export function useListManager<T, Q extends object>(options: ListManagerOptions<T, Q>) {
  // --- 1. 核心状态 ---
  const list = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)

  const pagination = reactive({
    currentPage: 1,
    pageSize: 10
  })

  const query = reactive({
    keyword: "",
    ...(options.initialQuery || {})
  }) as Q & { keyword: string }

  // --- 2. 计算属性 ---
  const offset = computed(() => (pagination.currentPage - 1) * pagination.pageSize)

  // --- 3. 核心行为 ---
  const fetchList = async () => {
    loading.value = true
    try {
      const requestParams = {
        ...cleanEmptyParams(toRaw(query)),
        offset: offset.value,
        limit: pagination.pageSize
      } as Q & { offset: number; limit: number }

      const res = await options.fetchApi(requestParams)

      // 提取数据：兼容各种深度的 API 返回结构
      const apiData = res.data as ListResponse<T>
      if (apiData) {
        list.value = (apiData[options.listKey] as T[]) || []
        total.value = apiData.total || 0
      }
    } catch (err: unknown) {
      console.error(`[ListManager] 数据加载失败:`, err)
    } finally {
      loading.value = false
    }
  }

  // --- 4. 辅助方法 ---
  const handlePageChange = (page: number) => {
    pagination.currentPage = page
    fetchList()
  }

  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.currentPage = 1
    fetchList()
  }

  const handleSearch = (keyword?: unknown) => {
    if (typeof keyword === "string") query.keyword = keyword
    pagination.currentPage = 1
    fetchList()
  }

  const reset = () => {
    pagination.currentPage = 1
    query.keyword = ""
    if (options.initialQuery) Object.assign(query, options.initialQuery)
    fetchList()
  }

  // --- 5. 初始化 ---
  if (options.immediate !== false) {
    fetchList()
  }

  return {
    list,
    total,
    loading,
    pagination,
    query,
    fetchList,
    handlePageChange,
    handleSizeChange,
    handleSearch,
    reset
  }
}
