import { ref, computed } from "vue"
import { listUsersApi, deleteUserApi, batchDeleteUsersApi } from "@/api/iam/user"
import type { User, ListUserRequest } from "@/api/iam/user/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

export function useUserList() {
  // 使用通用列表管理器
  const {
    list: users,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<User, ListUserRequest>({
    fetchApi: listUsersApi,
    listKey: "users",
    initialQuery: { keyword: "", offset: 0, limit: 10 }
  })

  // 交互与动作管理器
  const { handleConfirmAction } = useGovernanceActions()
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)
  const selectedRows = ref<User[]>([])

  const handleBatchDelete = () => {
    if (selectedRows.value.length === 0) return
    handleConfirmAction({
      message: `确定要注销选中的 ${selectedRows.value.length} 个用户吗？此操作不可逆。`,
      api: () => batchDeleteUsersApi({ ids: selectedRows.value.map((r) => r.id) }),
      onSuccess: () => {
        selectedRows.value = []
        loadData()
      },
      successMsg: "选中的用户已成功注销"
    })
  }

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: User) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = (row: User) => {
    handleConfirmAction({
      message: `确定要注销用户 "${row.username} (${row.nickname})" 吗？此操作不可逆。`,
      api: () => deleteUserApi(row.id),
      onSuccess: loadData,
      successMsg: "主体已成功注销"
    })
  }

  const handleFormSuccess = () => {
    formVisible.value = false
    loadData()
  }

  return {
    users,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    query,
    loading,
    formVisible,
    currentEditId,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    selectedRows,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
