import { ref, computed } from "vue"
import { listGroupsApi, deleteGroupApi } from "@/api/iam/group"
import type { Group, ListGroupRequest } from "@/api/iam/group/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useSelectionAction } from "@/common/composables/useSelectionAction"

export function useGroupList() {
  const {
    list: groups,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<Group, ListGroupRequest>({
    fetchApi: listGroupsApi,
    listKey: "groups",
    initialQuery: { keyword: "", offset: 0, limit: 10 }
  })

  const { handleConfirmAction } = useGovernanceActions()
  const { selectedRows, handleSelectionChange, runSelectionAction } = useSelectionAction<Group>()
  const formVisible = ref(false)
  const currentEditCode = ref<string | null>(null)

  const handleBatchDelete = () => {
    runSelectionAction({
      message: (items) => `确定要删除选中的 ${items.length} 个用户组吗？此操作不可逆。`,
      api: (items) => Promise.all(items.map((row) => deleteGroupApi(row.id))),
      onSuccess: loadData,
      successMsg: "选中的用户组已成功删除"
    })
  }

  const handleCreate = () => {
    currentEditCode.value = null
    formVisible.value = true
  }

  const handleEdit = (row: Group) => {
    currentEditCode.value = row.code
    formVisible.value = true
  }

  const handleDelete = (row: Group) => {
    handleConfirmAction({
      message: `确定要删除用户组 "${row.name} (${row.code})" 吗？此操作不可逆。`,
      api: () => deleteGroupApi(row.id),
      onSuccess: loadData,
      successMsg: "用户组已成功删除"
    })
  }

  const handleFormSuccess = () => {
    formVisible.value = false
    loadData()
  }

  return {
    groups,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    query,
    loading,
    formVisible,
    currentEditCode,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    selectedRows,
    handleSelectionChange,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
