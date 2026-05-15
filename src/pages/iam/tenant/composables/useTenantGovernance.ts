import { ref, toValue, type MaybeRefOrGetter, computed, type Ref } from "vue"
import { ElMessage } from "element-plus"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import { listTenantMembersApi, removeTenantMemberApi } from "@/api/iam/tenant"
import {
  listInvitationsApi,
  revokeInvitationApi,
  batchRevokeInvitationApi,
  listJoinRequestsApi,
  handleJoinRequestApi
} from "@/api/iam/invitation"
import { useGovernanceRelationList } from "@/common/composables/useGovernanceRelationList"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { batchAssignTenantsApi, batchUnassignTenantsApi } from "@/api/iam/tenant"
import type { TenantMember } from "@/api/iam/tenant/type"
import type { InvitationVO, JoinRequestVO } from "@/api/iam/invitation/type"

export function useTenantGovernance(tenantId: MaybeRefOrGetter<number | undefined>, activeTab: Ref<string>) {
  const tid = computed(() => toValue(tenantId))
  const { handleConfirmAction } = useGovernanceActions()
  const { hasPermission } = usePermission()

  const tabPermissions = computed(() => ({
    members: hasPermission(IAM_CAPABILITIES.Tenant.ViewMembers),
    invitation: hasPermission(IAM_CAPABILITIES.Invitation.View),
    requests: hasPermission(IAM_CAPABILITIES.Invitation.ViewRequests)
  }))

  // --- 1. 成员治理 ---
  const memberRelation = useGovernanceRelationList<TenantMember, any>({
    fetchApi: (params) => listTenantMembersApi({ ...params, tenant_id: tid.value! }),
    listKey: "members",
    activeTab,
    tabName: "members",
    enabled: () => !!tid.value && tabPermissions.value.members
  })

  // --- 2. 邀请链接治理 ---
  const linksRelation = useGovernanceRelationList<InvitationVO, any>({
    fetchApi: (params) => listInvitationsApi({ ...params, tenant_id: tid.value! }),
    listKey: "invitations",
    activeTab,
    tabName: "invitation", // 注意：detail.vue 中名字可能是 invitation 或 links，这里需同步
    enabled: () => !!tid.value && tabPermissions.value.invitation
  })

  // --- 3. 入驻申请治理 ---
  const requestsRelation = useGovernanceRelationList<JoinRequestVO, any>({
    fetchApi: (params) => listJoinRequestsApi({ ...params, tenant_id: tid.value! }),
    listKey: "requests",
    activeTab,
    tabName: "requests",
    enabled: () => !!tid.value && tabPermissions.value.requests
  })

  // --- 操作处理 ---

  const assignConfirmLoading = ref(false)
  const handleBatchAssignMember = async (userIds: number[]) => {
    if (!tid.value || userIds.length === 0) return
    assignConfirmLoading.value = true
    try {
      await batchAssignTenantsApi({
        user_ids: userIds,
        tenant_ids: [tid.value!]
      })
      ElMessage.success(`成功分派 ${userIds.length} 位成员`)
      memberRelation.refresh()
      return true
    } catch (err: any) {
      memberRelation.refresh()
      return false
    } finally {
      assignConfirmLoading.value = false
    }
  }

  const handleRevokeInvitation = (row: InvitationVO) => {
    handleConfirmAction({
      title: "撤回邀请凭证",
      message: `确定要撤回邀请码 "${row.code}" 吗？撤回后该链接将立即失效。`,
      api: () => revokeInvitationApi(row.code),
      onSuccess: () => linksRelation.refresh()
    })
  }

  const handleBatchRevokeInvitation = () => {
    if (linksRelation.selectedRows.value.length === 0) return
    const codes = linksRelation.selectedRows.value.map((l) => l.code)
    handleConfirmAction({
      title: "批量撤回凭证",
      message: `确定要批量撤回选中的 ${codes.length} 个邀请吗？撤回后这些链接将立即失效。`,
      api: () => batchRevokeInvitationApi({ codes }),
      onSuccess: () => linksRelation.refresh()
    })
  }

  const handleRemoveMember = (row: TenantMember) => {
    if (!tid.value) return
    handleConfirmAction({
      title: "移除成员",
      message: `确定要将成员 "${row.nickname || row.username}" 移出当前租户空间吗？移除后该用户将失去在该租户下的所有权限。`,
      api: () =>
        removeTenantMemberApi({
          tenant_id: tid.value!,
          user_id: row.id
        }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  const handleBatchRemoveMember = () => {
    if (memberRelation.selectedRows.value.length === 0 || !tid.value) return
    const userIds = memberRelation.selectedRows.value.map((m) => m.id)

    handleConfirmAction({
      title: "批量移除成员",
      message: `确定要将选中的 ${userIds.length} 位成员批量移出当前租户空间吗？移除后他们将失去在该租户下的所有权限。`,
      api: () =>
        batchUnassignTenantsApi({
          user_ids: userIds,
          tenant_ids: [tid.value!]
        }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  const handleApproval = async (id: number, approve: boolean) => {
    const action = approve ? "通过" : "拒绝"
    try {
      await handleJoinRequestApi({ id, approve, tenant_id: tid.value! })
      ElMessage.success(`申请已${action}`)
      requestsRelation.refresh()
    } catch (error) {
      console.error("Approval failed:", error)
    }
  }

  return {
    // 成员
    members: memberRelation.list,
    memberTotal: memberRelation.total,
    memberLoading: memberRelation.loading,
    memberQuery: computed(() => ({
      ...memberRelation.query,
      currentPage: memberRelation.pagination.currentPage,
      pageSize: memberRelation.pagination.pageSize
    })),
    handleMemberPageChange: memberRelation.handlePageChange,
    handleMemberSearch: memberRelation.handleSearch,
    handleBatchAssignMember,
    handleRemoveMember,
    handleBatchRemoveMember,
    membersSelection: memberRelation.selectedRows,
    assignConfirmLoading,

    // 邀请
    links: linksRelation.list,
    linksTotal: linksRelation.total,
    linksLoading: linksRelation.loading,
    linksQuery: computed(() => ({
      ...linksRelation.query,
      currentPage: linksRelation.pagination.currentPage,
      pageSize: linksRelation.pagination.pageSize
    })),
    handleLinksPageChange: linksRelation.handlePageChange,
    handleLinksSearch: linksRelation.handleSearch,
    handleRevokeInvitation,
    handleBatchRevokeInvitation,
    linksSelection: linksRelation.selectedRows,
    fetchLinks: linksRelation.refresh,

    // 申请
    requests: requestsRelation.list,
    requestsTotal: requestsRelation.total,
    requestsLoading: requestsRelation.loading,
    requestsQuery: computed(() => ({
      ...requestsRelation.query,
      currentPage: requestsRelation.pagination.currentPage,
      pageSize: requestsRelation.pagination.pageSize
    })),
    handleRequestsPageChange: requestsRelation.handlePageChange,
    handleRequestsSearch: requestsRelation.handleSearch,
    handleApproval,
    fetchRequests: requestsRelation.refresh,
    tabPermissions
  }
}
