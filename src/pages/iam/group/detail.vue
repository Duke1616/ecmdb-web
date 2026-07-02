<template>
  <ProGovernanceLayout
    v-if="groupInfo"
    :title="groupInfo.name"
    :subtitle="groupInfo.code"
    :show-back-button="true"
    :show-refresh="false"
    :is-detail="true"
    :swap-actions="false"
    :primary-action="{
      capability: IAM_CAPABILITIES.Group.Edit,
      label: '编辑分组',
      icon: Edit
    }"
    :danger-action="{
      capability: IAM_CAPABILITIES.Group.Delete,
      label: '删除分组',
      icon: Delete
    }"
    class="group-detail-page"
    @back="router.back()"
    @primary-action="handleEdit"
    @danger-action="handleDelete"
  >
    <div v-loading="detailLoading" class="governance-body">
      <StatusStrip :items="statusItems" />

      <InfoCard title="分组基础资料" :icon="UserFilled" :items="infoItems" @copy="copyText" />

      <GovernanceTabs v-model="activeTab">
        <AuthTabPane label="用户治理" name="members" :allowed="tabPermissions.members" disable-mode>
          <GroupMemberTable
            v-model:selection="selectedMembers"
            :loading="memberLoading"
            :data="members"
            :total="memberTotal"
            :current-page="memberQuery.currentPage"
            :page-size="memberQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Group.RemoveMembers)"
            :can-add="hasPermission(IAM_CAPABILITIES.Group.AssignMembers)"
            :can-remove="hasPermission(IAM_CAPABILITIES.Group.RemoveMembers)"
            :can-batch-remove="hasPermission(IAM_CAPABILITIES.Group.RemoveMembers) && selectedMembers.length > 0"
            @page-change="handleMemberPageChange"
            @search="handleMemberSearch"
            @add="addMemberVisible = true"
            @remove="handleRemoveMember"
            @batch-remove="handleBatchRemoveMembers"
          />
        </AuthTabPane>

        <AuthTabPane label="角色治理" name="roles" :allowed="tabPermissions.roles" disable-mode>
          <GroupRoleTable
            v-model:selection="selectedRoles"
            :loading="roleLoading"
            :data="roles"
            :total="roleTotal"
            :current-page="roleQuery.currentPage"
            :page-size="roleQuery.pageSize"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Group.RemoveRole)"
            :can-add="hasPermission(IAM_CAPABILITIES.Group.AssignRole)"
            :can-remove="hasPermission(IAM_CAPABILITIES.Group.RemoveRole)"
            :can-batch-remove="hasPermission(IAM_CAPABILITIES.Group.RemoveRole) && selectedRoles.length > 0"
            @page-change="handleRolePageChange"
            @search="handleRoleSearch"
            @add="addRoleVisible = true"
            @remove="handleRemoveRole"
            @batch-remove="handleBatchRemoveRoles"
          />
        </AuthTabPane>

        <AuthTabPane label="策略治理" name="permissions" :allowed="tabPermissions.permissions" disable-mode>
          <PolicyTable
            v-model:selection="selectedPolicies"
            :loading="policyLoading"
            :data="policies"
            :total="policyTotal"
            :current-page="policyQuery.currentPage"
            :page-size="policyQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)"
            :can-add="hasPermission(IAM_CAPABILITIES.Policy.BatchAttach)"
            :can-unbind="hasPermission(IAM_CAPABILITIES.Policy.Detach)"
            :can-batch-unbind="hasPermission(IAM_CAPABILITIES.Policy.BatchDetach) && selectedPolicies.length > 0"
            @page-change="handlePolicyPageChange"
            @search="handlePolicySearch"
            @type-change="handlePolicyTypeChange"
            @add="policySelectVisible = true"
            @unbind="handleRemovePolicy"
            @batch-unbind="handleBatchRemovePolicies"
          />
        </AuthTabPane>
      </GovernanceTabs>
    </div>

    <UserSelectDialog
      v-model="addMemberVisible"
      title="添加组成员"
      subtitle="检索并选择用户，将其纳入当前用户组"
      confirm-text="确认添加"
      :confirm-loading="memberLoading"
      :exclude-codes="members.map((user) => user.username)"
      @confirm="handleAssignMembers"
    />

    <RoleSelectDialog
      v-model="addRoleVisible"
      title="绑定角色"
      subtitle="为当前用户组绑定角色，组内成员将继承对应职责权限"
      confirm-text="确认绑定"
      :confirm-loading="roleLoading"
      :exclude-codes="roles.map((role) => role.code)"
      @confirm="handleAssignRoles"
    />

    <PolicySelectDialog
      v-model="policySelectVisible"
      title="为用户组授予权限策略"
      confirm-text="确认授予策略"
      :confirm-loading="policyLoading"
      :exclude-codes="policies.map((policy) => policy.code)"
      @confirm="handleAttachPolicies"
    />

    <GroupDialog v-model="editVisible" :code="groupInfo.code" @success="handleEditSuccess" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, UserFilled } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import StatusStrip from "@/common/components/Governance/StatusStrip.vue"
import GovernanceTabs from "@/common/components/Governance/GovernanceTabs.vue"
import AuthTabPane from "@/common/components/Auth/AuthTabPane.vue"
import UserSelectDialog from "@/pages/iam/user/components/UserSelectDialog.vue"
import RoleSelectDialog from "@/pages/iam/role/components/RoleSelectDialog.vue"
import PolicySelectDialog from "@/pages/iam/policy/components/PolicySelectDialog.vue"
import GroupDialog from "./components/GroupDialog.vue"
import GroupMemberTable from "./components/detail/GroupMemberTable.vue"
import GroupRoleTable from "./components/detail/GroupRoleTable.vue"
import PolicyTable from "@/pages/iam/user/components/detail/PolicyTable.vue"
import { useGroupDetail } from "./composables/useGroupDetail"
import { useGroupDisplayItems } from "./composables/useGroupDisplayItems"
import { useGroupGovernance } from "./composables/useGroupGovernance"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const router = useRouter()
const { hasPermission } = usePermission()

const {
  groupInfo,
  loading: detailLoading,
  editVisible,
  handleEdit,
  handleEditSuccess,
  handleDelete,
  copyText,
  formatTimestamp
} = useGroupDetail()

const {
  activeTab,
  tabPermissions,
  members,
  memberTotal,
  memberLoading,
  selectedMembers,
  memberQuery,
  handleMemberPageChange,
  handleMemberSearch,
  addMemberVisible,
  handleAssignMembers,
  handleRemoveMember,
  handleBatchRemoveMembers,
  roles,
  roleTotal,
  roleLoading,
  selectedRoles,
  roleQuery,
  handleRolePageChange,
  handleRoleSearch,
  addRoleVisible,
  handleAssignRoles,
  handleRemoveRole,
  handleBatchRemoveRoles,
  policies,
  policyTotal,
  policyLoading,
  selectedPolicies,
  policyQuery,
  handlePolicyPageChange,
  handlePolicySearch,
  handlePolicyTypeChange,
  policySelectVisible,
  handleAttachPolicies,
  handleRemovePolicy,
  handleBatchRemovePolicies
} = useGroupGovernance(computed(() => groupInfo.value?.code))

const { statusItems, infoItems } = useGroupDisplayItems(groupInfo)
</script>

<style lang="scss" scoped>
.group-detail-page {
  --gov-brand: #3b82f6;
  --gov-bg: #f8fafc;
  --gov-border: #e2e8f0;

  overflow-y: auto;
  overflow-x: hidden;
  background: var(--gov-bg);
}

.governance-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px 24px;
}
</style>
