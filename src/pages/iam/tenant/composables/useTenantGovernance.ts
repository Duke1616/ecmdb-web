import { ref, watch, toValue, type MaybeRefOrGetter, computed, type Ref } from "vue"
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
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { batchAssignTenantsApi, batchUnassignTenantsApi } from "@/api/iam/tenant"
import type { TenantMember } from "@/api/iam/tenant/type"
import type { InvitationVO, JoinRequestVO } from "@/api/iam/invitation/type"

export function useTenantGovernance(tenantId: MaybeRefOrGetter<number | undefined>, activeTab: Ref<string>) {
  const tid = computed(() => toValue(tenantId))
  const { handleConfirmAction } = useGovernanceActions()

  // --- 1. 成员治理 ---
  const {
    list: members,
    total: memberTotal,
    loading: memberLoading,
    pagination: memberPagination,
    query: memberQuery,
    fetchList: loadMembers,
    handlePageChange: handleMemberPageChange,
    handleSearch: handleMemberSearch
  } = useListManager<TenantMember, any>({
    fetchApi: (params) => listTenantMembersApi({ ...params, tenant_id: tid.value! }),
    listKey: "members",
    immediate: false
  })

  const membersSelection = ref<TenantMember[]>([])

  // --- 2. 邀请链接治理 ---
  const {
    list: links,
    total: linksTotal,
    loading: linksLoading,
    pagination: linksPagination,
    query: linksQuery,
    fetchList: loadLinks,
    handlePageChange: handleLinksPageChange,
    handleSearch: handleLinksSearch
  } = useListManager<InvitationVO, any>({
    fetchApi: (params) => listInvitationsApi({ ...params, tenant_id: tid.value! }),
    listKey: "invitations",
    immediate: false
  })

  const linksSelection = ref<InvitationVO[]>([])

  // --- 3. 入驻申请治理 ---
  const {
    list: requests,
    total: requestsTotal,
    loading: requestsLoading,
    pagination: requestsPagination,
    query: requestsQuery,
    fetchList: loadRequests,
    handlePageChange: handleRequestsPageChange,
    handleSearch: handleRequestsSearch
  } = useListManager<JoinRequestVO, any>({
    fetchApi: (params) => listJoinRequestsApi({ ...params, tenant_id: tid.value! }),
    listKey: "requests",
    immediate: false
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
      loadMembers()
      return true
    } catch (err: any) {
      loadMembers()
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
      onSuccess: () => loadLinks()
    })
  }

  const handleBatchRevokeInvitation = () => {
    if (linksSelection.value.length === 0) return
    const codes = linksSelection.value.map((l) => l.code)
    handleConfirmAction({
      title: "批量撤回凭证",
      message: `确定要批量撤回选中的 ${codes.length} 个邀请吗？撤回后这些链接将立即失效。`,
      api: () => batchRevokeInvitationApi({ codes }),
      onSuccess: () => {
        linksSelection.value = []
        loadLinks()
      }
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
      onSuccess: () => loadMembers()
    })
  }

  const handleBatchRemoveMember = () => {
    if (membersSelection.value.length === 0 || !tid.value) return
    const targets = membersSelection.value
    const userIds = targets.map((m) => m.id)

    handleConfirmAction({
      title: "批量移除成员",
      message: `确定要将选中的 ${targets.length} 位成员批量移出当前租户空间吗？移除后他们将失去在该租户下的所有权限。`,
      api: () =>
        batchUnassignTenantsApi({
          user_ids: userIds,
          tenant_ids: [tid.value!]
        }),
      onSuccess: () => {
        membersSelection.value = []
        loadMembers()
      }
    })
  }

  const handleApproval = async (id: number, approve: boolean) => {
    const action = approve ? "通过" : "拒绝"
    try {
      await handleJoinRequestApi({ id, approve, tenant_id: tid.value! })
      ElMessage.success(`申请已${action}`)
      loadRequests()
    } catch (error) {
      console.error("Approval failed:", error)
    }
  }

  // --- 4. 联动逻辑 (Lazy Loading) ---
  const { hasPermission } = usePermission()

  const tabPermissions = computed(() => ({
    members: hasPermission(IAM_CAPABILITIES.Tenant.ViewMembers),
    invitation: hasPermission(IAM_CAPABILITIES.Invitation.View),
    requests: hasPermission(IAM_CAPABILITIES.Invitation.ViewRequests)
  }))

  const refresh = () => {
    if (!tid.value) return
    const tab = toValue(activeTab)
    if (tab === "members" && tabPermissions.value.members) loadMembers()
    if ((tab === "invitation" || tab === "links") && tabPermissions.value.invitation) loadLinks()
    if (tab === "requests" && tabPermissions.value.requests) loadRequests()
  }

  watch([tid, () => toValue(activeTab)], () => refresh(), { immediate: true })

  return {
    // 成员
    members,
    memberTotal,
    memberLoading,
    memberQuery: computed(() => ({
      ...memberQuery,
      currentPage: memberPagination.currentPage,
      pageSize: memberPagination.pageSize
    })),
    handleMemberPageChange,
    handleMemberSearch,
    handleBatchAssignMember,
    handleRemoveMember,
    handleBatchRemoveMember,
    membersSelection,
    assignConfirmLoading,

    // 邀请
    links,
    linksTotal,
    linksLoading,
    linksQuery: computed(() => ({
      ...linksQuery,
      currentPage: linksPagination.currentPage,
      pageSize: linksPagination.pageSize
    })),
    handleLinksPageChange,
    handleLinksSearch,
    handleRevokeInvitation,
    handleBatchRevokeInvitation,
    linksSelection,
    fetchLinks: loadLinks,

    // 申请
    requests,
    requestsTotal,
    requestsLoading,
    requestsQuery: computed(() => ({
      ...requestsQuery,
      currentPage: requestsPagination.currentPage,
      pageSize: requestsPagination.pageSize
    })),
    handleRequestsPageChange,
    handleRequestsSearch,
    handleApproval,
    fetchRequests: loadRequests,
    tabPermissions
  }
}
