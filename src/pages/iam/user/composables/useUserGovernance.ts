import { ref, watch, type Ref, computed, toValue } from "vue"
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
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
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

  // --- 1. 状态控制 ---
  const roleSelectVisible = ref(false)
  const policySelectVisible = ref(false)
  const attachPolicyVisible = ref(false)
  const tenantSelectVisible = ref(false)
  const submitting = ref(false)

  // --- 2. 列表治理集成 ---

  // 角色列表管理
  const {
    list: roles,
    total: roleTotal,
    loading: roleLoading,
    pagination: rolePagination,
    query: roleQuery,
    fetchList: loadRoles,
    handlePageChange: handleRolePageChange,
    handleSearch: handleRoleSearch
  } = useListManager<Role, any>({
    fetchApi: (params) => listUserRolesApi({ ...params, user_id: userId.value! }),
    listKey: "roles",
    immediate: false
  })

  // 策略列表管理
  const {
    list: policies,
    total: policyTotal,
    loading: policyLoading,
    pagination: policyPagination,
    query: policyQuery,
    fetchList: loadPolicies,
    handlePageChange: handlePolicyPageChange,
    handleSearch: handlePolicySearch
  } = useListManager<Policy, any>({
    fetchApi: (params) => listUserPoliciesApi({ ...params, user_id: userId.value! }),
    listKey: "policies",
    immediate: false
  })

  // 租户列表管理
  const {
    list: tenants,
    total: tenantTotal,
    loading: tenantLoading,
    pagination: tenantPagination,
    query: tenantQuery,
    fetchList: loadTenants,
    handlePageChange: handleTenantPageChange,
    handleSearch: handleTenantSearch
  } = useListManager<Tenant, any>({
    fetchApi: (params) => listUserTenantsApi({ ...params, user_id: userId.value! }),
    listKey: "tenants",
    immediate: false
  })

  // --- 3. 核心业务动作 ---

  /** 批量分配角色 (RoleSelectDialog 回调) */
  const handleAssignRoles = async (selectedRoles: Role[]) => {
    if (!username.value || !selectedRoles.length) return
    submitting.value = true
    try {
      // NOTE: 利用后端优化的 Cartesian 笛卡尔积接口，单次请求完成所有绑定
      await batchAssignRoleApi({
        usernames: [username.value],
        role_codes: selectedRoles.map((r) => r.code)
      })
      roleSelectVisible.value = false
      loadRoles()
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
      onSuccess: () => loadRoles()
    })
  }

  /** 批量解除角色关联 */
  const selectedRoles = ref<Role[]>([])
  const handleBatchUnbindRoles = () => {
    if (!username.value || selectedRoles.value.length === 0) return
    handleConfirmAction({
      title: "批量移除角色",
      message: `确认要为用户 [${username.value}] 批量移除所选的 ${selectedRoles.value.length} 条角色关联吗？`,
      api: () =>
        batchUnassignRoleApi({
          usernames: [username.value!],
          role_codes: selectedRoles.value.map((r) => r.code)
        }),
      onSuccess: () => {
        selectedRoles.value = []
        loadRoles()
      }
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
      onSuccess: () => loadPolicies()
    })
  }

  /** 批量解除策略授权 */
  const selectedPolicies = ref<Policy[]>([])
  const handleBatchUnbindPolicies = () => {
    if (!username.value || selectedPolicies.value.length === 0) return
    handleConfirmAction({
      title: "批量解除授权",
      message: `确认要批量解除所选的 ${selectedPolicies.value.length} 条策略关联吗？`,
      api: () =>
        batchDetachPolicyApi({
          assignments: selectedPolicies.value.map((p) => ({
            sub_type: AuthorizationSubType.USER,
            sub_code: username.value!,
            policy_code: p.code
          }))
        }),
      onSuccess: () => {
        selectedPolicies.value = []
        loadPolicies()
      }
    })
  }

  /** 批量关联策略 (PolicySelectDialog 回调) */
  const handleAttachPolicies = async (selectedPolicies: Policy[]) => {
    if (!username.value || !selectedPolicies.length) return
    policyLoading.value = true
    try {
      await batchAttachPolicyApi({
        subjects: [{ type: AuthorizationSubType.USER, code: username.value }],
        policy_codes: selectedPolicies.map((p) => p.code)
      })
      policySelectVisible.value = false
      loadPolicies()
    } finally {
      policyLoading.value = false
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
      onSuccess: () => loadTenants()
    })
  }

  /** 批量分配租户 (TenantSelectDialog 回调) */
  const handleAssignTenants = async (selectedTenants: Tenant[]) => {
    if (!userId.value || !selectedTenants.length) return
    tenantLoading.value = true
    try {
      await batchAssignTenantsApi({
        user_ids: [userId.value],
        tenant_ids: selectedTenants.map((t) => t.id)
      })
      tenantSelectVisible.value = false
      loadTenants()
    } finally {
      tenantLoading.value = false
    }
  }

  /** 批量解除租户关联 */
  const handleBatchUnbindTenants = () => {
    if (!userId.value || selectedTenants.value.length === 0) return
    handleConfirmAction({
      title: "批量移除租户",
      message: `确认要将用户从所选的 ${selectedTenants.value.length} 个租户空间中移除吗？此操作将导致用户立即失去相关空间的所有访问权限。`,
      api: () =>
        batchUnassignTenantsApi({
          user_ids: [userId.value!],
          tenant_ids: selectedTenants.value.map((t) => t.id)
        }),
      onSuccess: () => {
        selectedTenants.value = []
        loadTenants()
      }
    })
  }

  // --- 4. 辅助状态与联动 ---

  const handleRoleTypeChange = (type?: number) => {
    roleQuery.type = type
    handleRoleSearch()
  }

  const handlePolicyTypeChange = (type?: number) => {
    policyQuery.type = type
    handlePolicySearch()
  }

  const handleAddPolicy = () => (policySelectVisible.value = true)
  const handleAttachSuccess = () => loadPolicies()

  // 批量选择 Ref
  const selectedTenants = ref<Tenant[]>([])

  const { hasPermission } = usePermission()

  const tabPermissions = computed(() => ({
    sources: hasPermission(IAM_CAPABILITIES.User.Detail),
    roles: hasPermission(IAM_CAPABILITIES.User.ViewUserRoles),
    permissions: hasPermission(IAM_CAPABILITIES.User.ViewUserPolicies),
    tenants: hasPermission(IAM_CAPABILITIES.User.ViewUserTenants)
  }))

  const refresh = () => {
    if (!userId.value) return
    const tab = toValue(activeTab)
    if (tab === "roles" && tabPermissions.value.roles) loadRoles()
    if (tab === "permissions" && tabPermissions.value.permissions) loadPolicies()
    if (tab === "tenants" && tabPermissions.value.tenants) loadTenants()
  }

  watch([userId, () => toValue(activeTab)], () => refresh(), { immediate: true })

  return {
    activeTab,
    submitting,
    // 角色
    roles,
    roleTotal,
    roleLoading,
    roleQuery: computed(() => ({
      ...roleQuery,
      currentPage: rolePagination.currentPage,
      pageSize: rolePagination.pageSize
    })),
    selectedRoles,
    roleSelectVisible,
    handleRolePageChange,
    handleRoleSearch,
    handleRoleTypeChange,
    handleAssignRoles,
    handleUnbindRole,
    handleBatchUnbindRoles,
    // 策略
    policies,
    policyTotal,
    policyLoading,
    policyQuery: computed(() => ({
      ...policyQuery,
      currentPage: policyPagination.currentPage,
      pageSize: policyPagination.pageSize
    })),
    selectedPolicies,
    policySelectVisible,
    attachPolicyVisible,
    handlePolicyPageChange,
    handlePolicySearch,
    handlePolicyTypeChange,
    handleAddPolicy,
    handleAttachPolicies,
    handleAttachSuccess,
    handleUnbindPolicy,
    handleBatchUnbindPolicies,
    // 租户
    tenants,
    tenantTotal,
    tenantLoading,
    tenantQuery: computed(() => ({
      ...tenantQuery,
      currentPage: tenantPagination.currentPage,
      pageSize: tenantPagination.pageSize
    })),
    selectedTenants,
    tenantSelectVisible,
    handleTenantPageChange,
    handleTenantSearch,
    handleAssignTenants,
    handleUnbindTenant,
    handleBatchUnbindTenants,
    tabPermissions
  }
}
