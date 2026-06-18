<template>
  <ProGovernanceLayout title="工单管理" subtitle="集中处理工单创建、审批和流转" @refresh="refreshActiveTab">
    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="ticket-tabs">
      <template #default="{ activeTab }">
        <My v-if="activeTab === 'my'" ref="myRef" />
        <TodoUser v-if="activeTab === 'todo'" ref="todoUserRef" />
        <Todo v-if="activeTab === 'todo-all'" ref="todoRef" />
        <History v-if="activeTab === 'history'" ref="historyRef" />
      </template>
    </CustomTabs>
  </ProGovernanceLayout>
</template>
<script lang="ts" setup>
import { ref } from "vue"
import Todo from "./tabs/todo.vue"
import TodoUser from "./tabs/todo-user.vue"
import My from "./tabs/my.vue"
import History from "./tabs/history.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
const activeName = ref("my")

// 标签页配置
const tabs = [
  { name: "my", label: "我的工单" },
  { name: "todo", label: "我的待办" },
  { name: "todo-all", label: "全部待办" },
  { name: "history", label: "历史工单" }
]

const myRef = ref<InstanceType<typeof My>>()
const todoRef = ref<InstanceType<typeof Todo>>()
const todoUserRef = ref<InstanceType<typeof TodoUser>>()
const historyRef = ref<InstanceType<typeof History>>()

const refreshActiveTab = () => {
  const refreshMap: Record<string, () => void> = {
    my: () => myRef.value?.listStartedTickets(),
    "todo-all": () => todoRef.value?.listTicketsData(),
    todo: () => todoUserRef.value?.listTicketsData(),
    history: () => historyRef.value?.listTicketsData()
  }

  refreshMap[activeName.value]?.()
}

const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  refreshActiveTab()
}
</script>

<style lang="scss" scoped>
.ticket-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>
