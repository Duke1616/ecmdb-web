<template>
  <ProGovernanceLayout
    v-model:keyword="keyword"
    title="执行资源"
    subtitle="查看当前空间已授权的执行资源与可用处理能力"
    :show-refresh="true"
    @refresh="handleRefresh"
  >
    <template #search>
      <ExecutorSearchCommand v-model:keyword="keyword" :placeholder="searchPlaceholder" @search="handleRefresh" />
    </template>

    <template #actions-suffix>
      <el-button v-if="isSystemSpace" type="primary" class="pool-manager-btn" @click="poolManagerVisible = true">
        <el-icon><Setting /></el-icon>
        管理资源池
      </el-button>
    </template>

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="executor-tabs">
      <template #default="{ activeTab }">
        <ResourceTab v-if="activeTab === 'worker'" ref="workerRef" :kind="ResourceKind.Agent" :keyword="keyword" />
        <ResourceTab
          v-if="activeTab === 'executor'"
          ref="executorRef"
          :kind="ResourceKind.Executor"
          :keyword="keyword"
        />
      </template>
    </CustomTabs>

    <ExecutionPoolManagerDialog v-if="poolManagerVisible" v-model="poolManagerVisible" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Setting } from "@element-plus/icons-vue"
import ResourceTab from "./tabs/resource.vue"
import ExecutorSearchCommand from "./components/ExecutorSearchCommand.vue"
import ExecutionPoolManagerDialog from "./components/ExecutionPoolManagerDialog.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { useUserStore } from "@/pinia/stores/user"
import { isSystemTenant } from "@/pages/alert/template/utils"
import { ResourceKind } from "@/api/task/resource/type"

const activeName = ref("executor")
const keyword = ref("")
const poolManagerVisible = ref(false)
const userStore = useUserStore()

// 标签页配置
const tabs = [
  { name: "executor", label: "分布式调度模式 🌟" },
  { name: "worker", label: "消息推送" }
]

const workerRef = ref<InstanceType<typeof ResourceTab>>()
const executorRef = ref<InstanceType<typeof ResourceTab>>()

const searchPlaceholder = computed(() => {
  return activeName.value === "worker" ? "搜索资源名称、Topic 或描述..." : "搜索执行资源名称..."
})

const currentTenant = computed(() =>
  userStore.tenants.find((tenant) => Number(tenant.id) === Number(userStore.currentTenantId))
)

const isSystemSpace = computed(() => isSystemTenant(userStore.currentTenantId, currentTenant.value))

// 处理标签页切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "worker") {
    workerRef.value?.listResourcesData()
  } else if (tabName === "executor") {
    executorRef.value?.listResourcesData()
  }
}

// 刷新数据
const handleRefresh = () => {
  if (activeName.value === "worker") {
    workerRef.value?.listResourcesData()
  } else if (activeName.value === "executor") {
    executorRef.value?.listResourcesData()
  }
}
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(260px, 22vw, 330px);
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: clamp(12px, 1.2vw, 20px);
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.executor-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.custom-tabs) {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: none;
  }

  :deep(.tabs-header) {
    background: #f8fafc;
  }

  :deep(.tab-item) {
    min-height: 40px;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.tab-item:hover) {
    color: #334155;
    background: #f1f5f9;
  }

  :deep(.tab-item.active) {
    color: #1f2937;
    background: #ffffff;
  }

  :deep(.tab-item.active::after) {
    width: 24px;
    background: #64748b;
  }

  :deep(.tabs-content) {
    margin: 10px;
  }
}

.pool-manager-btn {
  height: 38px;
  border-radius: 8px;
  font-weight: 700;
}

@media (max-width: 1100px) {
  :deep(.manager-header) {
    align-items: stretch;
    flex-direction: column;
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.eiam-governance-bar) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  :deep(.header-right) {
    min-width: 0;
  }
}

@media (max-width: 480px) {
  :deep(.action-group) {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
