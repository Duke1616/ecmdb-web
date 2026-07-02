<template>
  <div>
    <div class="form-row">
      <el-form-item prop="handler" label="执行节点" class="form-item">
        <ExecutorPicker
          v-model:service="target"
          v-model:handler="handler"
          kind="agent"
          service-placeholder="请选择消息推送执行节点"
          handler-placeholder=""
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExecutorPicker from "@/common/components/ExecutorPicker/index.vue"

// NOTE: 该组件为工作节点选择器，状态需由父组件统一管理
const target = defineModel<string>("target")
const handler = defineModel<string>("handler")
</script>

<style scoped lang="scss">
.form-row {
  margin-bottom: 20px;
}
</style>
