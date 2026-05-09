import { ref, watch, toValue, type MaybeRefOrGetter, computed, type Ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { listTenantMembersApi, assignTenantUserApi } from "@/api/iam/tenant"
import {
  listInvitationsApi,
  revokeInvitationApi,
  listJoinRequestsApi,
  handleJoinRequestApi
} from "@/api/iam/invitation"
import { useListManager } from "@/common/composables/useListManager"
import type { TenantMember } from "@/api/iam/tenant/type"
import type { InvitationVO, JoinRequestVO } from "@/api/iam/invitation/type"

export function useTenantGovernance(tenantId: MaybeRefOrGetter<number | undefined>, activeTab: Ref<string>) {
  const tid = computed(() => toValue(tenantId))

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
    fetchApi: (params) => listInvitationsApi(params),
    listKey: "invitations",
    immediate: false
  })

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
    fetchApi: (params) => listJoinRequestsApi(params),
    listKey: "requests",
    immediate: false
  })

  // --- 操作处理 ---

  const assignConfirmLoading = ref(false)
  const handleBatchAssignMember = async (userIds: number[]) => {
    if (!tid.value || userIds.length === 0) return
    assignConfirmLoading.value = true
    try {
      await Promise.all(
        userIds.map((uid) =>
          assignTenantUserApi({
            tenant_id: tid.value!,
            user_id: uid
          })
        )
      )
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
    ElMessageBox.confirm(`确定要撤回邀请码 "${row.code}" 吗？撤回后该链接将立即失效。`, "安全警告", {
      confirmButtonText: "确定撤回",
      cancelButtonText: "取消",
      type: "warning"
    }).then(async () => {
      await revokeInvitationApi(row.code)
      ElMessage.success("邀请链接已撤回")
      loadLinks()
    })
  }

  const handleApproval = async (id: number, approve: boolean) => {
    const action = approve ? "通过" : "拒绝"
    try {
      await handleJoinRequestApi({ id, approve })
      ElMessage.success(`申请已${action}`)
      loadRequests()
    } catch (error) {
      console.error("Approval failed:", error)
    }
  }

  // --- 核心联动逻辑：根据当前选中的 Tab 触发请求 ---
  const refresh = () => {
    if (!tid.value) return
    const tab = toValue(activeTab)
    if (tab === "members") loadMembers()
    if (tab === "invitation" || tab === "links") loadLinks()
    if (tab === "requests") loadRequests()
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
    fetchRequests: loadRequests
  }
}
