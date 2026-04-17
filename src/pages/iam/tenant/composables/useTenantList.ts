import { ref, onMounted, reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listTenantsApi, deleteTenantApi, switchTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"

export function useTenantList() {
  const tenants = ref<Tenant[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)

  // 交互状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  // 查询参数
  const query = reactive({
    offset: 0,
    limit: 10,
    keyword: "" // 虽然 API 类型里暂时没写，但 UI 预留搜索位
  })

  const loadData = async () => {
    loading.value = true
    try {
      const { data } = await listTenantsApi({
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      })
      tenants.value = data.tenants
      total.value = data.total
    } catch (error) {
      console.error("加载租户列表失败:", error)
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
      // 通常切换租户后需要刷新整个页面或全局状态
      window.location.reload()
    } catch (e) {
      // ignore cancel
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
    tenants,
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
    handleSwitch,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
