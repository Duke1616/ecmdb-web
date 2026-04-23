import { ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listRolesApi, deleteRoleApi } from "@/api/iam/role"
import type { Role, ListRoleReq } from "@/api/iam/role/type"
import { useListManager } from "@/common/composables/useListManager"

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

  // 交互状态
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

  const handleDelete = async (row: Role) => {
    try {
      await ElMessageBox.confirm(`确定要删除角色 "${row.name} (${row.code})" 吗？`, "警告", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
      await deleteRoleApi(row.id)
      ElMessage.success("删除成功")
      loadData()
    } catch (e) {
      if (e !== "cancel") {
        console.error("删除失败:", e)
      }
    }
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
