<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, OfficeBuilding } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"

// Composables
import { usePolicyDetail } from "./composables/usePolicyDetail"
import { useTabRouter } from "@/common/composables/useTabRouter"

// Components
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import StatusStrip, { type StatusItem } from "@/common/components/Governance/StatusStrip.vue"
import PolicyServiceInsights from "./components/detail/PolicyServiceInsights.vue"
import PolicyAssignmentTable from "./components/detail/PolicyAssignmentTable.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import { formatTimestamp } from "@@/utils/day"

const router = useRouter()
const { policy, services, loading, copyText, handleDelete } = usePolicyDetail()

// 治理项 Tabs 控制
const { activeTab } = useTabRouter("insights")

// --- 授权管理向导逻辑 ---
const attachSubjectVisible = ref(false)
const assignmentTableRef = ref<InstanceType<typeof PolicyAssignmentTable>>()

const handleAddSubject = () => {
  attachSubjectVisible.value = true
}

const handleAttachSuccess = () => {
  assignmentTableRef.value?.fetchAssignments()
}

/**
 * 核心逻辑：监听 Tab 切换触发数据刷新
 */
watch(activeTab, (val) => {
  if (val === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
})

// 初始进入时数据刷新
onMounted(() => {
  if (activeTab.value === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
})

/** 治理指标适配 */
const statusItems = computed<StatusItem[]>(() => {
  if (!policy.value) return []
  return [
    {
      label: "策略类型",
      value: policy.value.type === 1 ? "系统内置" : "动态生效",
      dot: true,
      type: policy.value.type === 1 ? "info" : "success"
    },
    { label: "影响服务", value: `${services.value.length} 个`, dot: true, type: "success" },
    { label: "权限负载", value: `${totalGranted.value} 项`, dot: true, type: "success" },
    {
      label: "治理覆盖率",
      value: `${avgCoverage.value}%`,
      dot: true,
      type: avgCoverage.value > 80 ? "success" : "warning"
    }
  ]
})

const infoItems = computed(() => {
  if (!policy.value) return []
  return [
    { label: "策略显示名称", value: policy.value.name },
    { label: "唯一识别码 (CODE)", value: policy.value.code, mono: true, copyable: true },
    { label: "创建于", value: formatTimestamp(policy.value.ctime) },
    {
      label: "职能边界描述",
      value: policy.value.desc || "暂无对此策略职能边界的详细描述",
      full: true,
      desc: true
    }
  ]
})

/** 基础治理指标计算 */
const totalGranted = computed(() => {
  return services.value.reduce((acc, svc) => acc + svc.granted_count, 0)
})

const avgCoverage = computed(() => {
  const total = services.value.reduce((acc, svc) => acc + svc.total_count, 0)
  if (total === 0) return 0
  return Math.round((totalGranted.value / total) * 100)
})

const handleEdit = () => {
  if (!policy.value) return
  router.push({
    name: "PolicyEdit",
    query: { code: policy.value.code }
  })
}
</script>

<template>
  <PageContainer v-loading="loading" class="policy-detail-page">
    <template v-if="policy">
      <!-- 1. 头部概览 -->
      <ManagerHeader :title="policy.name" :subtitle="policy.code" :show-back-button="true" @back="router.back()">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              <span>完善策略</span>
            </el-button>
            <el-button class="gov-action-btn danger" plain @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>移除策略</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 1. 置顶横向状态条 -->
        <StatusStrip :items="statusItems" />

        <!-- 2. 基础识别与职能定义 -->
        <InfoCard title="策略身份与职能定义" :icon="OfficeBuilding" :items="infoItems" @copy="copyText" />

        <!-- 治理深度内容区 -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <!-- 看板：策略内容 -->
            <el-tab-pane label="策略内容洞察" name="insights" lazy>
              <PolicyServiceInsights :policy="policy" :services="services" @copy="copyText" />
            </el-tab-pane>

            <!-- 看板：授权管理 -->
            <el-tab-pane label="授权主体管理" name="assignments" lazy>
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
.policy-detail-page {
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
      color: #3b82f6;
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

.success-text {
  color: #10b981;
}
.warning-text {
  color: #f59e0b;
}
</style>
