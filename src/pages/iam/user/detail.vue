<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Edit, Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import UserForm from "./components/UserForm.vue"

// Composables
import { useUserDetail } from "./composables/useUserDetail"
import { useUserGovernance } from "./composables/useUserGovernance"

// Components
import UserStatusBar from "./components/detail/UserStatusBar.vue"
import UserInfoGrid from "./components/detail/UserInfoGrid.vue"
import AuthGovernance from "./components/detail/AuthGovernance.vue"
import IdentitySources from "./components/detail/IdentitySources.vue"
import RoleTable from "./components/detail/RoleTable.vue"
import PolicyTable from "./components/detail/PolicyTable.vue"
import TenantTable from "./components/detail/TenantTable.vue"

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
  handleAddTenant,
  handleUnbindRole,
  handleUnbindPolicy,
  handleBatchUnbindRoles,
  handleBatchUnbindPolicies
} = useUserGovernance()

/**
 * 提交编辑表单
 */
const handleEditConfirm = () => {
  userFormRef.value?.submit()
}

// 增加首屏加载后的强制日志，定位问题
onMounted(() => {
  console.log("[IAM-Detail] Mounted, userInfo:", userInfo.value)
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
            <el-button class="gov-action-btn" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              <span>编辑资料</span>
            </el-button>
            <el-button class="gov-action-btn danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>注销主体</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <UserStatusBar :user="userInfo" />
        <UserInfoGrid :user="userInfo" :format-timestamp="formatTimestamp" @copy="copyText" />

        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <el-tab-pane label="认证治理" name="auth">
              <AuthGovernance />
            </el-tab-pane>

            <el-tab-pane label="关联身份源" name="identities">
              <IdentitySources :user="userInfo" />
            </el-tab-pane>

            <el-tab-pane v-if="userInfo?.is_member !== false" label="角色关联" name="roles">
              <RoleTable
                v-model:selection="selectedRoles"
                :loading="roleLoading"
                :data="roles"
                :total="roleTotal"
                :current-page="roleQuery.currentPage"
                :page-size="roleQuery.pageSize"
                @page-change="handleRolePageChange"
                @search="handleRoleSearch"
                @filter-change="handleRoleTypeChange"
                @add="handleAddRole"
                @unbind="handleUnbindRole"
                @batch-unbind="handleBatchUnbindRoles"
              />
            </el-tab-pane>

            <el-tab-pane v-if="userInfo?.is_member !== false" label="权限策略" name="permissions">
              <PolicyTable
                v-model:selection="selectedPolicies"
                :loading="policyLoading"
                :data="policies"
                :total="policyTotal"
                :current-page="policyQuery.currentPage"
                :page-size="policyQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handlePolicyPageChange"
                @search="handlePolicySearch"
                @filter-change="handlePolicyTypeChange"
                @add="handleAddPolicy"
                @unbind="handleUnbindPolicy"
                @batch-unbind="handleBatchUnbindPolicies"
              />
            </el-tab-pane>

            <el-tab-pane label="所属租户" name="tenants">
              <TenantTable
                :loading="tenantLoading"
                :data="tenants"
                :total="tenantTotal"
                :current-page="tenantQuery.currentPage"
                :page-size="tenantQuery.pageSize"
                @page-change="handleTenantPageChange"
                @search="handleTenantSearch"
                @add="handleAddTenant"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <!-- 加载中或错误时的占位 -->
    <el-empty v-else-if="!detailLoading" description="未能获取到用户信息，请检查 ID 是否正确" />

    <!-- 编辑弹窗 -->
    <FormDialog
      v-model="editVisible"
      title="治理主体资料"
      :header-icon="Edit"
      width="640px"
      @confirm="handleEditConfirm"
    >
      <el-scrollbar max-height="60vh">
        <UserForm ref="userFormRef" :id="userInfo?.id!" is-edit @success="handleEditSuccess" />
      </el-scrollbar>
    </FormDialog>
  </PageContainer>
</template>

<style lang="scss" scoped>
.user-detail-page {
  overflow-y: auto;
  overflow-x: hidden;
}

.header-action-stack {
  display: flex;
  gap: 8px;
  .gov-action-btn {
    height: 34px;
    padding: 0 16px;
    border-radius: 4px;
    font-size: 13px;
    &.danger {
      color: #ef4444;
      border-color: #fee2e2;
      background: #ffffff;
      &:hover {
        background: #fef2f2;
      }
    }
  }
}

.governance-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px;
}

.governance-tabs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 20px 20px;
}

.governance-raw-tabs {
  :deep(.el-tabs__item) {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    height: 48px;
    &.is-active {
      color: #6366f1;
    }
  }
  :deep(.el-tabs__nav-wrap::after) {
    background-color: #f1f5f9;
  }
  :deep(.el-tabs__active-bar) {
    background-color: #6366f1;
    height: 2px;
  }
}

.tab-pane-empty {
  padding: 40px 0;
}
</style>
