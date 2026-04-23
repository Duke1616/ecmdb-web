import { ref, reactive, computed, type Ref } from "vue"

/**
 * 通用列表数据结构
 */
export interface ListResponse<T> {
  total: number
  [key: string]: T[] | any
}

/**
 * 通用 API 响应包装
 */
export interface ApiResponse<T> {
  code: number
  data: ListResponse<T>
  msg: string
}

interface ListManagerOptions<T, Q> {
  /**
   * API 请求函数
   * 参数自动合并业务查询参数 Q 与分页参数 (offset, limit)
   */
  fetchApi: (params: Q & { offset: number; limit: number }) => Promise<{ data: ListResponse<T> }>
  /** 列表数据在 data 对象中的键名 (如 'users', 'roles', 'tenants') */
  listKey: string
  /** 初始业务查询参数 */
  initialQuery?: Q
  /** 是否在组件挂载时立即执行查询，默认为 true */
  immediate?: boolean
}

/**
 * 通用列表管理逻辑 Composable
 * 封装分页、加载、搜索、重置等常用列表操作逻辑
 */
export function useListManager<T, Q extends object>(options: ListManagerOptions<T, Q>) {
  const list = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)

  // 分页状态
  const pagination = reactive({
    currentPage: 1,
    pageSize: 10
  })

  // 基础查询参数 (强制包含 keyword，并合并初始参数)
  const query = reactive({
    keyword: "",
    ...(options.initialQuery || {})
  }) as Q & { keyword: string }

  // 计算偏移量
  const offset = computed(() => (pagination.currentPage - 1) * pagination.pageSize)

  const fetchList = async () => {
    loading.value = true
    try {
      // 组合最终的 API 请求参数
      const params = {
        ...query,
        offset: offset.value,
        limit: pagination.pageSize
      } as Q & { offset: number; limit: number; keyword: string }

      const res = await options.fetchApi(params)

      const apiData = res.data
      if (apiData) {
        list.value = (apiData[options.listKey] as T[]) || []
        total.value = apiData.total || 0
      }
    } catch (err) {
      console.error(`[ListManager] 加载数据失败:`, err)
    } finally {
      loading.value = false
    }
  }

  // 分页变更处理
  const handlePageChange = (page: number) => {
    pagination.currentPage = page
    fetchList()
  }

  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.currentPage = 1
    fetchList()
  }

  // 搜索处理
  const handleSearch = () => {
    pagination.currentPage = 1
    fetchList()
  }

  // 重置处理
  const reset = () => {
    pagination.currentPage = 1
    query.keyword = ""
    if (options.initialQuery) {
      Object.assign(query, options.initialQuery)
    }
    fetchList()
  }

  // 生命周期：初始加载
  if (options.immediate !== false) {
    fetchList()
  }

  return {
    list,
    total,
    loading,
    pagination,
    query,
    offset,
    fetchList,
    handlePageChange,
    handleSizeChange,
    handleSearch,
    reset
  }
}
