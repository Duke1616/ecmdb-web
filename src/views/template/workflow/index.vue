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
          <el-table-column prop="desc" label="描述" align="center" />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <OperateBtn
              :items="operateBtnStatus"
              @routeEvent="operateEvent"
              :operateItem="operateItem"
              :maxLength="2"
            />
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
    <div>
      <Preview :PreviewDialogvisble="PreviewDialogvisble" :data="graphData" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import createWorkflow from "./create/index.vue"
import { listWorkflowApi } from "@/api/workflow/workflow"
import { workflow } from "@/api/workflow/types/workflow"
import OperateBtn from "@/components/OperateBtn/index.vue"
import Preview from "./preview/Preview.vue"

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

const flowsData = ref<workflow[]>([])
const listFlowsData = () => {
  listWorkflowApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      flowsData.value = data.workflows
    })
    .catch(() => {
      flowsData.value = []
    })
    .finally(() => {})
}
// const handleUpdate = (row: any) => {
//   console.log(row)
// }
// const handleDelete = (row: any) => {
//   console.log(row)
// }

const graphData = {
  nodes: [
    {
      id: "386cc810-3f14-4453-b939-d1f96806bda4",
      type: "start",
      x: 350,
      y: 160,
      properties: {}
    },
    {
      id: "a03a5d7b-e2f2-4a16-ae15-862f3de90b78",
      type: "end",
      x: 610,
      y: 160,
      properties: {}
    }
  ],
  edges: []
}
const operateEvent = (data: any, name: string) => {
  console.log(data, name, 999999999)
  if (name === "预览") {
    PreviewDialogvisble.value = !PreviewDialogvisble.value
  }

  if (name === "部署") {
    console.log("部署")
  }
}

const PreviewDialogvisble = ref<boolean>(false)
const operateItem = ref({})
const operateBtnStatus = ref([
  {
    name: "部署",
    code: "1",
    icon: "Open"
  },
  {
    name: "预览",
    code: "2",
    icon: "View"
  },
  {
    name: "编辑",
    code: "3",
    icon: "EditPen"
  },
  {
    name: "删除",
    code: "4",
    icon: "Delete",
    type: "danger"
  }
])

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
