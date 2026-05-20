<template>
  <ProGovernanceLayout
    v-if="tenantInfo"
    :title="tenantInfo.name"
    :subtitle="tenantInfo.code"
    :show-back-button="true"
    :show-refresh="false"
    :is-detail="true"
    :swap-actions="false"
    :primary-action="{
      capability: IAM_CAPABILITIES.Tenant.Edit,
      label: '完善资料',
      icon: Edit
    }"
    :danger-action="{
      capability: IAM_CAPABILITIES.Tenant.Delete,
      label: '销毁空间',
      icon: Delete
    }"
    class="tenant-detail-page"
    @back="router.back()"
    @primary-action="editVisible = true"
    @danger-action="handleDelete"
  >
    <div v-loading="detailLoading" class="governance-body">
      <!-- 身份识别资料 -->
      <InfoCard title="租户空间身份标识" :icon="OfficeBuilding" :items="infoItems" @copy="copyText" />

      <!-- 治理内容 -->
      <GovernanceTabs v-model="activeTab">
        <!-- 成员管理 -->
        <AuthTabPane label="成员管理" name="members" :allowed="tabPermissions.members" disable-mode>
          <TenantMemberList
            v-model:selection="membersSelection"
            :loading="memberLoading"
            :data="members"
            :total="memberTotal"
            :current-page="memberQuery.currentPage"
            :page-size="memberQuery.pageSize"
            :format-timestamp="formatTimestamp"
            :can-add="hasPermission(IAM_CAPABILITIES.Tenant.Assign)"
            :can-unbind="hasPermission(IAM_CAPABILITIES.Tenant.Unassign)"
            :can-batch-unbind="hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign) && membersSelection.length > 0"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign)"
            @page-change="handleMemberPageChange"
            @search="handleMemberSearch"
            @add="assignVisible = true"
            @unbind="handleRemoveMember"
            @batch-unbind="handleBatchRemoveMember"
          />
        </AuthTabPane>

        <!-- 邀请链接 -->
        <AuthTabPane label="邀请链接" name="invitation" :allowed="tabPermissions.invitation" disable-mode>
          <TenantInvitationList
            v-model:selection="linksSelection"
            :tenant-id="tenantInfo.id"
            :data="links"
            :loading="linksLoading"
            :total="linksTotal"
            :current-page="linksQuery.currentPage"
            :page-size="linksQuery.pageSize"
            :can-add="hasPermission(IAM_CAPABILITIES.Invitation.Add)"
            :can-revoke="hasPermission(IAM_CAPABILITIES.Invitation.Revoke)"
            :can-batch-revoke="hasPermission(IAM_CAPABILITIES.Invitation.BatchRevoke) && linksSelection.length > 0"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Invitation.BatchRevoke)"
            @page-change="handleLinksPageChange"
            @search="handleLinksSearch"
            @revoke="handleRevokeInvitation"
            @batch-revoke="handleBatchRevokeInvitation"
            @refresh="fetchLinks"
          />
        </AuthTabPane>

        <!-- 入驻申请 -->
        <AuthTabPane label="入驻申请" name="requests" :allowed="tabPermissions.requests" disable-mode>
          <TenantJoinRequestList
            :data="requests"
            :loading="requestsLoading"
            :total="requestsTotal"
            :current-page="requestsQuery.currentPage"
            :page-size="requestsQuery.pageSize"
            :can-handle="hasPermission(IAM_CAPABILITIES.Invitation.Handle)"
            @page-change="handleRequestsPageChange"
            @search="handleRequestsSearch"
            @approve="handleApproval"
          />
        </AuthTabPane>
      </GovernanceTabs>
    </div>

    <!-- 编辑租户自治弹窗 -->
    <TenantDialog v-model="editVisible" :id="tenantInfo?.id" @success="handleEditSuccess" />

    <!-- 分派成员抽屉 -->
    <UserSelectDialog
      v-model="assignVisible"
      :confirm-loading="assignConfirmLoading"
      :exclude-codes="members.map((u) => u.username)"
      @confirm="onAssignConfirm"
    />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, OfficeBuilding } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import TenantDialog from "./components/TenantDialog.vue"

// Composables
import { useTenantDetail } from "./composables/useTenantDetail"
import { useTenantGovernance } from "./composables/useTenantGovernance"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// Components
import TenantMemberList from "./components/detail/TenantMemberList.vue"
import TenantInvitationList from "./components/detail/TenantInvitationList.vue"
import TenantJoinRequestList from "./components/detail/TenantJoinRequestList.vue"
import GovernanceTabs from "@/common/components/Governance/GovernanceTabs.vue"
import AuthTabPane from "@/common/components/Auth/AuthTabPane.vue"
import UserSelectDialog from "@/pages/iam/user/components/UserSelectDialog.vue"
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import type { User } from "@/api/iam/user/type"

const router = useRouter()
const { hasPermission } = usePermission()
const {
  tenantInfo,
  loading: detailLoading,
  handleDelete,
  copyText,
  formatTimestamp,
  fetchTenantDetail
} = useTenantDetail()

const infoItems = computed(() => {
  if (!tenantInfo.value) return []
  return [
    { label: "租户正式名称", value: tenantInfo.value.name },
    { label: "空间编码", value: tenantInfo.value.code, mono: true, copyable: true },
    { label: "登录域名", value: tenantInfo.value.domain || "iam.ecmdb.com", mono: true },
    {
      label: "空间职责定义",
      value: `本项目租户空间用于隔离 ${tenantInfo.value.name} 的资源与权限子集，确保数据与策略的强制隔离。`,
      full: true,
      desc: true
    }
  ]
})
const editVisible = ref(false)
const assignVisible = ref(false)
const activeTab = ref((router.currentRoute.value.query.tab as string) || "members")

// 响应查询参数变化，自动切换 Tab
watch(
  () => router.currentRoute.value.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab as string
    }
  }
)

const {
  members,
  memberTotal,
  memberLoading,
  memberQuery,
  assignConfirmLoading,
  handleMemberPageChange,
  handleMemberSearch,
  handleBatchAssignMember,
  handleRemoveMember,
  handleBatchRemoveMember,
  membersSelection,
  // 邀请
  links,
  linksTotal,
  linksLoading,
  linksQuery,
  handleLinksPageChange,
  handleLinksSearch,
  handleRevokeInvitation,
  handleBatchRevokeInvitation,
  linksSelection,
  fetchLinks,
  // 申请
  requests,
  requestsTotal,
  requestsLoading,
  requestsQuery,
  handleRequestsPageChange,
  handleRequestsSearch,
  handleApproval,
  tabPermissions
} = useTenantGovernance(() => tenantInfo.value?.id, activeTab)

const handleEditSuccess = () => {
  editVisible.value = false
  tenantInfo.value && fetchTenantDetail()
}

// 分派处理
const onAssignConfirm = async (users: User[]) => {
  const userIds = users.map((u) => u.id)
  const success = await handleBatchAssignMember(userIds)
  if (success) {
    assignVisible.value = false
    fetchTenantDetail()
  }
}
</script>

<style lang="scss" scoped>
.tenant-detail-page {
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
