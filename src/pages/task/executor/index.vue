<template>
  <ProGovernanceLayout
    v-model:keyword="keyword"
    title="执行器管理"
    subtitle="管理分布式调度执行器与消息推送节点，统一查看可用处理能力和在线节点状态"
    :show-refresh="true"
    @refresh="handleRefresh"
  >
    <template #search>
      <ExecutorSearchCommand v-model:keyword="keyword" :placeholder="searchPlaceholder" @search="handleRefresh" />
    </template>

    <template #actions-prefix>
      <div class="executor-summary">
        <span>{{ activeName === "executor" ? "已加载执行器" : "匹配推送节点" }}</span>
        <strong>{{ activeLoadedCount }}</strong>
      </div>
    </template>

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="executor-tabs">
      <template #default="{ activeTab }">
        <Worker
          v-if="activeTab === 'worker'"
          ref="workerRef"
          :keyword="keyword"
          @count-change="workerLoadedCount = $event"
        />
        <Executor
          v-if="activeTab === 'executor'"
          ref="executorRef"
          :keyword="keyword"
          @count-change="executorLoadedCount = $event"
        />
      </template>
    </CustomTabs>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Worker from "./tabs/worker.vue"
import Executor from "./tabs/executor.vue"
import ExecutorSearchCommand from "./components/ExecutorSearchCommand.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"

const activeName = ref("executor")
const keyword = ref("")
const workerLoadedCount = ref(0)
const executorLoadedCount = ref(0)

// 标签页配置
const tabs = [
  { name: "executor", label: "分布式调度" },
  { name: "worker", label: "消息推送" }
]

const workerRef = ref<InstanceType<typeof Worker>>()
const executorRef = ref<InstanceType<typeof Executor>>()

const activeLoadedCount = computed(() => {
  return activeName.value === "worker" ? workerLoadedCount.value : executorLoadedCount.value
})

const searchPlaceholder = computed(() => {
  return activeName.value === "worker" ? "搜索节点名称、Topic 或描述..." : "搜索执行器名称..."
})

// 处理标签页切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "worker") {
    workerRef.value?.listWorkersData()
  } else if (tabName === "executor") {
    executorRef.value?.listExecutorsData()
  }
}

// 刷新数据
const handleRefresh = () => {
  if (activeName.value === "worker") {
    workerRef.value?.listWorkersData()
  } else if (activeName.value === "executor") {
    executorRef.value?.listExecutorsData()
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

.executor-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;

  span {
    color: #64748b;
    font-weight: 600;
  }

  strong {
    color: #0f172a;
    font-size: 15px;
  }
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

  .executor-summary {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
