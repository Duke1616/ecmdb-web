<template>
  <PageContainer>
    <ManagerHeader title="工单管理" subtitle="管理工单的创建、审批和跟踪" :show-add-button="false" />

    <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange" class="order-tabs">
      <template #default="{ activeTab }">
        <My v-if="activeTab === 'my'" ref="myRef" />
        <TodoUser v-if="activeTab === 'todo'" ref="todoUserRef" />
        <Todo v-if="activeTab === 'todo-all'" ref="todoRef" />
        <History v-if="activeTab === 'history'" ref="historyRef" />
      </template>
    </CustomTabs>
  </PageContainer>
</template>
<script lang="ts" setup>
import { ref } from "vue"
import Todo from "./tabs/todo.vue"
import TodoUser from "./tabs/todo-user.vue"
import My from "./tabs/my.vue"
import History from "./tabs/history.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
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

// 处理标签页切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "my") {
    myRef.value?.startByOrdersData()
  } else if (tabName === "todo-all") {
    todoRef.value?.listOrdersData()
  } else if (tabName === "todo") {
    todoUserRef.value?.listOrdersData()
  } else if (tabName === "history") {
    historyRef.value?.listOrdersData()
  }
}
</script>

<style lang="scss" scoped>
.order-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
