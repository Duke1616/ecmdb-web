<template>
  <div class="app-container">
    <el-empty v-if="tasksData.length === 0" :image-size="200" />
    <el-card v-if="tasksData.length !== 0" shadow="never">
      <div class="table-wrapper">
        <el-table :data="tasksData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="codebook_name" label="任务模版" align="center" />
          <el-table-column prop="worker_name" label="工作节点" align="center" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 3" type="primary" effect="plain"> 运行中 </el-tag>
              <el-tag v-if="scope.row.status === 4 || scope.row.status === 8" type="warning" effect="plain">
                等待中
              </el-tag>
              <el-tag v-if="scope.row.status === 5" type="warning" effect="plain"> 暂停中 </el-tag>
              <el-tag v-if="scope.row.status === 6" type="warning" effect="plain"> 调度中 </el-tag>
              <el-tag v-if="scope.row.status === 7" type="warning" effect="plain"> 重试 </el-tag>
              <el-tag v-if="scope.row.status === 1" type="success" effect="plain"> 成功 </el-tag>
              <el-tag v-if="scope.row.status === 2" type="danger" effect="plain"> 失败 </el-tag>
              <el-tag v-if="scope.row.status === 0" type="info" effect="plain"> 未知 </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_timing" label="定时任务" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.is_timing === true" type="primary"> 是 </el-tag>
              <el-tag v-if="scope.row.is_timing === false" type="warning"> 否 </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="run_time" label="执行时间" align="center">
            <template #default="scope">
              <span>{{ scope.row.start_time }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { task } from "@/api/task/types/task"
import { listTasksByInstanceIdApi } from "@/api/task"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

/** 查询模版列表 */
const tasksData = ref<task[]>([])
const listTasksData = () => {
  listTasksByInstanceIdApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    instance_id: props.processInstId ? props.processInstId : 0
  })
    .then(({ data }) => {
      paginationData.total = data.total
      tasksData.value = data.tasks
    })
    .catch(() => {
      tasksData.value = []
    })
    .finally(() => {})
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTasksData, { immediate: true })
</script>

<style lang="scss">
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
