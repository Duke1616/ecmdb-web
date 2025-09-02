import { ref, nextTick, onMounted, onUnmounted } from "vue"
import { findByUsernameApi, listUsersByKeywordApi } from "@/api/user"
import { usePagination } from "@@/composables/usePagination"
import type { user } from "@/api/user/types/user"

export function useUsers() {
  // State
  const loading = ref<boolean>(false)
  const keyword = ref<string>("")
  const usersData = ref<user[]>([])
  const showUserPicker = ref(false)
  const searchKeyword = ref("")
  const selectedUser = ref<user | null>(null)
  const searchInputRef = ref<HTMLInputElement>()

  // Pagination setup
  const init = {
    total: 0,
    currentPage: 1,
    pageSize: 3,
    layout: "prev, pager, next"
  }
  const { paginationData, handleCurrentChange: originalHandleCurrentChange, handleSizeChange } = usePagination(init)

  // 重写 handleCurrentChange 以重新加载数据
  const handleCurrentChange = (page: number) => {
    originalHandleCurrentChange(page)
    if (showUserPicker.value) {
      listUsersData()
    }
  }

  // Methods
  const listUsersData = () => {
    loading.value = true
    listUsersByKeywordApi({
      keyword: keyword.value,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })
      .then(({ data }) => {
        paginationData.total = data.total
        usersData.value = data.users
      })
      .catch(() => {
        usersData.value = []
      })
      .finally(() => {
        loading.value = false
      })
  }

  const getUserByUsername = (username: string) => {
    if (!username) return Promise.resolve(null)

    loading.value = true
    return findByUsernameApi(username)
      .then(({ data }) => {
        selectedUser.value = data
        return data
      })
      .catch(() => {
        selectedUser.value = null
        return null
      })
      .finally(() => {
        loading.value = false
      })
  }

  const toggleUserPicker = () => {
    showUserPicker.value = !showUserPicker.value
    if (showUserPicker.value) {
      // 重置分页到第一页
      paginationData.currentPage = 1
      // 加载初始数据（如果有搜索关键词则搜索，否则加载所有用户）
      if (searchKeyword.value) {
        keyword.value = searchKeyword.value
        listUsersData()
      } else {
        // 如果没有搜索关键词，可以加载一些默认用户或清空列表
        usersData.value = []
        paginationData.total = 0
      }
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }

  const selectUser = (user: user, callback?: (user: user) => void) => {
    selectedUser.value = user
    showUserPicker.value = false
    if (callback) {
      callback(user)
    }
  }

  const handleSearch = () => {
    if (searchKeyword.value) {
      keyword.value = searchKeyword.value
      paginationData.currentPage = 1
      listUsersData()
    } else {
      usersData.value = []
    }
  }

  const remoteMethod = (query: string) => {
    searchKeyword.value = query
    handleSearch()
  }

  const closeUserPicker = () => {
    showUserPicker.value = false
  }

  // Click outside handler
  const handleClickOutside = (e: Event) => {
    const target = e.target as HTMLElement
    if (!target.closest(".user-picker-container")) {
      showUserPicker.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener("click", handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside)
  })

  return {
    // State
    loading,
    keyword,
    usersData,
    showUserPicker,
    searchKeyword,
    selectedUser,
    searchInputRef,
    paginationData,

    // Methods
    listUsersData,
    getUserByUsername,
    toggleUserPicker,
    selectUser,
    handleSearch,
    remoteMethod,
    closeUserPicker,
    handleCurrentChange,
    handleSizeChange
  }
}
