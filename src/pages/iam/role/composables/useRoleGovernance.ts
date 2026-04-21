import { ref, watch, onMounted } from "vue"
import { useRoute } from "vue-router"
import { ElMessage } from "element-plus"
import { listRoleUsersApi } from "@/api/iam/user"
import { listRolePoliciesApi, detachPolicyApi } from "@/api/iam/policy"
import type { User } from "@/api/iam/user/type"
import type { Policy } from "@/api/iam/policy/type"

export function useRoleGovernance(roleId: number | undefined) {
  const activeTab = ref("members")

  // --- 成员管理 (Users) ---
  const members = ref<User[]>([])
  const memberTotal = ref(0)
  const memberLoading = ref(false)
  const selectedMembers = ref<User[]>([])
  const memberQuery = ref({
    currentPage: 1,
    pageSize: 10,
    keyword: ""
  })

  const fetchMembers = async () => {
    if (!roleId) return
    memberLoading.value = true
    try {
      const res = await listRoleUsersApi({
        role_id: roleId,
        offset: (memberQuery.value.currentPage - 1) * memberQuery.value.pageSize,
        limit: memberQuery.value.pageSize,
        keyword: memberQuery.value.keyword
      })
      members.value = res.users
      memberTotal.value = res.total
    } finally {
      memberLoading.value = false
    }
  }

  // --- 策略管理 (Policies) ---
  const policies = ref<Policy[]>([])
  const policyTotal = ref(0)
  const policyLoading = ref(false)
  const selectedPolicies = ref<Policy[]>([])
  const policyQuery = ref({
    currentPage: 1,
    pageSize: 10,
    keyword: ""
  })

  const fetchPolicies = async () => {
    if (!roleId) return
    policyLoading.value = true
    try {
      const res = await listRolePoliciesApi({
        role_id: roleId,
        offset: (policyQuery.value.currentPage - 1) * policyQuery.value.pageSize,
        limit: policyQuery.value.pageSize,
        keyword: policyQuery.value.keyword
      })
      policies.value = res.policies
      policyTotal.value = res.total
    } finally {
      policyLoading.value = false
    }
  }

  // --- 交互逻辑 ---
  const handleMemberPageChange = (page: number) => {
    memberQuery.value.currentPage = page
    fetchMembers()
  }

  const handleMemberSearch = (keyword: string) => {
    memberQuery.value.keyword = keyword
    memberQuery.value.currentPage = 1
    fetchMembers()
  }

  const handlePolicyPageChange = (page: number) => {
    policyQuery.value.currentPage = page
    fetchPolicies()
  }

  const handlePolicySearch = (keyword: string) => {
    policyQuery.value.keyword = keyword
    policyQuery.value.currentPage = 1
    fetchPolicies()
  }

  // 授权向导
  const attachPolicyVisible = ref(false)
  const handleAddPolicy = () => (attachPolicyVisible.value = true)
  const handleAttachPolicySuccess = () => fetchPolicies()

  // 解绑策略
  const handleUnbindPolicy = async (roleCode: string, policy: Policy) => {
    try {
      await detachPolicyApi({ role_code: roleCode, poly_code: policy.code })
      ElMessage.success("策略解绑成功")
      fetchPolicies()
    } catch (err: any) {
      ElMessage.error(err.message || "操作失败")
    }
  }

  // 监听 ID 变化（首次加载）
  watch(() => roleId, (newId) => {
    if (newId) {
      fetchMembers()
      fetchPolicies()
    }
  }, { immediate: true })

  return {
    activeTab,
    members,
    memberTotal,
    memberLoading,
    selectedMembers,
    memberQuery,
    policies,
    policyTotal,
    policyLoading,
    selectedPolicies,
    policyQuery,
    handleMemberPageChange,
    handleMemberSearch,
    handlePolicyPageChange,
    handlePolicySearch,
    attachPolicyVisible,
    handleAddPolicy,
    handleAttachPolicySuccess,
    handleUnbindPolicy
  }
}
