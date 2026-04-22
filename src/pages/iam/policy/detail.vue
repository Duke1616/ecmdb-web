<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { Delete, Edit, OfficeBuilding } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"

// Composables
import { usePolicyDetail } from "./composables/usePolicyDetail"

// Components
import PolicyServiceInsights from "./components/detail/PolicyServiceInsights.vue"
import PolicyAssignmentTable from "./components/detail/PolicyAssignmentTable.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"

const router = useRouter()
const route = useRoute()
const { policy, services, loading, copyText } = usePolicyDetail()

// 治理项 Tabs 控制：初始化优先从 URL 获取，实现状态持久化
const activeTab = ref((route.query.tab as string) || "insights")

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
 * 核心逻辑：监听 Tab 切换，同步状态至 URL 并触发数据刷新
 */
watch(activeTab, (val) => {
  // 1. 同步到 URL (使用 replace 模式，不增加历史记录负担)
  router.replace({
    query: { ...route.query, tab: val }
  })

  // 2. 触发业务刷新
  if (val === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
})

// 初始进入时，如果是 assignments 且通过 URL 直接进入，确保刷新
onMounted(() => {
  if (activeTab.value === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
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

const formatDate = (ts: number | undefined) => {
  if (!ts) return "-"
  const d = new Date(ts)
  return d.toLocaleString()
}

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
            <el-button class="gov-action-btn danger" plain>
              <el-icon><Delete /></el-icon>
              <span>移除策略</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 1. 置顶横向状态条 (极简风格) -->
        <div class="governance-status-strip">
          <div class="status-item">
            <span class="dot" :class="policy.type === 1 ? 'info' : 'success'" />
            <span class="label">策略类型:</span>
            <span class="value" :class="policy.type === 1 ? 'info' : 'success'">
              {{ policy.type === 1 ? "系统内置" : "动态生效" }}
            </span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot success" />
            <span class="label">影响服务:</span>
            <span class="value tint">{{ services.length }} 个</span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot success" />
            <span class="label">权限负载:</span>
            <span class="value tint">{{ totalGranted }} 项</span>
          </div>
          <div class="divider" />
          <div class="status-item">
            <span class="dot" :class="avgCoverage > 80 ? 'success' : 'warning'" />
            <span class="label">治理覆盖率:</span>
            <span class="value" :class="avgCoverage > 80 ? 'success' : 'warning'"> {{ avgCoverage }}% </span>
          </div>
        </div>

        <!-- 2. 基础识别与职能定义 (单卡片高密度布局) -->
        <div class="info-card consolidated-card">
          <div class="info-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>基础识别与职能定义</span>
          </div>
          <div class="info-content grid-4-cols">
            <div class="info-item">
              <div class="label">策略显示名称</div>
              <div class="value">{{ policy.name }}</div>
            </div>
            <div class="info-item">
              <div class="label">唯一识别码 (CODE)</div>
              <div class="value mono copyable" @click="copyText(policy.code)">
                {{ policy.code }}
              </div>
            </div>
            <div class="info-item">
              <div class="label">创建于</div>
              <div class="value time">{{ formatDate(policy.ctime) }}</div>
            </div>
            <div class="info-item full">
              <div class="label">职能边界描述</div>
              <div class="value desc">{{ policy.desc || "暂无对此策略职能边界的详细描述" }}</div>
            </div>
          </div>
        </div>

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
  --gov-brand: #7c3aed;
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
        background: #7c3aed;
      }
      &.warning {
        background: #f59e0b;
      }
    }

    .label {
      color: #64748b;
      font-weight: 500;
      margin-right: 2px;
    }

    .value {
      font-weight: 700;
      &.success {
        color: #10b981;
      }
      &.info {
        color: #7c3aed;
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

.info-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }
      .value {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
        line-height: 1.4;

        &.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
        }
        &.time {
          color: #64748b;
          font-size: 13px;
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
      color: #7c3aed;
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
