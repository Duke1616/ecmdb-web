import { ref, reactive, watch, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { listUserRolesApi } from "@/api/iam/role"
import { listUserPoliciesApi } from "@/api/iam/policy"
import { listUserTenantsApi } from "@/api/iam/tenant"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import type { Tenant } from "@/api/iam/tenant/type"

export function useUserGovernance(userId: Ref<number | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref((route.query.tab as string) || "auth")
  const attachPolicyVisible = ref(false)

  // 同步 Tab 状态到 URL，确保“返回”时能恢复现场
  watch(activeTab, (newTab) => {
    router.replace({
      query: { ...route.query, tab: newTab }
    })
  })

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
    if (!userId.value) return

    roleLoading.value = true
    try {
      const { data } = await listUserRolesApi({
        user_id: userId.value,
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
    if (!userId.value) return

    policyLoading.value = true
    try {
      const { data } = await listUserPoliciesApi({
        user_id: userId.value,
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
    if (!userId.value) return

    tenantLoading.value = true
    try {
      const { data } = await listUserTenantsApi({
        user_id: userId.value,
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
  const handleAddPolicy = () => {
    attachPolicyVisible.value = true
  }
  const handleAttachSuccess = () => {
    loadUserPolicies()
  }
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

  // 核心逻辑：数据驱动触发
  const refresh = () => {
    if (activeTab.value === "roles") loadUserRoles()
    if (activeTab.value === "permissions") loadUserPolicies()
    if (activeTab.value === "tenants") loadUserTenants()
  }

  // 1. 监听 userId 变化 (解决从跨模块跳转过来，id 异步获取的问题)
  watch(
    userId,
    (id) => {
      if (id) refresh()
    },
    { immediate: true }
  )

  // 2. 监听 Tab 切换
  watch(activeTab, () => {
    refresh()
  })

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
