<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table
        :data="ordersData"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="task_id" label="任务ID" align="center" />
        <el-table-column prop="template_name" label="工单名称" align="center" />
        <el-table-column prop="starter" label="提单人" align="center" />
        <el-table-column prop="current_step" label="当前步骤" align="center" />
        <el-table-column prop="proc_inst_create_time" label="流程提交时间" align="center" />
        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button type="success" text bg size="small" @click="handleDelete(scope.row)">处理</el-button>
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

  <Detail
    :action="action"
    :dialogVisible="dialogVisible"
    :processInstId="processInstId"
    :templateId="templateId"
    :taskId="taskId"
    :workflowId="workflowId"
    @refresh-data="listOrdersData"
    @close="onClosed"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
// import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { order } from "@/api/order/types/order"
import { todoOrderByUserApi } from "@/api/order"
import Detail from "../approved/detail.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const templateId = ref<number>()
const processInstId = ref<number>()
const taskId = ref<number>()
const workflowId = ref<number>()
const action = ref<string>("todo")
/** 查询模版列表 */
const ordersData = ref<order[]>([])
const listOrdersData = () => {
  todoOrderByUserApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    sort_by_asc: true,
    process_name: "",
    user_id: ""
  })
    .then(({ data }) => {
      paginationData.total = data.total
      ordersData.value = data.orders

      console.log(ordersData.value)
    })
    .catch(() => {
      ordersData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: order) => {
  templateId.value = row.template_id
  processInstId.value = row.process_instance_id
  taskId.value = row.task_id
  workflowId.value = row.workflow_id
  dialogVisible.value = true
}

const onClosed = () => {
  dialogVisible.value = false
  templateId.value = 0
  processInstId.value = 0
  workflowId.value = 0
  taskId.value = 0
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listOrdersData, { immediate: true })

defineExpose({
  listOrdersData
})
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
