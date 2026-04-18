import { ref, reactive, watch } from "vue"
import { useRoute } from "vue-router"
import { ElMessage } from "element-plus"
import { listUserRolesApi } from "@/api/iam/role"
import { listUserPoliciesApi } from "@/api/iam/policy"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"

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

  /**
   * 加载角色
   */
  const loadUserRoles = async () => {
    // 兼容 id 或 userId 参数
    const rawId = route.params.id || route.params.userId
    const userId = Number(rawId)

    if (!userId) {
      console.warn("[UserGovernance] userId not found in route, skip role loading")
      return
    }

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

    if (!userId) {
      console.warn("[UserGovernance] userId not found in route, skip policy loading")
      return
    }

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

  const handleRolePageChange = (page: number) => {
    roleQuery.currentPage = page
    loadUserRoles()
  }

  const handlePolicyPageChange = (page: number) => {
    policyQuery.currentPage = page
    loadUserPolicies()
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

  const handleAddRole = () => ElMessage.info("角色分配功能即将集成...")
  const handleAddPolicy = () => ElMessage.info("策略授权功能即将集成...")
  const handleUnbindRole = (row: Role) => ElMessage.info(`即将解绑角色: ${row.name}`)
  const handleUnbindPolicy = (row: Policy) => ElMessage.info(`即将解绑策略: ${row.name}`)

  // 批量选择状态
  const selectedRoles = ref<Role[]>([])
  const selectedPolicies = ref<Policy[]>([])

  const handleBatchUnbindRoles = () => {
    ElMessage.warning(`即将批量解绑 ${selectedRoles.value.length} 个角色`)
    selectedRoles.value = []
  }

  const handleBatchUnbindPolicies = () => {
    ElMessage.warning(`即将批量解绑 ${selectedPolicies.value.length} 个策略`)
    selectedPolicies.value = []
  }

  // 核心监听逻辑：监听 Tab 切换
  watch(
    () => activeTab.value,
    (newTab) => {
      console.log("[UserGovernance] Tab switched to:", newTab)
      if (newTab === "roles") loadUserRoles()
      if (newTab === "permissions") loadUserPolicies()
    },
    { immediate: true }
  )

  // 附加监听逻辑：监听路由参数变化（解决刷新后 ID 未就绪的问题）
  watch(
    () => route.params.id || route.params.userId,
    (newId) => {
      if (newId) {
        if (activeTab.value === "roles") loadUserRoles()
        if (activeTab.value === "permissions") loadUserPolicies()
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
    loadUserRoles,
    loadUserPolicies,
    handleRolePageChange,
    handlePolicyPageChange,
    handleRoleSearch,
    handleRoleTypeChange,
    handlePolicySearch,
    handlePolicyTypeChange,
    handleAddRole,
    handleAddPolicy,
    handleUnbindRole,
    handleUnbindPolicy,
    handleBatchUnbindRoles,
    handleBatchUnbindPolicies
  }
}
