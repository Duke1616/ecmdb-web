import { ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listUsersApi, deleteUserApi } from "@/api/iam/user"
import type { User, ListUserRequest } from "@/api/iam/user/type"
import { useListManager } from "@/common/composables/useListManager"

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

  // 交互状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: User) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = async (row: User) => {
    try {
      await ElMessageBox.confirm(`确定要删除用户 "${row.username} (${row.nickname})" 吗？`, "警告", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
      await deleteUserApi(row.id)
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
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
