<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"

// Composables
import { usePolicyDetail } from "./composables/usePolicyDetail"

// Components
import PolicyStatusBar from "./components/detail/PolicyStatusBar.vue"
import PolicyInfoGrid from "./components/detail/PolicyInfoGrid.vue"
import PolicyServiceInsights from "./components/detail/PolicyServiceInsights.vue"
import PolicyAssignmentTable from "./components/detail/PolicyAssignmentTable.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"

const router = useRouter()
const { policy, services, loading, copyText } = usePolicyDetail()

// 治理项 Tabs 控制
const activeTab = ref("insights")

// --- 授权管理向导逻辑 ---
const attachSubjectVisible = ref(false)
const assignmentTableRef = ref<InstanceType<typeof PolicyAssignmentTable>>()

const handleAddSubject = () => {
  attachSubjectVisible.value = true
}

const handleAttachSuccess = () => {
  assignmentTableRef.value?.fetchAssignments()
}
</script>

<template>
  <PageContainer v-loading="loading" class="policy-detail-page">
    <template v-if="policy">
      <!-- 1. 头部概览 -->
      <ManagerHeader :title="policy.name" :subtitle="policy.code" :show-back-button="true" @back="router.back()">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn danger" plain>
              <el-icon><Delete /></el-icon>
              <span>删除策略</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <!-- 2. 治理主体 -->
      <div class="governance-body">
        <!-- 核心状态区块 -->
        <PolicyStatusBar :policy="policy" :services="services" />

        <!-- 资产元数据区块 -->
        <PolicyInfoGrid :policy="policy" @copy="copyText" />

        <!-- 治理洞察区块 (Tabs) -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <!-- 看板：策略内容 -->
            <el-tab-pane label="策略内容" name="insights">
              <PolicyServiceInsights :policy="policy" :services="services" @copy="copyText" />
            </el-tab-pane>

            <!-- 看板：授权管理 -->
            <el-tab-pane label="授权管理" name="assignments">
              <PolicyAssignmentTable ref="assignmentTableRef" :policy-code="policy.code" @add="handleAddSubject" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 授权向导 (固定策略模式) -->
      <AuthorizeDrawer v-model="attachSubjectVisible" :fixed-policies="[policy]" @success="handleAttachSuccess" />
    </template>

    <el-empty v-else-if="!loading" description="未能获取到策略治理指标" />
  </PageContainer>
</template>

<style lang="scss" scoped>
/* --- 企业级极简设计变量 (Enterprise Minimal Tokens) --- */
.policy-detail-page {
  --gov-brand: #3b82f6;
  --gov-bg: #f8fafc;
  --gov-border: #e2e8f0;

  overflow-y: scroll;
  overflow-x: hidden;
  background: var(--gov-bg);
}

/* --- 基础布局 (Core Layout) --- */
.governance-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px;
}

/* 分离式 Tabs 卡片 */
.governance-tabs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 24px 24px;
  display: flex;
  flex-direction: column;
  flex: none;
}

.header-action-stack {
  display: flex;
  gap: 8px;
  .gov-action-btn.danger {
    color: #dc2626;
    border-color: #fecaca;
    background: #fef2f2;
    &:hover {
      background: #fee2e2;
    }
  }
}

.governance-raw-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  &.is-active {
    color: #0f172a;
    font-weight: 600;
  }
}
</style>
