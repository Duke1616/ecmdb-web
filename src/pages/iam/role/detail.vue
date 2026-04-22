<script setup lang="ts">
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import { Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"

// Composables
import { useRoleDetail } from "./composables/useRoleDetail"
import { useRoleGovernance } from "./composables/useRoleGovernance"

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
</script>

<template>
  <PageContainer v-loading="detailLoading" class="role-detail-page">
    <template v-if="roleInfo">
      <ManagerHeader :title="roleInfo.name" :subtitle="roleInfo.code" :show-back-button="true" @back="router.back()">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>注销主体</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 职责描述区：复刻 UserInfoGrid 的部分排版感 -->
        <div class="role-brief-section">
          <div class="section-label">职责描述说明</div>
          <div class="section-content">
            {{ roleInfo.desc || "暂无职责描述信息" }}
          </div>
        </div>

        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <el-tab-pane label="关联用户" name="members">
              <MemberTable
                v-model:selection="selectedMembers"
                :loading="memberLoading"
                :data="members"
                :total="memberTotal"
                :current-page="memberQuery.currentPage"
                :pageSize="memberQuery.pageSize"
                @page-change="handleMemberPageChange"
                @search="handleMemberSearch"
                @add="handleAddMember"
                @unbind="(row) => handleAssignMembers([]) /* TODO: 移除成员接口未就绪 */"
                @batch-unbind="() => {}"
              />
            </el-tab-pane>

            <el-tab-pane label="继承关系" name="inheritance">
              <InheritanceTable
                :loading="inheritanceLoading"
                :data="parentRoles"
                @add="addParentVisible = true"
                @remove="(row) => handleRemoveParent(row.code)"
                @view="(row) => router.push({ query: { ...router.currentRoute.value.query, code: row.code } })"
              />
            </el-tab-pane>

            <el-tab-pane label="内联策略" name="inline">
              <div v-loading="analyzedLoading" class="inline-gov-container">
                <template v-if="analyzedInlinePolicies.length > 0">
                  <PolicyServiceInsights
                    v-for="p in analyzedInlinePolicies"
                    :key="p.code"
                    :policy="p as any"
                    :services="p.services || []"
                    @copy="handleCopy"
                  />
                </template>
                <div v-else-if="!analyzedLoading" class="empty-analysis-hint">
                  <el-empty description="未发现可分析的内联策略明细" :image-size="100" />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="权限策略" name="permissions">
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
                @unbind="handleUnbindPolicy(roleInfo.code, $event)"
                @batch-unbind="() => {}"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!detailLoading" description="未能获取到角色详情，请检查标识是否正确" />

    <!-- 策略授权向导 (复用全局授权组件) -->
    <AuthorizeDrawer
      v-model="attachPolicyVisible"
      :fixed-subjects="roleSubjects"
      @success="handleAttachPolicySuccess"
    />

    <!-- 成员添加向导 -->
    <AddMemberDrawer v-model="addMemberVisible" :loading="memberLoading" @confirm="handleAssignMembers" />

    <!-- 角色继承抽屉 -->
    <AddParentDrawer v-model="addParentVisible" :loading="inheritanceLoading" @confirm="handleAddParents" />
  </PageContainer>
</template>

<style lang="scss" scoped>
.role-detail-page {
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

.role-brief-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px 20px;

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .section-content {
    font-size: 13.5px;
    color: #334155;
    line-height: 1.6;
  }
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
</style>
