import { ref, watch, toValue, computed, type MaybeRefOrGetter } from "vue"
import { ElMessage } from "element-plus"
import { listRoleUsersApi } from "@/api/iam/user"
import { listRolePoliciesApi, detachPolicyApi } from "@/api/iam/policy"
import {
  batchAssignRoleApi,
  analyzeRoleInlinePoliciesApi,
  getParentRolesApi,
  addParentRoleApi,
  removeParentRoleApi,
  listRolesApi
} from "@/api/iam/role"
import type { User } from "@/api/iam/user/type"
import type { Policy } from "@/api/iam/policy/type"
import type { InlinePolicy, InheritanceItem } from "@/api/iam/role/type"
import { useListManager } from "@/common/composables/useListManager"

import { useTabRouter } from "@/common/composables/useTabRouter"

export function useRoleGovernance(
  roleId: MaybeRefOrGetter<number | undefined>,
  roleCode: MaybeRefOrGetter<string | undefined>
) {
  const { activeTab } = useTabRouter("members")

  // --- 成员管理 (Users) ---
  const {
    list: members,
    total: memberTotal,
    loading: memberLoading,
    query: memberQuery,
    pagination: memberPagination,
    fetchList: fetchMembers,
    handlePageChange: handleMemberPageChange,
    handleSearch: handleMemberSearch
  } = useListManager<User, any>({
    fetchApi: (params) => listRoleUsersApi({ ...params, role_code: toValue(roleCode)! }),
    listKey: "users",
    immediate: false
  })

  const selectedMembers = ref<User[]>([])
  const addMemberVisible = ref(false)
  const handleAddMember = () => (addMemberVisible.value = true)

  const handleAssignMembers = async (usernames: string[]) => {
    const code = toValue(roleCode)
    if (!code || !usernames.length) return
    try {
      await batchAssignRoleApi({ usernames, role_code: code })
      ElMessage.success(`成功添加 ${usernames.length} 名成员`)
      addMemberVisible.value = false
      fetchMembers()
    } catch (err: any) {
      // 错误已由全局拦截器处理，此处仅需重置状态或执行必要逻辑
    }
  }

  // --- 策略管理 (Policies) ---
  const {
    list: policies,
    total: policyTotal,
    loading: policyLoading,
    query: policyQuery,
    pagination: policyPagination,
    fetchList: fetchPolicies,
    handlePageChange: handlePolicyPageChange,
    handleSearch: handlePolicySearch
  } = useListManager<Policy, any>({
    fetchApi: (params) => listRolePoliciesApi({ ...params, role_code: toValue(roleCode)! }),
    listKey: "policies",
    immediate: false
  })

  const selectedPolicies = ref<Policy[]>([])
  const handlePolicyTypeChange = (type?: number) => {
    policyQuery.type = type
    handlePolicySearch()
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
      // 错误已由全局拦截器处理
    }
  }

  const handleBatchUnbindPolicies = () => {
    ElMessage.warning(`即将批量解绑 ${selectedPolicies.value.length} 个策略`)
    selectedPolicies.value = []
  }

  // --- 内联策略分析 (Inline Analysis) ---
  const analyzedInlinePolicies = ref<InlinePolicy[]>([])
  const analyzedLoading = ref(false)

  const fetchInlineAnalysis = async () => {
    const code = toValue(roleCode)
    if (!code) return
    analyzedInlinePolicies.value = []
    analyzedLoading.value = true
    try {
      const { data } = await analyzeRoleInlinePoliciesApi({ role_code: code })
      analyzedInlinePolicies.value = data.inline_policies
    } finally {
      analyzedLoading.value = false
    }
  }

  // --- 角色继承 (Inheritance) ---
  const parentRoles = ref<InheritanceItem[]>([])
  const inheritanceLoading = ref(false)
  const addParentVisible = ref(false)

  const fetchParentRoles = async () => {
    const code = toValue(roleCode)
    if (!code) return
    inheritanceLoading.value = true
    try {
      const { data: infos } = await getParentRolesApi({ role_code: code })
      if (!infos || infos.length === 0) {
        parentRoles.value = []
        return
      }
      const codes = infos.map((i) => i.code)
      const { data } = await listRolesApi({ offset: 0, limit: 100, keyword: "" })
      parentRoles.value = data.roles
        .filter((r) => codes.includes(r.code))
        .map((r) => {
          const info = infos.find((i) => i.code === r.code)
          return {
            ...r,
            is_direct: info?.is_direct ?? false,
            is_immutable: info?.is_immutable ?? false
          }
        })
    } finally {
      inheritanceLoading.value = false
    }
  }

  const handleAddParent = async (parentCode: string) => {
    const code = toValue(roleCode)
    if (!code) return
    try {
      await addParentRoleApi({ role_code: code, parent_role_code: parentCode })
      ElMessage.success("成功添加父角色")
      fetchParentRoles()
    } catch (err: any) {
      // 错误已由全局拦截器处理
    }
  }

  const handleRemoveParent = async (parentCode: string) => {
    const code = toValue(roleCode)
    if (!code) return
    try {
      await removeParentRoleApi({ role_code: code, parent_role_code: parentCode })
      ElMessage.success("成功移除父角色")
      fetchParentRoles()
    } catch (err: any) {
      // 错误已由全局拦截器处理
    }
  }

  const handleAddParents = async (parentCodes: string[]) => {
    const code = toValue(roleCode)
    if (!code || !parentCodes.length) return
    inheritanceLoading.value = true
    try {
      for (const pCode of parentCodes) {
        await addParentRoleApi({ role_code: code, parent_role_code: pCode })
      }
      ElMessage.success(`成功添加 ${parentCodes.length} 个父角色`)
      addParentVisible.value = false
      fetchParentRoles()
    } catch (err: any) {
      // 错误已由全局拦截器处理
    } finally {
      inheritanceLoading.value = false
    }
  }

  // --- 联动逻辑 (Lazy Loading) ---
  watch(
    [() => activeTab.value, () => toValue(roleCode)],
    ([tab, code]) => {
      if (!code) return
      if (tab === "members") fetchMembers()
      else if (tab === "permissions") fetchPolicies()
      else if (tab === "inline") fetchInlineAnalysis()
      else if (tab === "inheritance") fetchParentRoles()
    },
    { immediate: true }
  )

  return {
    activeTab,
    members,
    memberTotal,
    memberLoading,
    selectedMembers,
    memberQuery: computed(() => ({
      ...memberQuery,
      currentPage: memberPagination.currentPage,
      pageSize: memberPagination.pageSize
    })),
    policies,
    policyTotal,
    policyLoading,
    selectedPolicies,
    policyQuery: computed(() => ({
      ...policyQuery,
      currentPage: policyPagination.currentPage,
      pageSize: policyPagination.pageSize
    })),
    handleMemberPageChange,
    handleMemberSearch,
    addMemberVisible,
    handleAddMember,
    handleAssignMembers,
    handlePolicyPageChange,
    handlePolicySearch,
    handlePolicyTypeChange,
    attachPolicyVisible,
    handleAddPolicy,
    handleAttachPolicySuccess,
    handleUnbindPolicy,
    analyzedInlinePolicies,
    analyzedLoading,
    fetchInlineAnalysis,
    parentRoles,
    inheritanceLoading,
    fetchParentRoles,
    handleAddParent,
    handleRemoveParent,
    addParentVisible,
    handleAddParents,
    handleBatchUnbindPolicies
  }
}
