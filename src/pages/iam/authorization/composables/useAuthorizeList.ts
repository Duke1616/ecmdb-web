import { computed } from "vue"
import { listAuthorizationsApi } from "@/api/iam/permission"
import { type Authorization, type AuthorizationQueryReq } from "@/api/iam/permission/type"
import { batchDetachPolicyApi, detachPolicyApi } from "@/api/iam/policy"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useSelectionAction } from "@/common/composables/useSelectionAction"

/**
 * 授权治理列表管理
 */
export function useAuthorizeList() {
  const { handleConfirmAction } = useGovernanceActions()
  const { selectedRows, handleSelectionChange, runSelectionAction } = useSelectionAction<Authorization>()

  // 核心列表管理
  const {
    list: authorizations,
    total,
    loading,
    pagination,
    query,
    fetchList: handleRefresh,
    handlePageChange: handleCurrentChange,
    handleSizeChange
  } = useListManager<Authorization, AuthorizationQueryReq>({
    fetchApi: listAuthorizationsApi,
    listKey: "authorizations",
    initialQuery: {
      sub_type: undefined,
      obj_type: undefined
    }
  })

  /**
   * 解除授权 (危险操作)
   */
  const handleRevoke = (row: Authorization) => {
    handleConfirmAction({
      title: "权限回收确认",
      message: `确定要解除主体 [${row.subject}] 对目标 [${row.target}] 的授权吗？此操作将立即回收相关访问权限。`,
      confirmType: "danger",
      api: async () => {
        // NOTE: 单条解除授权使用专门的 /detach 接口，已支持通用主体类型
        return await detachPolicyApi({
          sub_type: row.sub_type,
          sub_code: row.subject,
          policy_code: row.target
        })
      },
      onSuccess: () => handleRefresh()
    })
  }

  /**
   * 批量解除授权
   */
  const handleBatchRevoke = () => {
    runSelectionAction({
      title: "批量回收确认",
      message: (items) => `确定要批量解除选中的 ${items.length} 条授权记录吗？`,
      confirmType: "danger",
      api: async (items) => {
        // NOTE: 后端已修复 batch-detach 接口，支持精准的 assignments 列表解绑
        // 这样可以一次性回收所有选中的 (主体 + 策略) 关联，而不再需要循环调用
        return await batchDetachPolicyApi({
          assignments: items.map((row) => ({
            sub_type: row.sub_type,
            sub_code: row.subject,
            policy_code: row.target
          }))
        })
      },
      onSuccess: () => handleRefresh()
    })
  }

  return {
    loading,
    authorizations,
    total,
    query,
    selectedRows,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    handleRefresh,
    handleSelectionChange,
    handleSizeChange,
    handleCurrentChange,
    handleRevoke,
    handleBatchRevoke
  }
}
