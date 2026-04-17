import { ref, onMounted, reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listUsersApi, deleteUserApi } from "@/api/iam/user"
import type { User, ListUserRequest } from "@/api/iam/user/type"

export function useUserList() {
  const users = ref<User[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)

  // 交互状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  // 查询参数
  const query = reactive<ListUserRequest>({
    offset: 0,
    limit: 10,
    keyword: ""
  })

  const loadData = async () => {
    loading.value = true
    try {
      const { data } = await listUsersApi({
        ...query,
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      })
      users.value = data.users
      total.value = data.total
    } catch (error) {
      console.error("加载用户列表失败:", error)
    } finally {
      loading.value = false
    }
  }

  const handleRefresh = () => {
    currentPage.value = 1
    loadData()
  }

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

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    loadData()
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    loadData()
  }

  onMounted(loadData)

  return {
    users,
    total,
    currentPage,
    pageSize,
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
