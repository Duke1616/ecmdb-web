import { ref, toValue, computed, watch, type MaybeRefOrGetter } from "vue"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import { listRoleUsersApi } from "@/api/iam/user"
import { listRolePoliciesApi, detachPolicyApi, batchDetachPolicyApi, batchAttachPolicyApi } from "@/api/iam/policy"
import {
  batchAssignRoleApi,
  batchUnassignRoleApi,
  analyzeRoleInlinePoliciesApi,
  getParentRolesApi,
  addParentRoleApi,
  removeParentRoleApi,
  listRolesApi
} from "@/api/iam/role"
import { useGovernanceRelationList } from "@/common/composables/useGovernanceRelationList"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { AuthorizationSubType } from "@/api/iam/permission/type"
import type { User } from "@/api/iam/user/type"
import type { Policy } from "@/api/iam/policy/type"
import type { InlinePolicy, InheritanceItem } from "@/api/iam/role/type"

import { useTabRouter } from "@/common/composables/useTabRouter"

export function useRoleGovernance(
  roleId: MaybeRefOrGetter<number | undefined>,
  roleCode: MaybeRefOrGetter<string | undefined>
) {
  const { activeTab } = useTabRouter("members")
  const { hasPermission } = usePermission()
  const { handleConfirmAction } = useGovernanceActions()

  const tabPermissions = computed(() => ({
    members: hasPermission(IAM_CAPABILITIES.Role.ViewRoleMembers),
    permissions: hasPermission(IAM_CAPABILITIES.Role.ViewRolePolicies),
    inline: hasPermission(IAM_CAPABILITIES.Role.InlineAnalysis),
    inheritance: hasPermission(IAM_CAPABILITIES.Role.ViewParents)
  }))

  // --- 1. 成员管理 (Users) ---
  const memberRelation = useGovernanceRelationList<User, any>({
    fetchApi: (params) => listRoleUsersApi({ ...params, role_code: toValue(roleCode)! }),
    listKey: "users",
    activeTab,
    tabName: "members",
    enabled: () => !!toValue(roleCode) && tabPermissions.value.members
  })

  const addMemberVisible = ref(false)
  const handleAddMember = () => (addMemberVisible.value = true)

  /** 批量分派成员 (UserSelectDialog 回调) */
  const handleAssignMembers = async (usernames: string[]) => {
    const code = toValue(roleCode)
    if (!code || !usernames.length) return
    try {
      await batchAssignRoleApi({ usernames, role_codes: [code] })
      addMemberVisible.value = false
      memberRelation.refresh()
    } catch (err: any) {
      // 错误已由全局拦截器处理
    }
  }

  /** 移除成员关联 (单条) */
  const handleUnbindMember = async (user: User) => {
    const code = toValue(roleCode)
    if (!code) return

    handleConfirmAction({
      title: "移除成员",
      message: `确认要从角色 [${code}] 中移除成员 [${user.nickname || user.username}] 吗？`,
      api: () =>
        batchUnassignRoleApi({
          usernames: [user.username],
          role_codes: [code]
        }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  /** 批量移除成员关联 */
  const handleBatchUnbindMembers = () => {
    const code = toValue(roleCode)
    if (!code || memberRelation.selectedRows.value.length === 0) return

    handleConfirmAction({
      title: "批量移除成员",
      message: `确认要从角色 [${code}] 中批量移除选中的 ${memberRelation.selectedRows.value.length} 名成员吗？`,
      api: () =>
        batchUnassignRoleApi({
          usernames: memberRelation.selectedRows.value.map((u) => u.username),
          role_codes: [code]
        }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  // --- 2. 策略管理 (Policies) ---
  const policyRelation = useGovernanceRelationList<Policy, any>({
    fetchApi: (params) => listRolePoliciesApi({ ...params, role_code: toValue(roleCode)! }),
    listKey: "policies",
    activeTab,
    tabName: "permissions",
    enabled: () => !!toValue(roleCode) && tabPermissions.value.permissions
  })

  const handlePolicyTypeChange = (type?: number) => {
    policyRelation.query.type = type
    policyRelation.handleSearch()
  }

  const attachPolicyVisible = ref(false)
  const policySelectVisible = ref(false)
  const handleAddPolicy = () => (policySelectVisible.value = true)
  const handleAttachPolicySuccess = () => policyRelation.refresh()

  /** 批量关联策略 (PolicySelectDialog 回调) */
  const handleAttachPolicies = async (selectedPolicies: Policy[]) => {
    const code = toValue(roleCode)
    if (!code || !selectedPolicies.length) return
    policyRelation.loading.value = true
    try {
      await batchAttachPolicyApi({
        subjects: [{ type: AuthorizationSubType.ROLE, code }],
        policy_codes: selectedPolicies.map((p) => p.code)
      })
      policySelectVisible.value = false
      policyRelation.refresh()
    } finally {
      policyRelation.loading.value = false
    }
  }

  // 解绑策略
  const handleUnbindPolicy = async (policy: Policy) => {
    const code = toValue(roleCode)
    if (!code) return

    handleConfirmAction({
      title: "解除授权",
      message: `确认要为角色 [${code}] 解除策略 [${policy.name}] 的关联吗？`,
      api: () =>
        detachPolicyApi({
          sub_type: AuthorizationSubType.ROLE,
          sub_code: code,
          policy_code: policy.code
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  const handleBatchUnbindPolicies = () => {
    const code = toValue(roleCode)
    if (!code || policyRelation.selectedRows.value.length === 0) return

    handleConfirmAction({
      title: "批量解除授权",
      message: `确认要批量解除选中的 ${policyRelation.selectedRows.value.length} 条策略关联吗？`,
      api: () =>
        batchDetachPolicyApi({
          assignments: policyRelation.selectedRows.value.map((p) => ({
            sub_type: AuthorizationSubType.ROLE,
            sub_code: code,
            policy_code: p.code
          }))
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  // --- 3. 非标准列表 (内联策略分析 & 角色继承) ---
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

  const handleAddParents = async (parentCodes: string[]) => {
    const code = toValue(roleCode)
    if (!code || !parentCodes.length) return
    inheritanceLoading.value = true
    try {
      for (const pCode of parentCodes) {
        await addParentRoleApi({ role_code: code, parent_role_code: pCode })
      }
      addParentVisible.value = false
      fetchParentRoles()
    } finally {
      inheritanceLoading.value = false
    }
  }

  const handleRemoveParent = async (parentCode: string) => {
    const code = toValue(roleCode)
    if (!code) return

    handleConfirmAction({
      title: "移除继承",
      message: `确认要移除对角色 [${parentCode}] 的继承关系吗？`,
      api: () => removeParentRoleApi({ role_code: code, parent_role_code: parentCode }),
      onSuccess: () => fetchParentRoles()
    })
  }

  // 手动控制非标准 Tab 的加载 (不符合通用治理列表形态的)
  watch(
    [() => activeTab.value, () => toValue(roleCode)],
    ([tab, code]) => {
      if (!code) return
      if (tab === "inline" && tabPermissions.value.inline && analyzedInlinePolicies.value.length === 0)
        fetchInlineAnalysis()
      else if (tab === "inheritance" && tabPermissions.value.inheritance && parentRoles.value.length === 0)
        fetchParentRoles()
    },
    { immediate: true }
  )

  return {
    activeTab,
    // 成员
    members: memberRelation.list,
    memberTotal: memberRelation.total,
    memberLoading: memberRelation.loading,
    selectedMembers: memberRelation.selectedRows,
    memberQuery: computed(() => ({
      ...memberRelation.query,
      currentPage: memberRelation.pagination.currentPage,
      pageSize: memberRelation.pagination.pageSize
    })),
    handleMemberPageChange: memberRelation.handlePageChange,
    handleMemberSearch: memberRelation.handleSearch,
    addMemberVisible,
    handleAddMember,
    handleAssignMembers,
    handleUnbindMember,
    handleBatchUnbindMembers,
    // 策略
    policies: policyRelation.list,
    policyTotal: policyRelation.total,
    policyLoading: policyRelation.loading,
    selectedPolicies: policyRelation.selectedRows,
    policyQuery: computed(() => ({
      ...policyRelation.query,
      currentPage: policyRelation.pagination.currentPage,
      pageSize: policyRelation.pagination.pageSize
    })),
    handlePolicyPageChange: policyRelation.handlePageChange,
    handlePolicySearch: policyRelation.handleSearch,
    handlePolicyTypeChange,
    attachPolicyVisible,
    policySelectVisible,
    handleAddPolicy,
    handleAttachPolicies,
    handleAttachPolicySuccess,
    handleUnbindPolicy,
    handleBatchUnbindPolicies,
    // 其他
    analyzedInlinePolicies,
    analyzedLoading,
    fetchInlineAnalysis,
    parentRoles,
    inheritanceLoading,
    fetchParentRoles,
    handleRemoveParent,
    addParentVisible,
    handleAddParents,
    tabPermissions
  }
}
