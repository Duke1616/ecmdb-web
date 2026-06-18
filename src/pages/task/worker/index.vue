<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="执行节点管理"
      subtitle="分布式调度模式由调度中心统一分配，消息推送模式通过消息中心异步触发，两者相互独立但职责一致"
      :show-add-button="false"
      @refresh="handleRefresh"
    />

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="worker-tabs">
      <template #default="{ activeTab }">
        <Worker v-if="activeTab === 'worker'" ref="workerRef" />
        <Executor v-if="activeTab === 'executor'" ref="executorRef" />
      </template>
    </CustomTabs>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Worker from "./tabs/worker.vue"
import Executor from "./tabs/executor.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"

const activeName = ref("executor")

// 标签页配置
const tabs = [
  { name: "executor", label: "分布式调度模式 🌟" },
  { name: "worker", label: "消息推送模式" }
]

const workerRef = ref<InstanceType<typeof Worker>>()
const executorRef = ref<InstanceType<typeof Executor>>()

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
.worker-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
