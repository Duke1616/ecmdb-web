import { ref, computed } from "vue"
import { listTenantsApi, deleteTenantApi, batchDeleteTenantsApi, switchTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useSelectionAction } from "@/common/composables/useSelectionAction"

export function useTenantList() {
  // 使用通用列表管理器
  const {
    list: tenants,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<Tenant, any>({
    fetchApi: listTenantsApi,
    listKey: "tenants",
    initialQuery: { keyword: "" }
  })

  // 交互与动作管理器
  const { handleConfirmAction } = useGovernanceActions()
  const { selectedRows, handleSelectionChange, runSelectionAction } = useSelectionAction<Tenant>()
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  const handleBatchDelete = () => {
    runSelectionAction({
      title: "批量高危操作确认",
      message: (items) => `确定要永久删除选中的 ${items.length} 个租户空间吗？此操作不可逆！`,
      api: (items) => batchDeleteTenantsApi({ ids: items.map((r) => r.id) }),
      onSuccess: loadData,
      successMsg: "选中的租户空间已成功移除"
    })
  }

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: Tenant) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = (row: Tenant) => {
    handleConfirmAction({
      title: "高危操作确认",
      message: `确定要永久删除租户空间 "${row.name} (${row.code})" 吗？此操作不可逆！`,
      api: () => deleteTenantApi(row.id),
      onSuccess: loadData,
      successMsg: "租户空间已成功移除"
    })
  }

  const handleSwitch = (row: Tenant) => {
    handleConfirmAction({
      title: "上下文切换",
      message: `确定要切换到租户空间 "${row.name}" 吗？`,
      confirmType: "primary",
      api: () => switchTenantApi(row.id),
      onSuccess: () => window.location.reload(),
      successMsg: `已成功切换至: ${row.name}`
    })
  }

  const handleFormSuccess = () => {
    formVisible.value = false
    loadData()
  }

  return {
    tenants,
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
    handleSelectionChange,
    handleSwitch,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
