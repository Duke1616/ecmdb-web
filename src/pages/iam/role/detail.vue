<script setup lang="ts">
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import { Delete, OfficeBuilding, Edit } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import InfoCard from "@/common/components/Governance/InfoCard.vue"

// Composables
import { useRoleDetail } from "./composables/useRoleDetail"
import { useRoleGovernance } from "./composables/useRoleGovernance"

// Components
import MemberTable from "./components/detail/MemberTable.vue"
import PolicyTable from "@/pages/iam/user/components/detail/PolicyTable.vue"
import PolicyServiceInsights from "@/pages/iam/policy/components/detail/PolicyServiceInsights.vue"
import InheritanceTable from "./components/detail/InheritanceTable.vue"
import AddParentDrawer from "./components/detail/AddParentDrawer.vue"
import AddMemberDrawer from "./components/detail/AddMemberDrawer.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import type { Subject } from "@/api/iam/permission/type"

const router = useRouter()

const { roleInfo, loading: detailLoading, handleDelete, formatTimestamp } = useRoleDetail()

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
  ElMessage.success("已复制到剪贴板")
}

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
  handleAddParents,
  handleRemoveParent
} = useRoleGovernance(
  computed(() => roleInfo.value?.id),
  computed(() => roleInfo.value?.code)
)

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
      type: "role",
      id: roleInfo.value.code,
      name: roleInfo.value.name,
      desc: roleInfo.value.desc
    }
  ]
})
const infoItems = computed(() => {
  if (!roleInfo.value) return []
  return [
    { label: "角色显示名称", value: roleInfo.value.name },
    { label: "唯一识别码 (CODE)", value: roleInfo.value.code, mono: true, copyable: true },
    {
      label: "角色类型",
      value: roleInfo.value.type === 1 ? "系统预设 (System)" : "自定义 (Custom)"
    },
    {
      label: "职责描述说明",
      value: roleInfo.value.desc || "暂无详细职责说明",
      full: true,
      desc: true
    }
  ]
})
</script>

<template>
  <PageContainer v-loading="detailLoading" class="role-detail-page">
    <template v-if="roleInfo">
      <ManagerHeader :title="roleInfo.name" :subtitle="roleInfo.code" :show-back-button="true" @back="router.back()">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn primary" plain>
              <el-icon><Edit /></el-icon>
              <span>完善职责</span>
            </el-button>
            <el-button class="gov-action-btn danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>注销主体</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 身份与职责概览 -->
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
                @unbind="(row) => ElMessage.info(`即将解绑用户: ${row.username}`)"
                @batch-unbind="() => {}"
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
                @unbind="(row) => handleUnbindPolicy(roleInfo?.code || '', row)"
                @batch-unbind="handleBatchUnbindPolicies"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 功能侧边栏 -->
      <AddMemberDrawer v-model="addMemberVisible" :loading="memberLoading" @confirm="handleAssignMembers" />
      <AddParentDrawer
        v-model="addParentVisible"
        :loading="inheritanceLoading"
        :exclude-codes="[roleInfo.code, ...parentRoles.map((r) => r.code)]"
        @confirm="handleAddParents"
      />
      <AuthorizeDrawer
        v-model="attachPolicyVisible"
        :fixed-subjects="roleSubjects"
        @success="handleAttachPolicySuccess"
      />
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
