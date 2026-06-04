import { ref } from "vue"
import { listUsersApi } from "@/api/iam/user"
import type { User as IIamUser } from "@/api/iam/user/type"
import { useUserStore } from "@/pinia/stores/user"
import { debounce } from "lodash-es"

export interface IMemberUser {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  job_title?: string
}

/**
 * 统一的用户数据与解析 Hook
 * @param options 配置参数，支持自定义 pageSize
 */
export function useUsers(options: { pageSize?: number } = {}) {
  const userStore = useUserStore()
  const loading = ref(false)
  const usersList = ref<IIamUser[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = options.pageSize || 10
  const keyword = ref("")

  // 加载用户列表 (带分页和检索)
  const loadUsersList = async () => {
    loading.value = true
    try {
      const { data } = await listUsersApi({
        offset: (currentPage.value - 1) * pageSize,
        limit: pageSize,
        keyword: keyword.value.trim() || undefined
      })
      usersList.value = data.users || []
      total.value = data.total || 0
    } catch (error) {
      console.error("加载用户列表失败:", error)
      usersList.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 暴露防抖的搜索函数
  const debouncedSearch = debounce(() => {
    currentPage.value = 1
    loadUsersList()
  }, 300)

  const handleSearch = () => {
    debouncedSearch()
  }

  const handlePageChange = (page: number) => {
    currentPage.value = page
    loadUsersList()
  }

  // 批量反解用户名到完整用户对象
  const selectedUsers = ref<IMemberUser[]>([])

  const loadSelectedUsers = async (usernames: string[]) => {
    if (!usernames?.length) {
      selectedUsers.value = []
      return
    }

    try {
      const users = await userStore.batchGetUsersByUsername(usernames)
      selectedUsers.value = users.map((u) => ({
        id: u.id,
        username: u.username,
        nickname: u.nickname || u.username,
        avatar: u.avatar || "",
        email: u.email || "",
        phone: u.phone || "",
        job_title: u.job_title || ""
      }))
    } catch (error) {
      console.error("批量解析选中用户失败:", error)
      selectedUsers.value = []
    }
  }

  return {
    loading,
    usersList,
    total,
    currentPage,
    pageSize,
    keyword,
    loadUsersList,
    handleSearch,
    handlePageChange,
    selectedUsers,
    loadSelectedUsers
  }
}
