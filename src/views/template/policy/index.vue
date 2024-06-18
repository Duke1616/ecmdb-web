<template>
  <div>
    <el-button plain @click="dialogDrawer = true"> Click to open the Dialog </el-button>
    <el-drawer class="add-drawer" v-model="dialogDrawer" title="添加任务脚本" direction="ttb" size="100%">
      <el-form>
        <el-form-item label="名称">
          <el-input v-model="input" placeholder="Please input" />
        </el-form-item>
        <CodeMirror ref="codeMirrorRef" />
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogDrawer = false">取消</el-button>
          <el-button type="primary" @click="handlerDrawer"> 保存 </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import CodeMirror from "@/components/CodeMirror/index.vue"

const codeMirrorRef = ref<InstanceType<typeof CodeMirror>>()

const input = ref("")
const dialogDrawer = ref<boolean>(false)

const handlerDrawer = () => {
  const code = codeMirrorRef.value?.getCode()
  console.log("输出Code", code)
}
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
