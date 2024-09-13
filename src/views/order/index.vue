<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane lazy label="我的工单" name="my">
        <My ref="myRef" />
      </el-tab-pane>
      <el-tab-pane lazy label="我的待办" name="todo">
        <TodoUser ref="todoUserRef" />
      </el-tab-pane>
      <el-tab-pane lazy label="全部待办" name="todo-all">
        <Todo ref="todoRef" />
      </el-tab-pane>
      <el-tab-pane lazy label="历史工单" name="history">Task</el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue"
import type { TabsPaneContext } from "element-plus"
import Todo from "./tabs/todo.vue"
import TodoUser from "./tabs/todo-user.vue"
import My from "./tabs/my.vue"
const activeName = ref("my")

const myRef = ref<InstanceType<typeof My>>()
const todoRef = ref<InstanceType<typeof Todo>>()
const todoUserRef = ref<InstanceType<typeof TodoUser>>()
const handleClick = (tab: TabsPaneContext) => {
  if (tab.paneName === "my") {
    myRef.value?.startByOrdersData()
  } else if (tab.paneName === "todo-all") {
    todoRef.value?.listOrdersData()
  } else if (tab.paneName == "todo") {
    todoUserRef.value?.listOrdersData()
  }
}
</script>
<style></style>
