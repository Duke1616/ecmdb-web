import { ref, onMounted, reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listRolesApi, deleteRoleApi } from "@/api/iam/role"
import type { Role, ListRoleReq } from "@/api/iam/role/type"

export function useRoleList() {
  const roles = ref<Role[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)

  // 交互状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)
  const currentEditCode = ref<string | null>(null)

  // 查询参数
  const query = reactive<ListRoleReq>({
    offset: 0,
    limit: 10,
    keyword: ""
  })

  const loadData = async () => {
    loading.value = true
    try {
      const { data } = await listRolesApi({
        ...query,
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      })
      roles.value = data.roles
      total.value = data.total
    } catch (error) {
      console.error("加载角色列表失败:", error)
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
    roles,
    total,
    currentPage,
    pageSize,
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
