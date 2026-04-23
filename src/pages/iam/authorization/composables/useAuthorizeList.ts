import { listAuthorizationsApi } from "@/api/iam/permission"
import { type Authorization, type AuthorizationQueryReq } from "@/api/iam/permission/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

/**
 * 授权治理列表管理
 */
export function useAuthorizeList() {
  const { handleConfirmAction } = useGovernanceActions()

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
        // TODO: 等待后端解除授权 API 完善
        // return await revokeAuthorizationApi(row.id)
        return Promise.resolve()
      },
      onSuccess: () => handleRefresh()
    })
  }

  return {
    loading,
    authorizations,
    total,
    query,
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    handleRefresh,
    handleSizeChange,
    handleCurrentChange,
    handleRevoke
  }
}
