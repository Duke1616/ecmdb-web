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
    pageSizes: [10, 20, 50],
    pageSize: 5,
    layout: "prev, pager, next"
  }
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

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
