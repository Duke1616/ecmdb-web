import { ref, watch, toValue, type MaybeRefOrGetter } from "vue"
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

export function useRoleGovernance(
  roleId: MaybeRefOrGetter<number | undefined>,
  roleCode: MaybeRefOrGetter<string | undefined>
) {
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
  const addMemberVisible = ref(false)

  const fetchMembers = async () => {
    const code = toValue(roleCode)
    if (!code) return
    memberLoading.value = true
    try {
      const { data } = await listRoleUsersApi({
        role_code: code,
        offset: (memberQuery.value.currentPage - 1) * memberQuery.value.pageSize,
        limit: memberQuery.value.pageSize,
        keyword: memberQuery.value.keyword
      })
      members.value = data.users
      memberTotal.value = data.total
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
    keyword: "",
    type: undefined as number | undefined
  })

  const fetchPolicies = async () => {
    const code = toValue(roleCode)
    if (!code) return
    policyLoading.value = true
    try {
      const { data } = await listRolePoliciesApi({
        role_code: code,
        offset: (policyQuery.value.currentPage - 1) * policyQuery.value.pageSize,
        limit: policyQuery.value.pageSize,
        keyword: policyQuery.value.keyword,
        type: policyQuery.value.type as any // Match Go uint8
      })
      policies.value = data.policies
      policyTotal.value = data.total
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
      ElMessage.error(err.message || "添加失败")
    }
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

  const handlePolicyTypeChange = (type?: number) => {
    policyQuery.value.type = type
    policyQuery.value.currentPage = 1
    fetchPolicies()
  }

  // 角色继承 (Inheritance)
  const addParentVisible = ref(false)

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

  const fetchParentRoles = async () => {
    const code = toValue(roleCode)
    if (!code) return
    inheritanceLoading.value = true
    try {
      // 1. 获取带有层级信息的父角色编码列表
      const { data: infos } = await getParentRolesApi({ role_code: code })
      if (!infos || infos.length === 0) {
        parentRoles.value = []
        return
      }

      const codes = infos.map((i) => i.code)

      // 2. 批量获取角色详情
      const { data } = await listRolesApi({
        offset: 0,
        limit: 100,
        keyword: ""
      })

      // 3. 组合信息：附加 is_direct 和 is_immutable 属性供 UI 判断
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
      ElMessage.error(err.message || "添加失败")
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
      ElMessage.error(err.message || "移除失败")
    }
  }

  const handleAddParents = async (parentCodes: string[]) => {
    const code = toValue(roleCode)
    if (!code || !parentCodes.length) return
    inheritanceLoading.value = true
    try {
      // 批量添加父角色 (后端目前可能是单个添加，我们需要循环或者后端支持批量?)
      // Backend: POST /api/role/add_parent handles one at a time.
      for (const pCode of parentCodes) {
        await addParentRoleApi({ role_code: code, parent_role_code: pCode })
      }
      ElMessage.success(`成功添加 ${parentCodes.length} 个父角色`)
      addParentVisible.value = false
      fetchParentRoles()
    } catch (err: any) {
      ElMessage.error(err.message || "部分角色添加失败")
    } finally {
      inheritanceLoading.value = false
    }
  }

  const handleBatchUnbindPolicies = () => {
    ElMessage.warning(`即将批量解绑 ${selectedPolicies.value.length} 个策略`)
    selectedPolicies.value = []
  }

  // --- 联动逻辑 (Lazy Loading) ---
  watch(
    [() => activeTab.value, () => toValue(roleCode)],
    ([tab, code]) => {
      if (!code) return
      if (tab === "members") {
        fetchMembers()
      } else if (tab === "permissions") {
        fetchPolicies()
      } else if (tab === "inline") {
        fetchInlineAnalysis()
      } else if (tab === "inheritance") {
        fetchParentRoles()
      }
    },
    { immediate: true }
  )

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
