<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="table-wrapper">
        <el-table ref="tableRef" :data="endpointsData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="path" label="路径" width="260" />
          <el-table-column prop="method" label="方法" align="center" />
          <el-table-column prop="is_auth" label="是否登录" align="center" />
          <el-table-column prop="is_permission" label="是否鉴权" align="center" />
          <el-table-column prop="desc" label="接口介绍" align="center" width="260" />
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
import { listEndpointApi } from "@/api/endpoint"
import { endpoint } from "@/api/endpoint/types/endpoint"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

/** 查询模版列表 */
const endpointsData = ref<endpoint[]>([])
const listEndpointsData = () => {
  listEndpointApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      endpointsData.value = data.endpoints
    })
    .catch(() => {
      endpointsData.value = []
    })
    .finally(() => {})
}

const tableRef = ref()

const getSelectionTableData = () => {
  const tableData = tableRef.value.getSelectionRows()
  return tableData
}

const clearSelection = () => {
  tableRef.value.clearSelection()
}

defineExpose({
  getSelectionTableData,
  clearSelection
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listEndpointsData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

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
