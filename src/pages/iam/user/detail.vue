<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { Edit, Delete, User, Coordinate } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import UserForm from "./components/UserForm.vue"

// Composables
import { useUserDetail } from "./composables/useUserDetail"
import { useUserGovernance } from "./composables/useUserGovernance"

// Components
import AuthGovernance from "./components/detail/AuthGovernance.vue"
import IdentitySources from "./components/detail/IdentitySources.vue"
import RoleTable from "./components/detail/RoleTable.vue"
import PolicyTable from "./components/detail/PolicyTable.vue"
import TenantTable from "./components/detail/TenantTable.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import type { Subject } from "@/api/iam/permission/type"

const router = useRouter()
const userFormRef = ref<InstanceType<typeof UserForm>>()

const {
  userInfo,
  loading: detailLoading,
  editVisible,
  handleDelete,
  handleEdit,
  handleEditSuccess,
  formatTimestamp,
  copyText
} = useUserDetail()

const userId = computed(() => userInfo.value?.id)

const {
  activeTab,
  roles,
  roleTotal,
  roleLoading,
  roleQuery,
  selectedRoles,
  policies,
  policyTotal,
  policyLoading,
  policyQuery,
  selectedPolicies,
  tenants,
  tenantTotal,
  tenantLoading,
  tenantQuery,
  handleRolePageChange,
  handlePolicyPageChange,
  handleTenantPageChange,
  handleRoleSearch,
  handleRoleTypeChange,
  handlePolicySearch,
  handlePolicyTypeChange,
  handleTenantSearch,
  handleAddRole,
  handleAddPolicy,
  attachPolicyVisible,
  handleAttachSuccess,
  handleAddTenant,
  handleUnbindRole,
  handleUnbindPolicy,
  handleBatchUnbindRoles,
  handleBatchUnbindPolicies
} = useUserGovernance(userId)

/**
 * 提交编辑表单
 */
const handleEditConfirm = () => {
  userFormRef.value?.submit()
}

// 将当前用户信息包装为固定授权主体
const userSubjects = computed<Subject[]>(() => {
  if (!userInfo.value) return []
  return [
    {
      type: "user",
      id: userInfo.value.username,
      name: userInfo.value.nickname || userInfo.value.username,
      desc: userInfo.value.job_title
    }
  ]
})
</script>

<template>
  <PageContainer v-loading="detailLoading" class="user-detail-page">
    <template v-if="userInfo">
      <ManagerHeader
        :title="userInfo.nickname || userInfo.username"
        :subtitle="userInfo.username"
        :show-back-button="true"
        @back="router.back()"
      >
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              <span>完善资料</span>
            </el-button>
            <el-button v-if="userInfo.is_member" class="gov-action-btn danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>注销主体</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 1. 身份安全状态条 -->
        <div class="governance-status-strip">
          <div class="status-item">
            <span class="dot success" />
            <span class="label">账号来源:</span>
            <span class="value tint">{{ userInfo.source === "ldap" ? "LDAP 同步" : "本地账户" }}</span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot" :class="userInfo.console_login ? 'success' : 'info'" />
            <span class="label">控制台登录:</span>
            <span class="value" :class="userInfo.console_login ? 'success' : 'info'">
              {{ userInfo.console_login ? "已开启" : "未授权" }}
            </span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot" :class="userInfo.mfa_bound ? 'success' : 'warning'" />
            <span class="label">MFA 状态:</span>
            <span class="value" :class="userInfo.mfa_bound ? 'success' : 'warning'">
              {{ userInfo.mfa_bound ? "已绑定" : "未绑定" }}
            </span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot success" />
            <span class="label">风险等级:</span>
            <span class="value success">L0 (安全)</span>
          </div>
        </div>

        <!-- 2. 身份实证资料卡 -->
        <div class="info-card consolidated-card">
          <div class="info-header">
            <el-icon><User /></el-icon>
            <span>主体身份实证资料</span>
          </div>
          <div class="info-content grid-4-cols">
            <div class="info-item">
              <div class="label">姓名/昵称</div>
              <div class="value">{{ userInfo.nickname || userInfo.username }}</div>
            </div>
            <div class="info-item">
              <div class="label">登录用户名 (Unique)</div>
              <div class="value mono copyable" @click="copyText(userInfo.username)">
                {{ userInfo.username }}
              </div>
            </div>
            <div class="info-item">
              <div class="label">当前职位/职能</div>
              <div class="value">{{ userInfo.job_title || "未定义职责" }}</div>
            </div>
            <div class="info-item full">
              <div class="label">核心职责描述</div>
              <div class="value desc">
                {{ userInfo.job_title ? `该主体主要负责 ${userInfo.job_title} 相关治理职能` : "暂无详细职责说明" }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 治理内容区 -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <!-- 特有：认证与安全治理 -->
            <el-tab-pane label="认证治理" name="auth">
              <AuthGovernance :user="userInfo" />
            </el-tab-pane>

            <!-- 特有：多维度身份源 -->
            <el-tab-pane label="身份源信息" name="identities">
              <IdentitySources :user="userInfo" />
            </el-tab-pane>

            <el-tab-pane v-if="userInfo.is_member" label="角色治理" name="roles">
              <RoleTable
                v-model:selection="selectedRoles"
                :loading="roleLoading"
                :data="roles"
                :total="roleTotal"
                :current-page="roleQuery.currentPage"
                :pageSize="roleQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handleRolePageChange"
                @search="handleRoleSearch"
                @type-change="handleRoleTypeChange"
                @add="handleAddRole"
                @unbind="handleUnbindRole"
                @batch-unbind="handleBatchUnbindRoles"
              />
            </el-tab-pane>

            <el-tab-pane v-if="userInfo.is_member" label="策略治理" name="permissions">
              <PolicyTable
                v-model:selection="selectedPolicies"
                :loading="policyLoading"
                :data="policies"
                :total="policyTotal"
                :current-page="policyQuery.currentPage"
                :pageSize="policyQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handlePolicyPageChange"
                @search="handlePolicySearch"
                @type-change="handlePolicyTypeChange"
                @add="handleAddPolicy"
                @unbind="handleUnbindPolicy"
                @batch-unbind="handleBatchUnbindPolicies"
              />
            </el-tab-pane>

            <el-tab-pane v-if="userInfo.is_system_space" label="租户映射" name="tenants">
              <TenantTable
                :loading="tenantLoading"
                :data="tenants"
                :total="tenantTotal"
                :current-page="tenantQuery.currentPage"
                :pageSize="tenantQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handleTenantPageChange"
                @search="handleTenantSearch"
                @add="handleAddTenant"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
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
        <UserForm ref="userFormRef" :is-edit="true" :id="userInfo?.id" @success="handleEditSuccess" />
      </FormDialog>

      <!-- 授权向导 -->
      <AuthorizeDrawer v-model="attachPolicyVisible" :fixed-subjects="userSubjects" @success="handleAttachSuccess" />
    </template>
  </PageContainer>
</template>

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

.governance-status-strip {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.success {
        background: #10b981;
      }
      &.info {
        background: var(--gov-brand);
      }
      &.warning {
        background: #f59e0b;
      }
    }

    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      font-weight: 700;
      &.success {
        color: #10b981;
      }
      &.info {
        color: var(--gov-brand);
      }
      &.warning {
        color: #f59e0b;
      }
      &.tint {
        color: #334155;
      }
    }
  }

  .divider {
    width: 1px;
    height: 14px;
    background: #e2e8f0;
  }
}

.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;
    .el-icon {
      color: var(--gov-brand);
    }
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      margin-left: 12px;
    }
  }

  .info-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 24px;
    &.grid-4-cols {
      grid-template-columns: 1fr 1fr 1.5fr;
    }

    .info-item {
      &.full {
        grid-column: 1 / -1;
      }
      .label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .value {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
        &.mono {
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        &.copyable {
          cursor: pointer;
          &:hover {
            color: var(--gov-brand);
            text-decoration: underline;
          }
        }
        &.desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }
      }
    }
  }
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
}
:deep(.el-tabs__active-bar) {
  background-color: var(--gov-brand);
  height: 3px;
  border-radius: 2px;
}
</style>
