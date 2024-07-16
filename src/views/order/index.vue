<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane lazy label="我的工单" name="my">
        <My />
      </el-tab-pane>
      <el-tab-pane lazy label="我的待办" name="todo">Config</el-tab-pane>
      <el-tab-pane lazy label="全部待办" name="todo-all">
        <Todo />
      </el-tab-pane>
      <el-tab-pane lazy label="历史工单" name="history">Task</el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue"
import type { TabsPaneContext } from "element-plus"
import Todo from "./tabs/todo.vue"
import My from "./tabs/my.vue"

const activeName = ref("todo-all")

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>
<style></style>
