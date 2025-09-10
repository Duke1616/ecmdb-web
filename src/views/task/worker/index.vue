<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <ManagerHeader
      title="工作节点管理"
      subtitle="管理工作节点状态和配置"
      :show-add-button="false"
      @refresh="listWorkersData"
    />

    <!-- 主内容区域 -->
    <DataTable
      :data="workersData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 状态列插槽 -->
      <template #status="{ row }">
        <el-tag v-if="row.status === 1" effect="plain" type="primary" disable-transitions>运行</el-tag>
        <el-tag v-else-if="row.status === 2" effect="plain" type="warning" disable-transitions>禁用</el-tag>
        <el-tag v-else-if="row.status === 3" effect="plain" type="danger" disable-transitions>离线</el-tag>
        <el-tag v-else type="info" effect="plain" disable-transitions>未知类型</el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { worker } from "@/api/worker/types/worker"
import { listWorkerApi } from "@/api/worker/worker"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表格列配置
const tableColumns = [
  { prop: "name", label: "名称", align: "center" as const },
  { prop: "topic", label: "Topic", align: "center" as const },
  { prop: "status", label: "状态", align: "center" as const, slot: "status" },
  { prop: "desc", label: "描述", align: "center" as const }
]

// 操作按钮配置
const operateBtnItems = [{ name: "禁用", code: "disable", type: "warning" }]

// 选中的行
const selectedRows = ref<worker[]>([])

// 操作按钮事件
const handleOperateEvent = (row: worker, action: string) => {
  if (action === "disable") {
    handleUpdate(row)
  }
}

// 选择变化事件
const handleSelectionChange = (selection: worker[]) => {
  selectedRows.value = selection
}

/** 查询模版列表 */
const workersData = ref<worker[]>([])
const listWorkersData = () => {
  listWorkerApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      workersData.value = data.workers
    })
    .catch(() => {
      workersData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: worker) => {
  console.log(row)
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listWorkersData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}
</style>
