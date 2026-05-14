<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, OfficeBuilding, Lock } from "@element-plus/icons-vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import TenantForm from "./components/TenantForm.vue"

// Composables
import { useTenantDetail } from "./composables/useTenantDetail"
import { useTenantGovernance } from "./composables/useTenantGovernance"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// Components
import TenantMemberTable from "./components/detail/TenantMemberTable.vue"
import TenantInvitationList from "./components/detail/TenantInvitationList.vue"
import TenantJoinRequestList from "./components/detail/TenantJoinRequestList.vue"
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
const tenantFormRef = ref<InstanceType<typeof TenantForm>>()
const submitting = ref(false)

const handleEditSuccess = () => {
  editVisible.value = false
  tenantInfo.value && fetchTenantDetail()
}

const handleEditConfirm = async () => {
  if (!tenantFormRef.value) return
  submitting.value = true
  try {
    await tenantFormRef.value.submit()
  } finally {
    submitting.value = false
  }
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

<template>
  <PageContainer v-loading="detailLoading" class="tenant-detail-page">
    <template v-if="tenantInfo">
      <ManagerHeader
        :title="tenantInfo.name"
        :subtitle="tenantInfo.code"
        :show-back-button="true"
        @back="router.back()"
      >
        <template #actions>
          <div class="header-action-stack">
            <el-button
              class="u-gov-btn"
              :disabled="!hasPermission(IAM_CAPABILITIES.Tenant.Edit)"
              @click="editVisible = true"
            >
              <el-icon><Edit /></el-icon>
              <span>完善资料</span>
            </el-button>
            <el-button
              class="u-gov-btn is-danger"
              :disabled="!hasPermission(IAM_CAPABILITIES.Tenant.Delete)"
              @click="handleDelete"
            >
              <el-icon><Delete /></el-icon>
              <span>销毁空间</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 身份识别资料 -->
        <InfoCard title="租户空间身份标识" :icon="OfficeBuilding" :items="infoItems" @copy="copyText" />

        <!-- 治理内容 -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <!-- 成员管理 -->
            <el-tab-pane label="成员管理" name="members" :disabled="!tabPermissions.members">
              <TenantMemberTable
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
            </el-tab-pane>

            <!-- 邀请链接 -->
            <el-tab-pane label="邀请链接" name="invitation" :disabled="!tabPermissions.invitation">
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
            </el-tab-pane>

            <!-- 入驻申请 -->
            <el-tab-pane label="入驻申请" name="requests" :disabled="!tabPermissions.requests">
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
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 编辑弹窗 -->
      <FormDialog
        v-model="editVisible"
        title="完善租户资料"
        :header-icon="Lock"
        width="640px"
        :confirm-loading="submitting"
        @confirm="handleEditConfirm"
        @cancel="editVisible = false"
      >
        <TenantForm ref="tenantFormRef" :is-edit="true" :id="tenantInfo?.id" @success="handleEditSuccess" />
      </FormDialog>

      <!-- 分派成员抽屉 -->
      <UserSelectDialog v-model="assignVisible" :confirm-loading="assignConfirmLoading" @confirm="onAssignConfirm" />
    </template>
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
  .gov-action-btn {
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    &.primary {
      color: var(--gov-brand);
      border-color: #ede9fe;
      background: #f5f3ff;
      &:hover {
        background: #ede9fe;
      }
    }
    &.danger {
      color: #ef4444;
      border-color: #fee2e2;
      background: #ffffff;
      &:hover {
        background: #fef2f2;
      }
    }
    .el-icon {
      margin-right: 6px;
    }
  }
}

.governance-raw-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  &.is-active {
    color: var(--gov-brand);
  }
  &.is-disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
}
:deep(.el-tabs__active-bar) {
  background-color: var(--gov-brand);
  height: 3px;
  border-radius: 2px;
}
</style>
