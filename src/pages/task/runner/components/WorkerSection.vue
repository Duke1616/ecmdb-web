<template>
  <div>
    <!-- 工作节点选择 -->
    <div class="form-row">
      <el-form-item prop="target" label="工作节点 (Kafak)" class="form-item">
        <el-select
          v-model="target"
          placeholder="请选择工作节点"
          size="large"
          clearable
          filterable
          @change="handleWorkerChange"
        >
          <el-option v-for="item in workers" :key="item.name" :label="getWorkerLabel(item)" :value="item.topic" />
        </el-select>
      </el-form-item>
    </div>

    <!-- Handler 选择，依赖工作节点 -->
    <div class="form-row">
      <el-form-item prop="handler" label="执行处理器 (Handler)" class="form-item">
        <el-select
          v-model="handler"
          placeholder="请先选择工作节点"
          size="large"
          clearable
          filterable
          :disabled="!target"
        >
          <el-option
            v-for="h in availableHandlers"
            :key="h.name"
            :label="h.desc ? `${h.name} - ${h.desc}` : h.name"
            :value="h.name"
          />
        </el-select>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useWorkers } from "../composables/useWorkers"

// NOTE: 该组件为工作节点选择器，状态需由父组件统一管理
const target = defineModel<string>("target")
const handler = defineModel<string>("handler")

const { workers, fetchWorkers, getWorkerLabel, availableHandlers } = useWorkers(() => target.value)

/**
 * 切换节点时清空 handler，避免旧值残留
 */
const handleWorkerChange = () => {
  handler.value = ""
}

onMounted(() => {
  fetchWorkers()
})
</script>

<style scoped lang="scss">
.form-row {
  margin-bottom: 20px;
}
</style>
