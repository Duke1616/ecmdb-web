import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { listPoliciesApi } from "@/api/iam/policy"
import type { Policy, ListPolicyRequest } from "@/api/iam/policy/type"
import { useListManager } from "@/common/composables/useListManager"

export function usePolicyList() {
  const router = useRouter()

  // 使用通用列表管理器
  const {
    list: policies,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<Policy, ListPolicyRequest>({
    fetchApi: listPoliciesApi,
    listKey: "policies",
    initialQuery: { keyword: "", type: undefined, offset: 0, limit: 10 }
  })

  // 交互状态
  const jsonVisible = ref(false)
  const selectedPolicy = ref<Policy | null>(null)

  const handleCreate = () => {
    router.push({ name: "PolicyCreation" })
  }

  const handleEdit = (row: Policy) => {
    router.push({
      name: "PolicyEdit",
      query: { code: row.code }
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
      // console.log("删除取消")
    }
  }

  const handleViewJson = (row: Policy) => {
    selectedPolicy.value = row
    jsonVisible.value = true
  }

  return {
    policies,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    loading,
    query,
    jsonVisible,
    selectedPolicy,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleViewJson,
    handleSizeChange,
    handleCurrentChange
  }
}
