<template>
  <el-dialog v-model="visible" title="任务执行日志" width="80vw" top="5vh" append-to-body @opened="fetchLogs">
    <div class="log-container" v-loading="loading">
      <CodeEditor v-if="logs" :code="logs" language="text" />
      <el-empty v-else description="暂无日志数据" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" :loading="loading" @click="fetchLogs">刷新日志</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { getTaskLogsApi } from "@/api/etask/manager"
import CodeEditor from "@/common/components/CodeEditor/index.vue"

const props = defineProps<{
  modelValue: boolean
  taskId: number
}>()

const emit = defineEmits(["update:modelValue"])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
})

const loading = ref(false)
const logs = ref("")

const fetchLogs = async () => {
  const taskId = props.taskId
  if (!taskId) return

  loading.value = true
  try {
    const res = await getTaskLogsApi({ task_id: taskId, offset: 0, limit: 1000 })
    logs.value = res.data
  } catch (error) {
    // 错误由请求层统一处理
  } finally {
    loading.value = false
  }
}

defineExpose({ fetchLogs })
</script>

<style scoped>
.log-container {
  min-height: 400px;
}
</style>
