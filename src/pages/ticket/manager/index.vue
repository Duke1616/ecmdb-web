<template>
  <ProGovernanceLayout title="工单管理" subtitle="集中处理工单创建、审批和流转" @refresh="refreshActiveTab">
    <CustomTabs
      v-if="tabs.length"
      :tabs="tabs"
      :default-active="activeName"
      class="ticket-tabs"
      @tab-change="handleTabChange"
    >
      <template #default="{ activeTab }">
        <My v-if="activeTab === 'my'" ref="myRef" />
        <TodoUser v-if="activeTab === 'todo'" ref="todoUserRef" />
        <Todo v-if="activeTab === 'todo-all'" ref="todoRef" />
        <History v-if="activeTab === 'history'" ref="historyRef" />
      </template>
    </CustomTabs>
    <el-result v-else icon="warning" title="暂无工单列表权限" />
  </ProGovernanceLayout>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import Todo from "./tabs/todo.vue"
import TodoUser from "./tabs/todo-user.vue"
import My from "./tabs/my.vue"
import History from "./tabs/history.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"

const { hasPermission } = usePermission()
const activeName = ref("")

const allTabs = [
  { name: "my", label: "我的工单", capability: TICKET_CAPABILITIES.Manager.MyStart },
  { name: "todo", label: "我的待办", capability: TICKET_CAPABILITIES.Manager.MyTodo },
  { name: "todo-all", label: "全部待办", capability: TICKET_CAPABILITIES.Manager.Todo },
  { name: "history", label: "历史工单", capability: TICKET_CAPABILITIES.Manager.History }
]
const tabs = computed(() => allTabs.filter((tab) => hasPermission(tab.capability)))

watch(
  tabs,
  (availableTabs) => {
    if (!availableTabs.some((tab) => tab.name === activeName.value)) {
      activeName.value = availableTabs[0]?.name || ""
    }
  },
  { immediate: true }
)

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
