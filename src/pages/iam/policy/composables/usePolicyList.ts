import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { listPoliciesApi } from "@/api/iam/policy"
import type { Policy } from "@/api/iam/policy/type"

export function usePolicyList() {
  const router = useRouter()
  const policies = ref<Policy[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 交互状态
  const drawerVisible = ref(false)
  const isEdit = ref(false)
  const submitting = ref(false)
  const jsonVisible = ref(false)
  const selectedPolicy = ref<Policy | null>(null)

  const loadData = async () => {
    try {
      const { data } = await listPoliciesApi({
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      })
      policies.value = data.policies
      total.value = data.total
    } catch (error) {
      console.error("加载策略列表失败:", error)
    }
  }

  const handleRefresh = () => {
    currentPage.value = 1
    loadData()
  }

  const handleCreate = () => {
    router.push("/iam/policy/create")
  }

  const handleEdit = (row: Policy) => {
    router.push({
      path: "/iam/policy/edit",
      query: { id: row.id }
    })
  }

  const handleDelete = async (row: Policy) => {
    try {
      await ElMessageBox.confirm(`确定要删除策略 "${row.name}" 吗？`, "警告", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
      // TODO: 调用删除 API
      ElMessage.success("删除成功")
      loadData()
    } catch {
      console.log("删除失败")
    }
  }

  const handleViewJson = (row: Policy) => {
    selectedPolicy.value = row
    jsonVisible.value = true
  }

  const handleSizeChange = () => loadData()
  const handleCurrentChange = () => loadData()

  const handleSuccess = () => {
    drawerVisible.value = false
    loadData()
  }

  onMounted(loadData)

  return {
    policies,
    total,
    currentPage,
    pageSize,
    drawerVisible,
    isEdit,
    submitting,
    jsonVisible,
    selectedPolicy,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleViewJson,
    handleSizeChange,
    handleCurrentChange,
    handleSuccess
  }
}
