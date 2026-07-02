<template>
  <ProGovernanceLayout
    title="治理工作台"
    :subtitle="currentTenant ? `当前管理租户: ${currentTenant.name} (${currentTenant.code})` : '正在初始化治理环境...'"
    :show-refresh="false"
  >
    <template #actions-suffix>
      <div class="gov-status-badge">
        <span class="pulse-dot" />
        <el-icon class="badge-icon"><Monitor /></el-icon>
        <span class="badge-text">治理模式已激活</span>
      </div>
    </template>

    <div class="governance-body">
      <!-- 治理内容 -->
      <GovernanceTabs v-model="activeTab">
        <AuthTabPane label="成员管理" name="members" :allowed="tabPermissions.members" disable-mode>
          <TenantMemberList v-bind="memberTableProps" />
        </AuthTabPane>

        <!-- 邀请链接 -->
        <AuthTabPane label="邀请链接" name="invitation" :allowed="tabPermissions.invitation" disable-mode>
          <TenantInvitationList v-bind="invitationTableProps" @refresh="fetchLinks" />
        </AuthTabPane>

        <!-- 入驻申请 -->
        <AuthTabPane label="入驻申请" name="requests" :allowed="tabPermissions.requests" disable-mode>
          <TenantJoinRequestList v-bind="requestTableProps" />
        </AuthTabPane>
      </GovernanceTabs>
    </div>

    <!-- 分派成员抽屉 -->
    <UserSelectDialog v-model="assignVisible" :confirm-loading="assignConfirmLoading" @confirm="onAssignConfirm" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/pinia/stores/user"
import { useTenantGovernance } from "../tenant/composables/useTenantGovernance"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// UI Components
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import GovernanceTabs from "@/common/components/Governance/GovernanceTabs.vue"
import AuthTabPane from "@/common/components/Auth/AuthTabPane.vue"
import TenantMemberList from "../tenant/components/detail/TenantMemberList.vue"
import TenantInvitationList from "../tenant/components/detail/TenantInvitationList.vue"
import TenantJoinRequestList from "../tenant/components/detail/TenantJoinRequestList.vue"
import UserSelectDialog from "@/pages/iam/user/components/UserSelectDialog.vue"
import type { User } from "@/api/iam/user/type"

import { Monitor } from "@element-plus/icons-vue"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { currentTenantId, tenants } = storeToRefs(userStore)

const activeTab = ref((route.query.tab as string) || "members")
const assignVisible = ref(false)

/** 从本地 Store 获取当前租户基本信息，避免因权限问题调用后端详情接口失败 */
const currentTenant = computed(() => {
  return tenants.value.find((t) => t.id === currentTenantId.value)
})

const { hasPermission } = usePermission()

/** 治理核心逻辑复用 */
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
  requests,
  requestsTotal,
  requestsLoading,
  requestsQuery,
  handleRequestsPageChange,
  handleRequestsSearch,
  handleApproval,
  tabPermissions
} = useTenantGovernance(() => currentTenantId.value, activeTab)

const formatTimestamp = (ts: string | number) => {
  if (!ts) return "-"
  return new Date(Number(ts)).toLocaleString()
}

watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

const onAssignConfirm = async (users: User[]) => {
  const userIds = users.map((u) => u.id)
  const success = await handleBatchAssignMember(userIds)
  if (success) assignVisible.value = false
}

/**
 * 成员管理表格属性打包
 */
const memberTableProps = computed(() => ({
  selection: membersSelection.value,
  loading: memberLoading.value,
  data: members.value,
  total: memberTotal.value,
  currentPage: memberQuery.value.currentPage,
  pageSize: memberQuery.value.pageSize,
  formatTimestamp,
  showAssign: false,
  canAdd: hasPermission(IAM_CAPABILITIES.Tenant.Assign),
  canUnbind: hasPermission(IAM_CAPABILITIES.Tenant.Unassign),
  canBatchUnbind: hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign) && membersSelection.value.length > 0,
  selectable: () => hasPermission(IAM_CAPABILITIES.Tenant.BatchUnassign),
  onPageChange: handleMemberPageChange,
  onSearch: handleMemberSearch,
  onAdd: () => (assignVisible.value = true),
  onUnbind: handleRemoveMember,
  onBatchUnbind: handleBatchRemoveMember,
  "onUpdate:selection": (val: any) => (membersSelection.value = val)
}))

/**
 * 邀请链接表格属性打包
 */
const invitationTableProps = computed(() => ({
  selection: linksSelection.value,
  tenantId: currentTenantId.value,
  data: links.value,
  loading: linksLoading.value,
  total: linksTotal.value,
  currentPage: linksQuery.value.currentPage,
  pageSize: linksQuery.value.pageSize,
  canAdd: hasPermission(IAM_CAPABILITIES.Invitation.Add),
  canRevoke: hasPermission(IAM_CAPABILITIES.Invitation.Revoke),
  canBatchRevoke: hasPermission(IAM_CAPABILITIES.Invitation.BatchRevoke) && linksSelection.value.length > 0,
  selectable: () => hasPermission(IAM_CAPABILITIES.Invitation.BatchRevoke),
  onPageChange: handleLinksPageChange,
  onSearch: handleLinksSearch,
  onRevoke: handleRevokeInvitation,
  onBatchRevoke: handleBatchRevokeInvitation,
  "onUpdate:selection": (val: any) => (linksSelection.value = val)
}))

/**
 * 入驻申请表格属性打包
 */
const requestTableProps = computed(() => ({
  data: requests.value,
  loading: requestsLoading.value,
  total: requestsTotal.value,
  currentPage: requestsQuery.value.currentPage,
  pageSize: requestsQuery.value.pageSize,
  canHandle: hasPermission(IAM_CAPABILITIES.Invitation.Handle),
  onPageChange: handleRequestsPageChange,
  onSearch: handleRequestsSearch,
  onApprove: handleApproval
}))
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
  padding: 0 4px 24px;
}

.header-action-stack {
  display: flex;
  gap: 12px;
  align-items: center;
}

.gov-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: #ffffff;
  border: 1px solid #e0e7ff;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  }

  .badge-icon {
    font-size: 14px;
    color: #6366f1;
  }

  .badge-text {
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    letter-spacing: 0.02em;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  70% {
    transform: scale(2.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
