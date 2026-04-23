import { ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listTenantsApi, deleteTenantApi, switchTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"
import { useListManager } from "@/common/composables/useListManager"

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

  // 交互状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: Tenant) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = async (row: Tenant) => {
    try {
      await ElMessageBox.confirm(`确定要永久删除租户空间 "${row.name} (${row.code})" 吗？此操作不可逆！`, "高危警告", {
        type: "error",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger"
      })
      await deleteTenantApi(row.id)
      ElMessage.success("租户空间已成功移除")
      loadData()
    } catch (e) {
      if (e !== "cancel") {
        console.error("删除失败:", e)
      }
    }
  }

  const handleSwitch = async (row: Tenant) => {
    try {
      await ElMessageBox.confirm(`切换到租户空间 "${row.name}"？`, "上下文切换", {
        confirmButtonText: "立即切换",
        cancelButtonText: "取消"
      })
      await switchTenantApi({ tenant_id: row.id })
      ElMessage.success(`已成功切换至: ${row.name}`)
      window.location.reload()
    } catch (e) {
      // ignore cancel
    }
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
    handleSwitch,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
