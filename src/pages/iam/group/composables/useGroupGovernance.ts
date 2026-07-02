import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import { useGovernanceRelationList } from "@/common/composables/useGovernanceRelationList"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useTabRouter } from "@/common/composables/useTabRouter"
import { listGroupPoliciesApi, batchAttachPolicyApi, batchDetachPolicyApi, detachPolicyApi } from "@/api/iam/policy"
import {
  assignGroupMembersApi,
  assignGroupRoleApi,
  listGroupMembersApi,
  listGroupRolesApi,
  removeGroupMembersApi,
  removeGroupRoleApi
} from "@/api/iam/group"
import type { GroupRole, GroupUser } from "@/api/iam/group/type"
import type { User } from "@/api/iam/user/type"
import type { Role } from "@/api/iam/role/type"
import type { Policy } from "@/api/iam/policy/type"
import { AuthorizationSubType } from "@/api/iam/permission/type"

const normalizeText = (value?: string) => (value || "").toLowerCase()

export function useGroupGovernance(groupCode: MaybeRefOrGetter<string | undefined>) {
  const { activeTab } = useTabRouter("members")
  const { hasPermission } = usePermission()
  const { handleConfirmAction } = useGovernanceActions()

  const tabPermissions = computed(() => ({
    members: hasPermission(IAM_CAPABILITIES.Group.ViewMembers),
    roles: hasPermission(IAM_CAPABILITIES.Group.ViewRoles),
    permissions: hasPermission(IAM_CAPABILITIES.Policy.View)
  }))

  const memberRelation = useGovernanceRelationList<GroupUser, any>({
    fetchApi: (params) => listGroupMembersApi({ ...params, group_code: toValue(groupCode)! }),
    listKey: "members",
    activeTab,
    tabName: "members",
    enabled: () => !!toValue(groupCode) && tabPermissions.value.members
  })

  const roleRelation = useGovernanceRelationList<GroupRole, any>({
    fetchApi: async (params) => {
      const code = toValue(groupCode)
      if (!code) {
        return { data: { total: 0, roles: [] } }
      }

      const { data } = await listGroupRolesApi(code)
      const keyword = normalizeText(params.keyword)
      const roles = keyword
        ? data.filter((role) =>
            [role.name, role.code, role.desc].some((value) => normalizeText(value).includes(keyword))
          )
        : data
      const offset = Number(params.offset || 0)
      const limit = Number(params.limit || 10)

      return {
        data: {
          total: roles.length,
          roles: roles.slice(offset, offset + limit)
        }
      }
    },
    listKey: "roles",
    activeTab,
    tabName: "roles",
    enabled: () => !!toValue(groupCode) && tabPermissions.value.roles
  })

  const policyRelation = useGovernanceRelationList<Policy, any>({
    fetchApi: (params) => listGroupPoliciesApi({ ...params, group_code: toValue(groupCode)! }),
    listKey: "policies",
    activeTab,
    tabName: "permissions",
    enabled: () => !!toValue(groupCode) && tabPermissions.value.permissions
  })

  const addMemberVisible = ref(false)
  const addRoleVisible = ref(false)
  const policySelectVisible = ref(false)

  const handleAssignMembers = async (users: User[]) => {
    const code = toValue(groupCode)
    if (!code || users.length === 0) return

    memberRelation.loading.value = true
    try {
      await assignGroupMembersApi({
        group_code: code,
        usernames: users.map((user) => user.username)
      })
      addMemberVisible.value = false
      memberRelation.refresh()
    } finally {
      memberRelation.loading.value = false
    }
  }

  const handleRemoveMember = (user: GroupUser) => {
    const code = toValue(groupCode)
    if (!code) return

    handleConfirmAction({
      title: "移除组成员",
      message: `确认要从用户组 [${code}] 中移除成员 [${user.nickname || user.username}] 吗？`,
      api: () => removeGroupMembersApi({ group_code: code, usernames: [user.username] }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  const handleBatchRemoveMembers = () => {
    const code = toValue(groupCode)
    if (!code || memberRelation.selectedRows.value.length === 0) return

    handleConfirmAction({
      title: "批量移除组成员",
      message: `确认要从用户组 [${code}] 中移除选中的 ${memberRelation.selectedRows.value.length} 名成员吗？`,
      api: () =>
        removeGroupMembersApi({
          group_code: code,
          usernames: memberRelation.selectedRows.value.map((user) => user.username)
        }),
      onSuccess: () => memberRelation.refresh()
    })
  }

  const handleAssignRoles = async (roles: Role[]) => {
    const code = toValue(groupCode)
    if (!code || roles.length === 0) return

    roleRelation.loading.value = true
    try {
      await Promise.all(roles.map((role) => assignGroupRoleApi({ group_code: code, role_code: role.code })))
      addRoleVisible.value = false
      roleRelation.refresh()
    } finally {
      roleRelation.loading.value = false
    }
  }

  const handleRemoveRole = (role: GroupRole) => {
    const code = toValue(groupCode)
    if (!code) return

    handleConfirmAction({
      title: "解绑角色",
      message: `确认要解除用户组 [${code}] 与角色 [${role.name}] 的绑定吗？`,
      api: () => removeGroupRoleApi({ group_code: code, role_code: role.code }),
      onSuccess: () => roleRelation.refresh()
    })
  }

  const handleBatchRemoveRoles = () => {
    const code = toValue(groupCode)
    if (!code || roleRelation.selectedRows.value.length === 0) return

    handleConfirmAction({
      title: "批量解绑角色",
      message: `确认要批量解除选中的 ${roleRelation.selectedRows.value.length} 个角色绑定吗？`,
      api: () =>
        Promise.all(
          roleRelation.selectedRows.value.map((role) => removeGroupRoleApi({ group_code: code, role_code: role.code }))
        ),
      onSuccess: () => roleRelation.refresh()
    })
  }

  const handlePolicyTypeChange = (type?: number) => {
    policyRelation.query.type = type
    policyRelation.handleSearch()
  }

  const handleAttachPolicies = async (selectedPolicies: Policy[]) => {
    const code = toValue(groupCode)
    if (!code || !selectedPolicies.length) return
    policyRelation.loading.value = true
    try {
      await batchAttachPolicyApi({
        subjects: [{ type: AuthorizationSubType.GROUP, code }],
        policy_codes: selectedPolicies.map((policy) => policy.code)
      })
      policySelectVisible.value = false
      policyRelation.refresh()
    } finally {
      policyRelation.loading.value = false
    }
  }

  const handleRemovePolicy = (policy: Policy) => {
    const code = toValue(groupCode)
    if (!code) return

    handleConfirmAction({
      title: "解除策略授权",
      message: `确认要为用户组 [${code}] 解除策略 [${policy.name}] 的关联吗？`,
      api: () =>
        detachPolicyApi({
          sub_type: AuthorizationSubType.GROUP,
          sub_code: code,
          policy_code: policy.code
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  const handleBatchRemovePolicies = () => {
    const code = toValue(groupCode)
    if (!code || policyRelation.selectedRows.value.length === 0) return

    handleConfirmAction({
      title: "批量解除授权",
      message: `确认要批量解除选中的 ${policyRelation.selectedRows.value.length} 条策略关联吗？`,
      api: () =>
        batchDetachPolicyApi({
          assignments: policyRelation.selectedRows.value.map((policy) => ({
            sub_type: AuthorizationSubType.GROUP,
            sub_code: code,
            policy_code: policy.code
          }))
        }),
      onSuccess: () => policyRelation.refresh()
    })
  }

  watch(
    () => toValue(groupCode),
    (code) => {
      if (!code) return
      if (activeTab.value === "members" && tabPermissions.value.members) {
        memberRelation.refresh()
      }
      if (activeTab.value === "roles" && tabPermissions.value.roles) {
        roleRelation.refresh()
      }
      if (activeTab.value === "permissions" && tabPermissions.value.permissions) {
        policyRelation.refresh()
      }
    }
  )

  return {
    activeTab,
    tabPermissions,
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
    handleAssignMembers,
    handleRemoveMember,
    handleBatchRemoveMembers,
    roles: roleRelation.list,
    roleTotal: roleRelation.total,
    roleLoading: roleRelation.loading,
    selectedRoles: roleRelation.selectedRows,
    roleQuery: computed(() => ({
      ...roleRelation.query,
      currentPage: roleRelation.pagination.currentPage,
      pageSize: roleRelation.pagination.pageSize
    })),
    handleRolePageChange: roleRelation.handlePageChange,
    handleRoleSearch: roleRelation.handleSearch,
    addRoleVisible,
    handleAssignRoles,
    handleRemoveRole,
    handleBatchRemoveRoles,
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
    policySelectVisible,
    handleAttachPolicies,
    handleRemovePolicy,
    handleBatchRemovePolicies
  }
}
