import { ref, watch, type Ref, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { listUserRolesApi } from "@/api/iam/role"
import { listUserPoliciesApi } from "@/api/iam/policy"
import { listUserTenantsApi } from "@/api/iam/tenant"
import { useListManager } from "@/common/composables/useListManager"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import type { Tenant } from "@/api/iam/tenant/type"

export function useUserGovernance(userId: Ref<number | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref((route.query.tab as string) || "auth")
  const attachPolicyVisible = ref(false)

  // 同步 Tab 状态到 URL
  watch(activeTab, (newTab) => {
    router.replace({
      query: { ...route.query, tab: newTab }
    })
  })

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

  // 交互逻辑 (占位)
  const handleAddRole = () => ElMessage.info("角色分配功能即将集成...")
  const handleAddPolicy = () => (attachPolicyVisible.value = true)
  const handleAttachSuccess = () => loadPolicies()
  const handleAddTenant = () => ElMessage.info("租户入驻功能即将集成...")
  const handleUnbindRole = (row: Role) => ElMessage.info(`即将解绑角色: ${row.name}`)
  const handleUnbindPolicy = (row: Policy) => ElMessage.info(`即将解绑策略: ${row.name}`)
  const handleUnbindTenant = (row: Tenant) => ElMessage.info(`即将移除租户关联: ${row.name}`)

  // 批量选择状态
  const selectedRoles = ref<Role[]>([])
  const selectedPolicies = ref<Policy[]>([])
  const selectedTenants = ref<Tenant[]>([])

  const handleBatchUnbindRoles = () => {
    ElMessage.warning(`即将批量解绑 ${selectedRoles.value.length} 个角色`)
    selectedRoles.value = []
  }

  const handleBatchUnbindPolicies = () => {
    ElMessage.warning(`即将批量解绑 ${selectedPolicies.value.length} 个策略`)
    selectedPolicies.value = []
  }

  const handleBatchUnbindTenants = () => {
    ElMessage.warning(`即将批量移除 ${selectedTenants.value.length} 个租户关联`)
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
