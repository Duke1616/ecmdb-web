<template>
  <el-button plain @click="dialogVisible = true"> Click to open the Dialog </el-button>

  <el-drawer class="add-drawer" v-model="dialogVisible" title="添加任务脚本" direction="ttb" size="100%">
    <CodeMirror />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false"> 保存 </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import CodeMirror from "@/components/CodeMirror/index.vue"
import { ref } from "vue"

const dialogVisible = ref(false)
</script>

<style lang="scss">
.add-form {
  height: 90%;
}

.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>
