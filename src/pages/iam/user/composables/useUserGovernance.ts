import { ref, watch, type Ref, computed } from "vue"
import { useTabRouter } from "@/common/composables/useTabRouter"
import { listUserRolesApi } from "@/api/iam/role"
import { listUserPoliciesApi } from "@/api/iam/policy"
import { listUserTenantsApi } from "@/api/iam/tenant"
import { useListManager } from "@/common/composables/useListManager"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import type { Tenant } from "@/api/iam/tenant/type"

export function useUserGovernance(userId: Ref<number | undefined>) {
  const { activeTab } = useTabRouter("sources")
  const attachPolicyVisible = ref(false)

  // --- 使用通用列表管理器 ---

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

  // 特殊类型切换逻辑
  const handleRoleTypeChange = (type?: number) => {
    roleQuery.type = type
    handleRoleSearch()
  }

  const handlePolicyTypeChange = (type?: number) => {
    policyQuery.type = type
    handlePolicySearch()
  }

  // 交互逻辑
  const handleAddRole = () => {
    // TODO: 角色分配功能待集成
  }
  const handleAddPolicy = () => (attachPolicyVisible.value = true)
  const handleAttachSuccess = () => loadPolicies()
  const handleAddTenant = () => {
    // TODO: 租户入驻功能待集成
  }
  const handleUnbindRole = (_row: Role) => {
    // TODO: 角色解绑功能待集成
  }
  const handleUnbindPolicy = (_row: Policy) => {
    // TODO: 策略解绑功能待集成
  }
  const handleUnbindTenant = (_row: Tenant) => {
    // TODO: 租户关联移除功能待集成
  }

  // 批量选择状态
  const selectedRoles = ref<Role[]>([])
  const selectedPolicies = ref<Policy[]>([])
  const selectedTenants = ref<Tenant[]>([])

  const handleBatchUnbindRoles = () => {
    // TODO: 批量角色解绑功能待集成
    selectedRoles.value = []
  }

  const handleBatchUnbindPolicies = () => {
    // TODO: 批量策略解绑功能待集成
    selectedPolicies.value = []
  }

  const handleBatchUnbindTenants = () => {
    // TODO: 批量租户移除功能待集成
    selectedTenants.value = []
  }

  // 核心渲染驱动逻辑
  const refresh = () => {
    if (!userId.value) return
    if (activeTab.value === "roles") loadRoles()
    if (activeTab.value === "permissions") loadPolicies()
    if (activeTab.value === "tenants") loadTenants()
  }

  watch([userId, activeTab], () => refresh(), { immediate: true })

  return {
    activeTab,
    roles,
    roleTotal,
    roleLoading,
    roleQuery: computed(() => ({
      ...roleQuery,
      currentPage: rolePagination.currentPage,
      pageSize: rolePagination.pageSize
    })),
    selectedRoles,
    policies,
    policyTotal,
    policyLoading,
    policyQuery: computed(() => ({
      ...policyQuery,
      currentPage: policyPagination.currentPage,
      pageSize: policyPagination.pageSize
    })),
    selectedPolicies,
    tenants,
    tenantTotal,
    tenantLoading,
    tenantQuery: computed(() => ({
      ...tenantQuery,
      currentPage: tenantPagination.currentPage,
      pageSize: tenantPagination.pageSize
    })),
    selectedTenants,
    loadRoles,
    loadPolicies,
    loadTenants,
    handleRolePageChange,
    handlePolicyPageChange,
    handleTenantPageChange,
    handleRoleSearch,
    handleRoleTypeChange,
    handlePolicySearch,
    handlePolicyTypeChange,
    handleTenantSearch,
    handleAddRole,
    handleAddPolicy,
    attachPolicyVisible,
    handleAttachSuccess,
    handleAddTenant,
    handleUnbindRole,
    handleUnbindPolicy,
    handleUnbindTenant,
    handleBatchUnbindRoles,
    handleBatchUnbindPolicies,
    handleBatchUnbindTenants
  }
}
