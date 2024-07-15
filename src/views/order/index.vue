<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="我的工单" name="my">User</el-tab-pane>
      <el-tab-pane label="我的待办" name="todo">Config</el-tab-pane>
      <el-tab-pane label="全部待办" name="todo-all">Role</el-tab-pane>
      <el-tab-pane label="历史工单" name="history">Task</el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue"
import type { TabsPaneContext } from "element-plus"

const activeName = ref("first")

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>
<style>
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>
