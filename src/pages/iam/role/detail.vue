<script setup lang="ts">
import { computed, ref } from "vue"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import { Delete, OfficeBuilding, Edit, Coordinate } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import StatusStrip from "@/common/components/Governance/StatusStrip.vue"

// Composables
import { useRoleDetail } from "./composables/useRoleDetail"
import { useRoleGovernance } from "./composables/useRoleGovernance"
import { useRoleDisplayItems } from "./composables/useRoleDisplayItems"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

// Components
import RoleForm from "./components/RoleForm.vue"
import MemberTable from "./components/detail/MemberTable.vue"
import PolicyTable from "@/pages/iam/user/components/detail/PolicyTable.vue"
import PolicyServiceInsights from "@/pages/iam/policy/components/detail/PolicyServiceInsights.vue"
import InheritanceTable from "./components/detail/InheritanceTable.vue"
import RoleSelectDialog from "./components/RoleSelectDialog.vue"
import UserSelectDialog from "@/pages/iam/user/components/UserSelectDialog.vue"
import PolicySelectDialog from "@/pages/iam/policy/components/PolicySelectDialog.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import { AuthorizationSubType, type Subject } from "@/api/iam/permission/type"

const router = useRouter()

const {
  roleInfo,
  loading: detailLoading,
  editVisible,
  handleEdit,
  handleEditSuccess,
  handleDelete,
  formatTimestamp
} = useRoleDetail()

const { hasPermission } = usePermission()

const {
  activeTab,
  members,
  memberTotal,
  memberLoading,
  memberQuery,
  selectedMembers,
  policies,
  policyTotal,
  policyLoading,
  policyQuery,
  selectedPolicies,
  handleMemberPageChange,
  handleMemberSearch,
  addMemberVisible,
  handleAddMember,
  handleAssignMembers,
  handleUnbindMember,
  handleBatchUnbindMembers,
  handlePolicyPageChange,
  handlePolicySearch,
  handlePolicyTypeChange,
  attachPolicyVisible,
  handleAddPolicy,
  handleAttachPolicySuccess,
  handleUnbindPolicy,
  handleBatchUnbindPolicies,
  analyzedInlinePolicies,
  analyzedLoading,
  parentRoles,
  inheritanceLoading,
  addParentVisible,
  policySelectVisible,
  handleAddParents,
  handleAttachPolicies,
  handleRemoveParent
} = useRoleGovernance(
  computed(() => roleInfo.value?.id),
  computed(() => roleInfo.value?.code)
)

const { statusItems, infoItems } = useRoleDisplayItems(roleInfo, memberTotal, policyTotal)

// 完善职责 (编辑角色) 逻辑
const roleFormRef = ref()

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
  ElMessage.success("已复制到剪贴板")
}

/**
 * 核心聚合算法：将多条内联策略的服务描述进行打平展示
 */
const aggregatedServices = computed(() => {
  const allServices: any[] = []

  analyzedInlinePolicies.value.forEach((p) => {
    ;(p.services || []).forEach((s) => {
      // 携带来源策略信息，以便在下钻时区分
      allServices.push({
        ...JSON.parse(JSON.stringify(s)),
        policy_code: p.code
      })
    })
  })

  // 按服务名称排序，让相同子系统的记录挨在一起
  return allServices.sort((a, b) => a.service_name.localeCompare(b.service_name))
})

/**
 * 聚合策略源码：将多条策略的 Statement 拼接
 */
const aggregatedPolicy = computed(() => {
  if (analyzedInlinePolicies.value.length === 0) return null
  return {
    code: "aggregated",
    name: "聚合内联分析视图",
    statement: analyzedInlinePolicies.value.flatMap((p) => p.statement || [])
  } as any
})

/**
 * 将当前角色包装为固定授权主体
 */
const roleSubjects = computed<Subject[]>(() => {
  if (!roleInfo.value) return []
  return [
    {
      type: AuthorizationSubType.ROLE,
      id: roleInfo.value.code,
      name: roleInfo.value.name,
      desc: roleInfo.value.desc
    }
  ]
})

const handleConfirmEdit = () => {
  roleFormRef.value?.submit()
}
</script>

<template>
  <PageContainer v-loading="detailLoading" class="role-detail-page">
    <template v-if="roleInfo">
      <ManagerHeader :title="roleInfo.name" :subtitle="roleInfo.code" :show-back-button="true" @back="router.back()">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="u-gov-btn" :disabled="!hasPermission(IAM_CAPABILITIES.Role.Edit)" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              <span>完善职责</span>
            </el-button>
            <el-button
              class="u-gov-btn is-danger"
              :disabled="!hasPermission(IAM_CAPABILITIES.Role.Edit)"
              @click="handleDelete"
            >
              <el-icon><Delete /></el-icon>
              <span>注销主体</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 1. 治理状态概览 -->
        <StatusStrip :items="statusItems" />

        <!-- 2. 主体身份与职责概览 -->
        <InfoCard title="主体身份与职责定义" :icon="OfficeBuilding" :items="infoItems" @copy="handleCopy" />

        <!-- 3. 治理深度内容区 (Tabs) -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <el-tab-pane label="关联用户管理" name="members">
              <MemberTable
                v-model:selection="selectedMembers"
                :loading="memberLoading"
                :data="members"
                :total="memberTotal"
                :current-page="memberQuery.currentPage"
                :pageSize="memberQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handleMemberPageChange"
                @search="handleMemberSearch"
                @add="handleAddMember"
                @unbind="handleUnbindMember"
                @batch-unbind="handleBatchUnbindMembers"
              />
            </el-tab-pane>

            <el-tab-pane label="信任继承关系" name="inheritance">
              <InheritanceTable
                :loading="inheritanceLoading"
                :data="parentRoles"
                @add="addParentVisible = true"
                @remove="(row) => handleRemoveParent(row.code)"
                @view="(row) => router.push({ query: { ...router.currentRoute.value.query, code: row.code } })"
              />
            </el-tab-pane>

            <el-tab-pane label="内联策略分析" name="inline">
              <div v-loading="analyzedLoading" class="inline-gov-container">
                <template v-if="analyzedInlinePolicies.length > 0">
                  <PolicyServiceInsights :policy="aggregatedPolicy" :services="aggregatedServices" @copy="handleCopy" />
                </template>
                <div v-else-if="!analyzedLoading" class="empty-analysis-hint">
                  <el-empty description="未发现可分析的内联策略明细" :image-size="100" />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="托管策略治理" name="permissions">
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
                @unbind="(row) => handleUnbindPolicy(row)"
                @batch-unbind="handleBatchUnbindPolicies"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 功能对话框 -->
      <UserSelectDialog
        v-model="addMemberVisible"
        title="关联用户"
        subtitle="检索并添加目标用户，将其加入到当前角色组中"
        confirm-text="确认关联"
        :confirm-loading="memberLoading"
        @confirm="(users) => handleAssignMembers(users.map((u) => u.username))"
      />
      <RoleSelectDialog
        v-model="addParentVisible"
        title="建立信任继承关系"
        subtitle="通过建立角色继承关系，实现权限的阶梯式传递与复用"
        confirm-text="确认建立继承关系"
        :confirm-loading="inheritanceLoading"
        :exclude-codes="[roleInfo.code, ...parentRoles.map((r) => r.code)]"
        @confirm="(roles) => handleAddParents(roles.map((r) => r.code))"
      />
      <AuthorizeDrawer
        v-model="attachPolicyVisible"
        :fixed-subjects="roleSubjects"
        @success="handleAttachPolicySuccess"
      />
      <PolicySelectDialog
        v-model="policySelectVisible"
        title="为角色分派权限策略"
        confirm-text="确认分派策略"
        :confirm-loading="policyLoading"
        :exclude-codes="policies.map((p) => p.code)"
        @confirm="handleAttachPolicies"
      />

      <!-- 编辑主体资料弹窗 -->
      <FormDialog
        v-model="editVisible"
        title="完善主体职责定义"
        :header-icon="Coordinate"
        width="640px"
        @confirm="handleConfirmEdit"
        @cancel="editVisible = false"
      >
        <RoleForm
          :key="roleInfo.code"
          ref="roleFormRef"
          :code="roleInfo.code"
          :is-edit="true"
          @success="handleEditSuccess"
        />
      </FormDialog>
    </template>
  </PageContainer>
</template>

<style lang="scss" scoped>
.role-detail-page {
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

/* 置顶状态条样式 */
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

/* 核心资料卡片 */
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

.inline-gov-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
