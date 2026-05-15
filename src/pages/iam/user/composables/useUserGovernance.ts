import { ref, type Ref, computed } from "vue"
import { useTabRouter } from "@/common/composables/useTabRouter"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import { listUserRolesApi, batchAssignRoleApi, batchUnassignRoleApi, unassignRoleApi } from "@/api/iam/role"
import { listUserPoliciesApi, batchDetachPolicyApi, detachPolicyApi, batchAttachPolicyApi } from "@/api/iam/policy"
import {
  listUserTenantsApi,
  removeTenantMemberApi,
  batchAssignTenantsApi,
  batchUnassignTenantsApi
} from "@/api/iam/tenant"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useGovernanceRelationList } from "@/common/composables/useGovernanceRelationList"
import { AuthorizationSubType } from "@/api/iam/permission/type"
import type { User } from "@/api/iam/user/type"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import type { Tenant } from "@/api/iam/tenant/type"

export function useUserGovernance(user: Ref<User | undefined>) {
  const userId = computed(() => user.value?.id)
  const username = computed(() => user.value?.username)
  const { activeTab } = useTabRouter("sources")
  const { handleConfirmAction } = useGovernanceActions()
  const { hasPermission } = usePermission()

  // --- 1. 状态控制与权限 ---
  const roleSelectVisible = ref(false)
  const policySelectVisible = ref(false)
  const attachPolicyVisible = ref(false)
  const tenantSelectVisible = ref(false)
  const submitting = ref(false)

  const tabPermissions = computed(() => ({
    sources: hasPermission(IAM_CAPABILITIES.User.Detail),
    roles: hasPermission(IAM_CAPABILITIES.User.ViewUserRoles),
    permissions: hasPermission(IAM_CAPABILITIES.User.ViewUserPolicies),
    tenants: hasPermission(IAM_CAPABILITIES.User.ViewUserTenants)
  }))

  // --- 2. 关联列表治理抽象 ---

  // 角色列表管理
  const roleRelation = useGovernanceRelationList<Role, any>({
    fetchApi: (params) => listUserRolesApi({ ...params, user_id: userId.value! }),
    listKey: "roles",
    activeTab,
    tabName: "roles",
    enabled: () => !!userId.value && tabPermissions.value.roles
  })

  // 策略列表管理
  const policyRelation = useGovernanceRelationList<Policy, any>({
    fetchApi: (params) => listUserPoliciesApi({ ...params, user_id: userId.value! }),
    listKey: "policies",
    activeTab,
    tabName: "permissions",
    enabled: () => !!userId.value && tabPermissions.value.permissions
  })

  // 租户列表管理
  const tenantRelation = useGovernanceRelationList<Tenant, any>({
    fetchApi: (params) => listUserTenantsApi({ ...params, user_id: userId.value! }),
    listKey: "tenants",
    activeTab,
    tabName: "tenants",
    enabled: () => !!userId.value && tabPermissions.value.tenants
  })

  // --- 3. 核心业务动作 ---

  /** 批量分配角色 (RoleSelectDialog 回调) */
  const handleAssignRoles = async (selectedRoles: Role[]) => {
    if (!username.value || !selectedRoles.length) return
    submitting.value = true
    try {
      await batchAssignRoleApi({
        usernames: [username.value],
        role_codes: selectedRoles.map((r) => r.code)
      })
      roleSelectVisible.value = false
      roleRelation.refresh()
    } finally {
      submitting.value = false
    }
  }

  /** 解除角色关联 (单条) */
  const handleUnbindRole = (row: Role) => {
    if (!username.value) return
    handleConfirmAction({
      title: "移除角色关联",
      message: `确认要为用户 [${username.value}] 移除角色 [${row.name}] 的关联吗？`,
      api: () =>
        unassignRoleApi({
          username: username.value!,
          role_code: row.code
        }),
      onSuccess: () => roleRelation.refresh()
    })
  }

  /** 批量解除角色关联 */
  const handleBatchUnbindRoles = () => {
    if (!username.value || roleRelation.selectedRows.value.length === 0) return
    handleConfirmAction({
      title: "批量移除角色",
      message: `确认要为用户 [${username.value}] 批量移除所选的 ${roleRelation.selectedRows.value.length} 条角色关联吗？`,
      api: () =>
        batchUnassignRoleApi({
          usernames: [username.value!],
          role_codes: roleRelation.selectedRows.value.map((r) => r.code)
        }),
      onSuccess: () => roleRelation.refresh()
    })
  }

  /** 解除策略授权 (单条) */
  const handleUnbindPolicy = (row: Policy) => {
    if (!username.value) return
    handleConfirmAction({
      title: "解除策略授权",
      message: `确认要为用户 [${username.value}] 解除策略 [${row.name}] 的关联吗？`,
      api: () =>
        detachPolicyApi({
          sub_type: AuthorizationSubType.USER,
          sub_code: username.value!,
          policy_code: row.code
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  /** 批量解除策略授权 */
  const handleBatchUnbindPolicies = () => {
    if (!username.value || policyRelation.selectedRows.value.length === 0) return
    handleConfirmAction({
      title: "批量解除授权",
      message: `确认要批量解除所选的 ${policyRelation.selectedRows.value.length} 条策略关联吗？`,
      api: () =>
        batchDetachPolicyApi({
          assignments: policyRelation.selectedRows.value.map((p) => ({
            sub_type: AuthorizationSubType.USER,
            sub_code: username.value!,
            policy_code: p.code
          }))
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  /** 批量关联策略 (PolicySelectDialog 回调) */
  const handleAttachPolicies = async (selectedPolicies: Policy[]) => {
    if (!username.value || !selectedPolicies.length) return
    policyRelation.loading.value = true
    try {
      await batchAttachPolicyApi({
        subjects: [{ type: AuthorizationSubType.USER, code: username.value }],
        policy_codes: selectedPolicies.map((p) => p.code)
      })
      policySelectVisible.value = false
      policyRelation.refresh()
    } finally {
      policyRelation.loading.value = false
    }
  }

  /** 移除租户关联 (单条) */
  const handleUnbindTenant = (row: Tenant) => {
    if (!userId.value) return
    handleConfirmAction({
      title: "移除租户关联",
      message: `确定要将用户从租户空间 [${row.name}] 中移除吗？此操作将立即收回在该空间下的所有权限。`,
      api: () =>
        removeTenantMemberApi({
          tenant_id: row.id,
          user_id: userId.value!
        }),
      onSuccess: () => tenantRelation.refresh()
    })
  }

  /** 批量分配租户 (TenantSelectDialog 回调) */
  const handleAssignTenants = async (selectedTenants: Tenant[]) => {
    if (!userId.value || !selectedTenants.length) return
    tenantRelation.loading.value = true
    try {
      await batchAssignTenantsApi({
        user_ids: [userId.value],
        tenant_ids: selectedTenants.map((t) => t.id)
      })
      tenantSelectVisible.value = false
      tenantRelation.refresh()
    } finally {
      tenantRelation.loading.value = false
    }
  }

  /** 批量解除租户关联 */
  const handleBatchUnbindTenants = () => {
    if (!userId.value || tenantRelation.selectedRows.value.length === 0) return
    handleConfirmAction({
      title: "批量移除租户",
      message: `确认要将用户从所选的 ${tenantRelation.selectedRows.value.length} 个租户空间中移除吗？此操作将导致用户立即失去相关空间的所有访问权限。`,
      api: () =>
        batchUnassignTenantsApi({
          user_ids: [userId.value!],
          tenant_ids: tenantRelation.selectedRows.value.map((t) => t.id)
        }),
      onSuccess: () => tenantRelation.refresh()
    })
  }

  // --- 4. 辅助状态与联动 ---

  const handleRoleTypeChange = (type?: number) => {
    roleRelation.query.type = type
    roleRelation.handleSearch()
  }

  const handlePolicyTypeChange = (type?: number) => {
    policyRelation.query.type = type
    policyRelation.handleSearch()
  }

  const handleAddPolicy = () => (policySelectVisible.value = true)
  const handleAttachSuccess = () => policyRelation.refresh()

  return {
    activeTab,
    submitting,
    // 角色
    roles: roleRelation.list,
    roleTotal: roleRelation.total,
    roleLoading: roleRelation.loading,
    roleQuery: computed(() => ({
      ...roleRelation.query,
      currentPage: roleRelation.pagination.currentPage,
      pageSize: roleRelation.pagination.pageSize
    })),
    selectedRoles: roleRelation.selectedRows,
    roleSelectVisible,
    handleRolePageChange: roleRelation.handlePageChange,
    handleRoleSearch: roleRelation.handleSearch,
    handleRoleTypeChange,
    handleAssignRoles,
    handleUnbindRole,
    handleBatchUnbindRoles,
    // 策略
    policies: policyRelation.list,
    policyTotal: policyRelation.total,
    policyLoading: policyRelation.loading,
    policyQuery: computed(() => ({
      ...policyRelation.query,
      currentPage: policyRelation.pagination.currentPage,
      pageSize: policyRelation.pagination.pageSize
    })),
    selectedPolicies: policyRelation.selectedRows,
    policySelectVisible,
    attachPolicyVisible,
    handlePolicyPageChange: policyRelation.handlePageChange,
    handlePolicySearch: policyRelation.handleSearch,
    handlePolicyTypeChange,
    handleAddPolicy,
    handleAttachPolicies,
    handleAttachSuccess,
    handleUnbindPolicy,
    handleBatchUnbindPolicies,
    // 租户
    tenants: tenantRelation.list,
    tenantTotal: tenantRelation.total,
    tenantLoading: tenantRelation.loading,
    tenantQuery: computed(() => ({
      ...tenantRelation.query,
      currentPage: tenantRelation.pagination.currentPage,
      pageSize: tenantRelation.pagination.pageSize
    })),
    selectedTenants: tenantRelation.selectedRows,
    tenantSelectVisible,
    handleTenantPageChange: tenantRelation.handlePageChange,
    handleTenantSearch: tenantRelation.handleSearch,
    handleAssignTenants,
    handleUnbindTenant,
    handleBatchUnbindTenants,
    tabPermissions
  }
}
