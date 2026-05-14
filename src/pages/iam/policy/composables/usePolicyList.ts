import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { listPoliciesApi, deletePolicyApi, batchDeletePoliciesApi } from "@/api/iam/policy"
import type { Policy, ListPolicyRequest } from "@/api/iam/policy/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

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

  // 交互与动作管理器
  const { handleConfirmAction } = useGovernanceActions()
  const jsonVisible = ref(false)
  const selectedPolicy = ref<Policy | null>(null)
  const selectedRows = ref<Policy[]>([])

  const handleSelectionChange = (val: Policy[]) => {
    selectedRows.value = val
  }

  const handleCreate = () => {
    router.push({ name: "PolicyCreation" })
  }

  const handleEdit = (row: Policy) => {
    router.push({
      name: "PolicyEdit",
      query: { code: row.code }
    })
  }

  const handleDelete = (row: Policy) => {
    handleConfirmAction({
      message: `确定要永久删除策略 "${row.name}" 吗？此操作不可逆。`,
      api: () => deletePolicyApi(row.code),
      onSuccess: loadData,
      successMsg: "策略已成功删除"
    })
  }

  const handleViewJson = (row: Policy) => {
    selectedPolicy.value = row
    jsonVisible.value = true
  }

  const handleBatchDelete = () => {
    const codes = selectedRows.value.map((p) => p.code)
    handleConfirmAction({
      message: `确定要批量删除这 ${codes.length} 个策略定义吗？系统预设策略将被自动忽略。`,
      api: () => batchDeletePoliciesApi({ codes }),
      onSuccess: () => {
        selectedRows.value = []
        loadData()
      },
      successMsg: "选中的策略已批量注销"
    })
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
    selectedRows,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    handleViewJson,
    handleSelectionChange,
    handleSizeChange,
    handleCurrentChange
  }
}
