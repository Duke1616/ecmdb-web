<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table
        :data="ordersData"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="id" label="工单ID" align="center" />
        <el-table-column prop="template_name" label="工单名称" align="center" />
        <el-table-column prop="provide" label="来源" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.provide === 1" effect="plain" type="primary">本系统</el-tag>
            <el-tag v-else-if="scope.row.provide === 2" effect="plain" type="warning">企业微信</el-tag>
            <el-tag v-else type="info" effect="plain">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="starter" label="提单人" align="center" />
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 4" effect="plain" type="danger">撤单</el-tag>
            <el-tag v-else-if="scope.row.status === 3" effect="plain" type="success">结单</el-tag>
            <el-tag v-else type="info" effect="plain">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ctime" label="工单提交时间" align="center" />
        <el-table-column prop="wtime" label="工单结束时间" align="center" />
        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button
              v-if="!scope.row.current_step.startsWith('自动化-')"
              type="success"
              text
              bg
              size="small"
              @click="handleApproval(scope.row)"
              >查看</el-button
            >
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
        :action="action"
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
import { getHisotryOrderApi } from "@/api/order"
import Detail from "../approved/detail.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const templateId = ref<number>()
const processInstId = ref<number>()
const taskId = ref<number>()
const workflowId = ref<number>()
const action = ref<string>("history")
/** 查询模版列表 */
const ordersData = ref<order[]>([])
const listOrdersData = () => {
  getHisotryOrderApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
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

const handleApproval = (row: order) => {
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
