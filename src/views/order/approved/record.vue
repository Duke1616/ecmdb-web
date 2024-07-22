<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table :data="taskRecordsData">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="nodename" label="节点名称" align="center" />
        <el-table-column prop="approved_by" label="操作人" align="center" />
        <!-- <el-table-column prop="is_finished" label="任务状态" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.is_finished === 1" type="success" effect="plain">完成</el-tag>
            <el-tag v-else-if="scope.row.is_finished === 0" type="danger" effect="plain">待处理</el-tag>
          </template>
        </el-table-column> -->
        <el-table-column prop="is_finished" label="任务动作" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0 && scope.row.is_finished == 1" type="success" effect="plain">
              自动通过
            </el-tag>
            <el-tag v-if="scope.row.status === 1 && scope.row.is_finished == 1" type="warning" effect="plain">
              确认通过
            </el-tag>
            <el-tag v-if="scope.row.status === 2 && scope.row.is_finished == 1" type="danger" effect="plain">
              手动驳回
            </el-tag>
            <el-tag v-if="scope.row.status === 0 && scope.row.is_finished == 0" type="danger" effect="plain">
              等待处理
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="评论" align="center" />
        <el-table-column prop="finished_time" label="处理时间" align="center" />
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
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { orderTaskRecordsApi } from "@/api/order"
import { taskRecord } from "@/api/order/types/order"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

/** 查询模版列表 */
const taskRecordsData = ref<taskRecord[]>([])
const listOrderTaskRecordsData = () => {
  orderTaskRecordsApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    process_inst_id: props.processInstId ? props.processInstId : 0
  })
    .then(({ data }) => {
      paginationData.total = data.total
      taskRecordsData.value = data.task_records
    })
    .catch(() => {
      taskRecordsData.value = []
    })
    .finally(() => {})
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listOrderTaskRecordsData, { immediate: true })
</script>

<style lang="scss" scoped>
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
