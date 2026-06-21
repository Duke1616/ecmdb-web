<template>
  <div>
    <div class="form-row">
      <el-form-item prop="handler" label="执行节点" class="form-item">
        <ExecutorPicker
          v-model:service="target"
          v-model:handler="handler"
          service-placeholder="请选择执行节点"
          handler-placeholder=""
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExecutorPicker from "@/common/components/ExecutorPicker/index.vue"

// NOTE: 该组件为执行器配置控制器，target 和 handler 均需由父组件统一管理
const target = defineModel<string>("target")
const handler = defineModel<string>("handler")
</script>
