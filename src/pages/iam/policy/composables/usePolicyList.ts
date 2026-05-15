import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { listPoliciesApi, deletePolicyApi, batchDeletePoliciesApi } from "@/api/iam/policy"
import type { Policy, ListPolicyRequest } from "@/api/iam/policy/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useSelectionAction } from "@/common/composables/useSelectionAction"

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
  const { selectedRows, handleSelectionChange, runSelectionAction } = useSelectionAction<Policy>()
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
    if (row.type === 1) {
      ElMessage.warning("系统预设策略不支持删除")
      return
    }

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
    runSelectionAction({
      getItems: (rows) => rows.filter((p) => p.type !== 1),
      emptyMsg: "请先选择可删除的自定义策略",
      message: (items) => `确定要批量删除这 ${items.length} 个策略定义吗？系统预设策略将被自动忽略。`,
      api: (items) => batchDeletePoliciesApi({ codes: items.map((p) => p.code) }),
      onSuccess: loadData,
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
