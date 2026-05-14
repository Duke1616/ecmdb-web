<template>
  <ProGovernanceLayout
    v-if="userInfo"
    :title="userInfo.nickname || userInfo.username"
    :subtitle="userInfo.username"
    :show-back-button="true"
    :show-refresh="false"
    :is-detail="true"
    :swap-actions="false"
    :primary-action="{
      capability: IAM_CAPABILITIES.User.Edit,
      label: '完善资料',
      icon: Edit
    }"
    :danger-action="
      userInfo.is_member
        ? {
            capability: IAM_CAPABILITIES.User.Delete,
            label: '注销主体',
            icon: Delete
          }
        : undefined
    "
    class="user-detail-page"
    @back="router.back()"
    @primary-action="handleEdit"
    @danger-action="handleDelete"
  >
    <div v-loading="detailLoading" class="governance-body">
      <!-- 1. 身份安全状态条 -->
      <StatusStrip :items="statusItems" />

      <!-- 2. 身份实证资料卡 -->
      <InfoCard title="主体身份实证资料" :icon="User" :items="infoItems" @copy="copyText" />

      <!-- 3. 治理内容区 -->
      <GovernanceTabs v-model="activeTab">
        <AuthTabPane label="身份源关联" name="sources" :allowed="tabPermissions.sources" disable-mode>
          <IdentitySources
            :user="userInfo"
            :can-manage="hasPermission(IAM_CAPABILITIES.User.ManageIdentity)"
            @refresh="loadDetail"
          />
        </AuthTabPane>

        <AuthTabPane
          v-if="userInfo.is_member"
          label="角色治理"
          name="roles"
          :allowed="tabPermissions.roles"
          disable-mode
        >
          <RoleTable
            v-model:selection="selectedRoles"
            :loading="roleLoading"
            :data="roles"
            :total="roleTotal"
            :current-page="roleQuery.currentPage"
            :pageSize="roleQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :can-add="hasPermission(IAM_CAPABILITIES.Role.BatchAssign)"
            :can-unbind="hasPermission(IAM_CAPABILITIES.Role.Unassign)"
            :can-batch-unbind="hasPermission(IAM_CAPABILITIES.Role.BatchUnassign) && selectedRoles.length > 0"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Role.BatchUnassign)"
            @page-change="handleRolePageChange"
            @search="handleRoleSearch"
            @type-change="handleRoleTypeChange"
            @add="roleSelectVisible = true"
            @unbind="handleUnbindRole"
            @batch-unbind="handleBatchUnbindRoles"
          />
        </AuthTabPane>

        <AuthTabPane
          v-if="userInfo.is_member"
          label="策略治理"
          name="permissions"
          :allowed="tabPermissions.permissions"
          disable-mode
        >
          <PolicyTable
            v-model:selection="selectedPolicies"
            :loading="policyLoading"
            :data="policies"
            :total="policyTotal"
            :current-page="policyQuery.currentPage"
            :pageSize="policyQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :can-add="hasPermission(IAM_CAPABILITIES.Policy.BatchAttach)"
            :can-unbind="hasPermission(IAM_CAPABILITIES.Policy.Detach)"
            :can-batch-unbind="hasPermission(IAM_CAPABILITIES.Policy.BatchDetach) && selectedPolicies.length > 0"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)"
            @page-change="handlePolicyPageChange"
            @search="handlePolicySearch"
            @type-change="handlePolicyTypeChange"
            @add="handleAddPolicy"
            @unbind="handleUnbindPolicy"
            @batch-unbind="handleBatchUnbindPolicies"
          />
        </AuthTabPane>

        <AuthTabPane
          v-if="userInfo.is_system_space"
          label="租户映射"
          name="tenants"
          :allowed="tabPermissions.tenants"
          disable-mode
        >
          <TenantTable
            v-model:selection="selectedTenants"
            :loading="tenantLoading"
            :data="tenants"
            :total="tenantTotal"
            :current-page="tenantQuery.currentPage"
            :pageSize="tenantQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :can-add="hasPermission(IAM_CAPABILITIES.Tenant.Assign)"
            :can-unbind="hasPermission(IAM_CAPABILITIES.Tenant.Unassign)"
            :can-batch-unbind="hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign) && selectedTenants.length > 0"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign)"
            @page-change="handleTenantPageChange"
            @search="handleTenantSearch"
            @add="tenantSelectVisible = true"
            @unbind="handleUnbindTenant"
            @batch-unbind="handleBatchUnbindTenants"
          />
        </AuthTabPane>
      </GovernanceTabs>
    </div>

    <!-- 编辑弹窗 -->
    <FormDialog
      v-model="editVisible"
      title="完善主体资料"
      :header-icon="Coordinate"
      width="640px"
      @confirm="handleEditConfirm"
      @cancel="editVisible = false"
    >
      <UserForm ref="userFormRef" :is-edit="true" :user-id="userInfo?.id" @success="handleEditSuccess" />
    </FormDialog>

    <!-- 角色分配器 -->
    <RoleSelectDialog
      v-model="roleSelectVisible"
      title="分配角色主体"
      confirm-text="确认分配角色"
      :confirm-loading="roleLoading"
      :exclude-codes="roles.map((r) => r.code)"
      @confirm="(roles) => handleAssignRoles(roles)"
    />

    <!-- 授权向导 -->
    <AuthorizeDrawer v-model="attachPolicyVisible" :fixed-subjects="userSubjects" @success="handleAttachSuccess" />
    <PolicySelectDialog
      v-model="policySelectVisible"
      title="为用户授予权限策略"
      confirm-text="确认授予策略"
      :confirm-loading="policyLoading"
      :exclude-codes="policies.map((p) => p.code)"
      @confirm="handleAttachPolicies"
    />
    <TenantSelectDialog v-model="tenantSelectVisible" :confirm-loading="tenantLoading" @confirm="handleAssignTenants" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { Edit, Delete, User, Coordinate } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { FormDialog } from "@/common/components/Dialogs"
import UserForm from "./components/UserForm.vue"

// Composables
import { useUserDetail } from "./composables/useUserDetail"
import { useUserGovernance } from "./composables/useUserGovernance"
import { useUserDisplayItems } from "./composables/useUserDisplayItems"
import { formatTimestamp } from "@@/utils/day"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// Components
import IdentitySources from "./components/detail/IdentitySources.vue"
import RoleTable from "./components/detail/RoleTable.vue"
import PolicyTable from "./components/detail/PolicyTable.vue"
import TenantTable from "./components/detail/TenantTable.vue"
import StatusStrip from "@/common/components/Governance/StatusStrip.vue"
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import GovernanceTabs from "@/common/components/Governance/GovernanceTabs.vue"
import AuthTabPane from "@/common/components/Auth/AuthTabPane.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import RoleSelectDialog from "@/pages/iam/role/components/RoleSelectDialog.vue"
import PolicySelectDialog from "@/pages/iam/policy/components/PolicySelectDialog.vue"
import TenantSelectDialog from "@/pages/iam/tenant/components/TenantSelectDialog.vue"
import { AuthorizationSubType, type Subject } from "@/api/iam/permission/type"

const router = useRouter()
const userFormRef = ref<InstanceType<typeof UserForm>>()

const {
  userInfo,
  loading: detailLoading,
  editVisible,
  loadDetail,
  handleDelete,
  handleEdit,
  handleEditSuccess,
  copyText
} = useUserDetail()

const { hasPermission } = usePermission()

const { statusItems, infoItems } = useUserDisplayItems(userInfo)

const {
  activeTab,
  // 角色
  roles,
  roleTotal,
  roleLoading,
  roleQuery,
  selectedRoles,
  // 策略
  policies,
  policyTotal,
  policyLoading,
  policyQuery,
  selectedPolicies,
  // 租户
  tenants,
  tenantTotal,
  tenantLoading,
  tenantQuery,
  selectedTenants,
  handleRolePageChange,
  handlePolicyPageChange,
  handleTenantPageChange,
  handleRoleSearch,
  handleRoleTypeChange,
  handlePolicySearch,
  handlePolicyTypeChange,
  handleTenantSearch,
  handleAssignRoles,
  handleAddPolicy,
  roleSelectVisible,
  attachPolicyVisible,
  handleAttachSuccess,
  handleUnbindRole,
  handleBatchUnbindRoles,
  handleUnbindPolicy,
  handleUnbindTenant,
  handleBatchUnbindPolicies,
  policySelectVisible,
  handleAttachPolicies,
  tenantSelectVisible,
  handleAssignTenants,
  handleBatchUnbindTenants,
  tabPermissions
} = useUserGovernance(userInfo)

const handleEditConfirm = () => {
  userFormRef.value?.submit()
}

const userSubjects = computed<Subject[]>(() => {
  if (!userInfo.value) return []
  return [
    {
      type: AuthorizationSubType.USER,
      id: userInfo.value.username,
      name: userInfo.value.nickname || userInfo.value.username,
      desc: userInfo.value.job_title
    }
  ]
})
</script>

<style lang="scss" scoped>
.user-detail-page {
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
  padding: 0 4px;
}
</style>
