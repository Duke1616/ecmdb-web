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
        <component :is="tabComponents[activeTab]" ref="activeTabRef" />
      </template>
    </CustomTabs>
    <el-result v-else icon="warning" title="暂无工单列表权限" />
  </ProGovernanceLayout>
</template>
<script lang="ts" setup>
import { computed, ref, watch, type Component } from "vue"
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

const tabComponents: Record<string, Component> = {
  my: My,
  todo: TodoUser,
  "todo-all": Todo,
  history: History
}
const activeTabRef = ref<{ refresh: () => void }>()

const refreshActiveTab = () => {
  activeTabRef.value?.refresh()
}

const handleTabChange = (tabName: string) => {
  activeName.value = tabName
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
