import { ref, reactive, watch } from "vue"
import { useRoute } from "vue-router"
import { ElMessage } from "element-plus"
import { listUserRolesApi } from "@/api/iam/role"
import { listUserPoliciesApi } from "@/api/iam/policy"
import { listUserTenantsApi } from "@/api/iam/tenant"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import type { Tenant } from "@/api/iam/tenant/type"

export function useUserGovernance() {
  const route = useRoute()
  const activeTab = ref("auth")

  // 角色相关
  const roles = ref<Role[]>([])
  const roleTotal = ref(0)
  const roleLoading = ref(false)
  const roleQuery = reactive({
    currentPage: 1,
    pageSize: 10,
    keyword: "",
    type: undefined as number | undefined
  })

  // 策略相关
  const policies = ref<Policy[]>([])
  const policyTotal = ref(0)
  const policyLoading = ref(false)
  const policyQuery = reactive({
    currentPage: 1,
    pageSize: 10,
    keyword: "",
    type: undefined as number | undefined
  })

  // 租户相关
  const tenants = ref<Tenant[]>([])
  const tenantTotal = ref(0)
  const tenantLoading = ref(false)
  const tenantQuery = reactive({
    currentPage: 1,
    pageSize: 10,
    keyword: ""
  })

  /**
   * 加载角色
   */
  const loadUserRoles = async () => {
    const rawId = route.params.id || route.params.userId
    const userId = Number(rawId)

    if (!userId) return

    roleLoading.value = true
    try {
      const { data } = await listUserRolesApi({
        user_id: userId,
        offset: (roleQuery.currentPage - 1) * roleQuery.pageSize,
        limit: roleQuery.pageSize,
        keyword: roleQuery.keyword,
        type: roleQuery.type
      })
      roles.value = data.roles
      roleTotal.value = data.total
    } catch (err) {
      console.error("[UserGovernance] Load roles failed:", err)
    } finally {
      roleLoading.value = false
    }
  }

  /**
   * 加载策略
   */
  const loadUserPolicies = async () => {
    const rawId = route.params.id || route.params.userId
    const userId = Number(rawId)

    if (!userId) return

    policyLoading.value = true
    try {
      const { data } = await listUserPoliciesApi({
        user_id: userId,
        offset: (policyQuery.currentPage - 1) * policyQuery.pageSize,
        limit: policyQuery.pageSize,
        keyword: policyQuery.keyword,
        type: policyQuery.type
      })
      policies.value = data.policies
      policyTotal.value = data.total
    } catch (err) {
      console.error("[UserGovernance] Load policies failed:", err)
    } finally {
      policyLoading.value = false
    }
  }

  /**
   * 加载租户
   */
  const loadUserTenants = async () => {
    const rawId = route.params.id || route.params.userId
    const userId = Number(rawId)

    if (!userId) return

    tenantLoading.value = true
    try {
      const { data } = await listUserTenantsApi({
        user_id: userId,
        offset: (tenantQuery.currentPage - 1) * tenantQuery.pageSize,
        limit: tenantQuery.pageSize,
        keyword: tenantQuery.keyword
      })
      tenants.value = data.tenants
      tenantTotal.value = data.total
    } catch (err) {
      console.error("[UserGovernance] Load tenants failed:", err)
    } finally {
      tenantLoading.value = false
    }
  }

  const handleRolePageChange = (page: number) => {
    roleQuery.currentPage = page
    loadUserRoles()
  }

  const handlePolicyPageChange = (page: number) => {
    policyQuery.currentPage = page
    loadUserPolicies()
  }

  const handleTenantPageChange = (page: number) => {
    tenantQuery.currentPage = page
    loadUserTenants()
  }

  const handleRoleSearch = (keyword: string) => {
    roleQuery.keyword = keyword
    roleQuery.currentPage = 1
    loadUserRoles()
  }

  const handleRoleTypeChange = (type?: number) => {
    roleQuery.type = type
    roleQuery.currentPage = 1
    loadUserRoles()
  }

  const handlePolicySearch = (keyword: string) => {
    policyQuery.keyword = keyword
    policyQuery.currentPage = 1
    loadUserPolicies()
  }

  const handlePolicyTypeChange = (type?: number) => {
    policyQuery.type = type
    policyQuery.currentPage = 1
    loadUserPolicies()
  }

  const handleTenantSearch = (keyword: string) => {
    tenantQuery.keyword = keyword
    tenantQuery.currentPage = 1
    loadUserTenants()
  }

  const handleAddRole = () => ElMessage.info("角色分配功能即将集成...")
  const handleAddPolicy = () => ElMessage.info("策略授权功能即将集成...")
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

  // 核心监听逻辑：监听 Tab 切换
  watch(
    () => activeTab.value,
    (newTab) => {
      if (newTab === "roles") loadUserRoles()
      if (newTab === "permissions") loadUserPolicies()
      if (newTab === "tenants") loadUserTenants()
    },
    { immediate: true }
  )

  // 附加监听逻辑
  watch(
    () => route.params.id || route.params.userId,
    (newId) => {
      if (newId) {
        if (activeTab.value === "roles") loadUserRoles()
        if (activeTab.value === "permissions") loadUserPolicies()
        if (activeTab.value === "tenants") loadUserTenants()
      }
    }
  )

  return {
    activeTab,
    roles,
    roleTotal,
    roleLoading,
    roleQuery,
    selectedRoles,
    policies,
    policyTotal,
    policyLoading,
    policyQuery,
    selectedPolicies,
    tenants,
    tenantTotal,
    tenantLoading,
    tenantQuery,
    selectedTenants,
    loadUserRoles,
    loadUserPolicies,
    loadUserTenants,
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
    handleAddTenant,
    handleUnbindRole,
    handleUnbindPolicy,
    handleUnbindTenant,
    handleBatchUnbindRoles,
    handleBatchUnbindPolicies,
    handleBatchUnbindTenants
  }
}
