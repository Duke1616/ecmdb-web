<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table
        :data="ordersData"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="id" label="工单号" align="center" />
        <el-table-column prop="task_id" label="流程任务号" align="center" />
        <el-table-column prop="template_name" label="工单名称" align="center" />
        <el-table-column prop="provide" label="来源" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.provide === 1" effect="plain" type="primary">本系统</el-tag>
            <el-tag v-else-if="scope.row.provide === 2" effect="plain" type="warning">企业微信</el-tag>
            <el-tag v-else type="info" effect="plain">未知类型</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="starter" label="提单人" align="center" />
        <el-table-column prop="current_step" label="当前步骤" align="center" />
        <el-table-column prop="approved_by" label="当前处理人" align="center" />
        <el-table-column prop="proc_inst_create_time" label="流程提交时间" align="center" />
        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button type="success" text bg size="small" @click="handleApproval(scope.row)">处理</el-button>
            <el-button
              v-if="scope.row.current_step.startsWith('自动化-') && scope.row.approved_by === 'automation'"
              type="primary"
              text
              bg
              size="small"
              @click="refreshHandler"
              >刷新</el-button
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
    :orderInfo="orderInfo"
    @refresh-data="listOrdersData"
    @close="onClosed"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
// import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { order } from "@/api/order/types/order"
import { todoOrderApi } from "@/api/order"
import Detail from "../approved/detail.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>()
const action = ref<string>("todo")
const orderInfo = ref<order>()

/** 查询模版列表 */
const ordersData = ref<order[]>([])
const listOrdersData = () => {
  todoOrderApi({
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

const refreshHandler = () => {
  listOrdersData()
}

const handleApproval = (row: order) => {
  dialogVisible.value = true
  orderInfo.value = row
}

const onClosed = () => {
  dialogVisible.value = false
  orderInfo.value = undefined
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
