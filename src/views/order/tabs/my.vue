<template>
  <el-card shadow="never">
    <!-- <div class="toolbar-wrapper">
      <div>
        <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增模版</el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="listOrdersData" />
        </el-tooltip>
      </div>
    </div> -->
    <div class="table-wrapper">
      <el-table :data="ordersData">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="process_instance_id" label="流程单号" align="center" />
        <el-table-column prop="title" label="标题" align="center" />
        <el-table-column prop="starter" label="提单人" align="center" />
        <el-table-column prop="current_step" label="当前步骤" align="center" />
        <el-table-column prop="approved_by" label="当前处理人" align="center" />
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
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
// import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { order } from "@/api/order/types/order"
import { startByOrderApi } from "@/api/order"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

/** 查询模版列表 */
const ordersData = ref<order[]>([])
const startByOrdersData = () => {
  startByOrderApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    process_name: ""
  })
    .then(({ data }) => {
      paginationData.total = data.total
      ordersData.value = data.orders
    })
    .catch(() => {
      ordersData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: order) => {
  console.log(row)
}
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], startByOrdersData, { immediate: true })
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
