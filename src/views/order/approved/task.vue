<template>
  <div class="task-container">
    <el-empty v-if="tasksData.length === 0" :image-size="200" />
    <DataTable
      v-if="tasksData.length !== 0"
      :data="tasksData"
      :columns="tableColumns"
      :show-pagination="false"
      :table-props="{
        stripe: false,
        border: true,
        'header-cell-style': { background: '#F6F6F6', height: '10px', 'text-align': 'center' }
      }"
    >
      <template #status="{ row }">
        <el-tag v-if="row.status === 3" type="primary" effect="plain"> 运行中 </el-tag>
        <el-tag v-else-if="row.status === 4 || row.status === 8" type="warning" effect="plain"> 等待中 </el-tag>
        <el-tag v-else-if="row.status === 5" type="warning" effect="plain"> 暂停中 </el-tag>
        <el-tag v-else-if="row.status === 6" type="warning" effect="plain"> 调度中 </el-tag>
        <el-tag v-else-if="row.status === 7" type="warning" effect="plain"> 重试 </el-tag>
        <el-tag v-else-if="row.status === 1" type="success" effect="plain"> 成功 </el-tag>
        <el-tag v-else-if="row.status === 2" type="danger" effect="plain"> 失败 </el-tag>
        <el-tag v-else type="info" effect="plain"> 未知 </el-tag>
      </template>

      <template #timing="{ row }">
        <el-tag v-if="row.is_timing === true" type="primary"> 是 </el-tag>
        <el-tag v-else type="warning"> 否 </el-tag>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { task } from "@/api/task/types/task"
import { listTasksByInstanceIdApi } from "@/api/task"
import DataTable from "@@/components/DataTable/index.vue"

interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

const tasksData = ref<task[]>([])
const loading = ref<boolean>(false)

// 表格列配置
const tableColumns = [
  { prop: "codebook_name", label: "任务模版", align: "center" as const },
  { prop: "worker_name", label: "工作节点", align: "center" as const },
  { prop: "status", label: "状态", slot: "status", align: "center" as const },
  { prop: "is_timing", label: "定时任务", slot: "timing", align: "center" as const },
  { prop: "run_time", label: "执行时间", align: "center" as const },
  { prop: "start_time", label: "开始时间", align: "center" as const },
  { prop: "end_time", label: "结束时间", align: "center" as const }
]

/** 查询任务列表 */
const listTasksData = async () => {
  if (!props.processInstId) return

  loading.value = true
  try {
    const { data } = await listTasksByInstanceIdApi({
      offset: 0,
      limit: 1000,
      instance_id: props.processInstId
    })

    tasksData.value = data.tasks || []
  } catch (error) {
    tasksData.value = []
  } finally {
    loading.value = false
  }
}

/** 监听分页参数的变化 */
watch(() => props.processInstId, listTasksData, { immediate: true })

defineExpose({
  listTasksData
})
</script>
