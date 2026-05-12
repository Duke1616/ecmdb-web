<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/pinia/stores/user"
import { useTenantGovernance } from "../tenant/composables/useTenantGovernance"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// UI Components
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import TenantMemberTable from "../tenant/components/detail/TenantMemberTable.vue"
import TenantInvitationList from "../tenant/components/detail/TenantInvitationList.vue"
import TenantJoinRequestList from "../tenant/components/detail/TenantJoinRequestList.vue"
import UserSelectDrawer from "@/pages/iam/user/components/UserSelectDrawer.vue"
import type { User } from "@/api/iam/user/type"

import { Monitor } from "@element-plus/icons-vue"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { currentTenantId, tenants } = storeToRefs(userStore)

const loading = ref(false)
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
  links,
  linksTotal,
  linksLoading,
  linksQuery,
  handleLinksPageChange,
  handleLinksSearch,
  handleRevokeInvitation,
  fetchLinks,
  requests,
  requestsTotal,
  requestsLoading,
  requestsQuery,
  handleRequestsPageChange,
  handleRequestsSearch,
  handleApproval
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
</script>

<template>
  <PageContainer v-loading="loading" class="tenant-detail-page">
    <ManagerHeader
      title="治理工作台"
      :subtitle="
        currentTenant ? `当前管理租户: ${currentTenant.name} (${currentTenant.code})` : '正在初始化治理环境...'
      "
    >
      <template #actions>
        <div class="header-action-stack">
          <div class="gov-status-badge">
            <span class="pulse-dot" />
            <el-icon class="badge-icon"><Monitor /></el-icon>
            <span class="badge-text">治理模式已激活</span>
          </div>
        </div>
      </template>
    </ManagerHeader>

    <div class="governance-body">
      <!-- 治理内容 -->
      <div class="governance-tabs-card">
        <el-tabs v-model="activeTab" class="governance-raw-tabs">
          <!-- 成员管理 -->
          <el-tab-pane label="成员管理" name="members">
            <TenantMemberTable
              :loading="memberLoading"
              :data="members"
              :total="memberTotal"
              :current-page="memberQuery.currentPage"
              :pageSize="memberQuery.pageSize"
              :format-timestamp="formatTimestamp"
              :show-assign="false"
              @page-change="handleMemberPageChange"
              @search="handleMemberSearch"
              @add="assignVisible = true"
              @unbind="handleRemoveMember"
            />
          </el-tab-pane>

          <!-- 邀请链接 -->
          <el-tab-pane v-if="hasPermission(IAM_CAPABILITIES.Invitation.View)" label="邀请链接" name="invitation">
            <TenantInvitationList
              :tenant-id="currentTenantId"
              :data="links"
              :loading="linksLoading"
              :total="linksTotal"
              :current-page="linksQuery.currentPage"
              :pageSize="linksQuery.pageSize"
              @page-change="handleLinksPageChange"
              @search="handleLinksSearch"
              @revoke="handleRevokeInvitation"
              @refresh="fetchLinks"
            />
          </el-tab-pane>

          <!-- 入驻申请 -->
          <el-tab-pane v-if="hasPermission(IAM_CAPABILITIES.User.ManageIdentity)" label="入驻申请" name="requests">
            <TenantJoinRequestList
              :data="requests"
              :loading="requestsLoading"
              :total="requestsTotal"
              :current-page="requestsQuery.currentPage"
              :pageSize="requestsQuery.pageSize"
              @page-change="handleRequestsPageChange"
              @search="handleRequestsSearch"
              @approve="handleApproval"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 分派成员抽屉 -->
    <UserSelectDrawer v-model="assignVisible" :confirm-loading="assignConfirmLoading" @confirm="onAssignConfirm" />
  </PageContainer>
</template>

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

.governance-tabs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 24px 24px;
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

.governance-raw-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  &.is-active {
    color: var(--gov-brand);
  }
}

:deep(.el-tabs__active-bar) {
  background-color: var(--gov-brand);
  height: 3px;
  border-radius: 2px;
}
</style>
