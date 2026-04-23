import { ref, computed } from "vue"
import { listRolesApi, deleteRoleApi } from "@/api/iam/role"
import type { Role, ListRoleReq } from "@/api/iam/role/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

export function useRoleList() {
  // 使用通用列表管理器
  const {
    list: roles,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<Role, ListRoleReq>({
    fetchApi: listRolesApi,
    listKey: "roles",
    initialQuery: { keyword: "", offset: 0, limit: 10 }
  })

  // 交互与动作管理器
  const { handleConfirmAction } = useGovernanceActions()
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)
  const currentEditCode = ref<string | null>(null)

  const handleCreate = () => {
    currentEditId.value = null
    currentEditCode.value = null
    formVisible.value = true
  }

  const handleEdit = (row: Role) => {
    currentEditId.value = row.id
    currentEditCode.value = row.code
    formVisible.value = true
  }

  const handleDelete = (row: Role) => {
    handleConfirmAction({
      message: `确定要注销角色 "${row.name} (${row.code})" 吗？此操作不可逆。`,
      api: () => deleteRoleApi(row.id),
      onSuccess: loadData,
      successMsg: "角色已成功注销"
    })
  }

  const handleFormSuccess = () => {
    formVisible.value = false
    loadData()
  }

  return {
    roles,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    query,
    loading,
    formVisible,
    currentEditId,
    currentEditCode,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
