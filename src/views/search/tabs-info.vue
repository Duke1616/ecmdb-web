<template>
  <div class="app-container">
    <div class="centered-container">
      <el-input clearable v-model="input" placeholder="请输入搜索内容">
        <template #append>
          <el-button type="primary" @click="search">搜索</el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="search" :icon="Back">返回主页</el-button>
    </div>
    <el-divider />
    <div>
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane label="User" name="first">User</el-tab-pane>
        <el-tab-pane label="Config" name="second">Config</el-tab-pane>
        <el-tab-pane label="Role" name="third">Role</el-tab-pane>
        <el-tab-pane label="Task" name="fourth">Task</el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { Back } from "@element-plus/icons-vue"
import { TabsPaneContext } from "element-plus"
const input = ref("")
const search = () => {
  console.log(input.value)
}

const activeName = ref("first")

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<style scoped>
.centered-container {
  display: flex;
  justify-content: space-between;
}

.el-input {
  width: 40%; /* 根据需要调整宽度 */
  height: 40px;
}
.el-button {
  height: 40px;
}
</style>
