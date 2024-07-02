<template>
  <div class="app-container">
    <el-card shadow="never" v-show="elCardVisibe">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增流程</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listFlowsData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="flowsData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="create_type" label="来源" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.create_type === 1" effect="plain" type="primary">系统自建</el-tag>
              <el-tag v-else-if="scope.row.create_type === 2" effect="plain" type="warning">企业微信</el-tag>
              <el-tag v-else type="info" effect="plain">未知类型</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
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
    <!-- 新增模版 -->
    <createWorkflow :dialog-visible="addDialogVisible" @close="onClosed" @list-templates="listFlowsData" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import createWorkflow from "./create/index.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogVisible = ref<boolean>(false)
const elCardVisibe = ref<boolean>(true)

const handlerCreate = () => {
  addDialogVisible.value = !addDialogVisible.value
  elCardVisibe.value = !elCardVisibe.value
}

const onClosed = () => {
  addDialogVisible.value = !addDialogVisible.value
  elCardVisibe.value = !elCardVisibe.value
}

const flowsData = ref([])
const listFlowsData = () => {}
const handleUpdate = (row: any) => {
  console.log(row)
}
const handleDelete = (row: any) => {
  console.log(row)
}
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listFlowsData, { immediate: true })
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
