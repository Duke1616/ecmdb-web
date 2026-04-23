import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { listPoliciesApi } from "@/api/iam/policy"
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
      api: () => Promise.resolve(true), // TODO: 待接入真实删除 API
      onSuccess: loadData,
      successMsg: "策略已成功删除"
    })
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
