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
            <template #default="scope">
              <OperateBtn
                :items="operateBtnStatus"
                @routeEvent="operateEvent"
                :operateItem="scope.row"
                :maxLength="2"
              />
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
    <createWorkflow
      :create-dialog-visible="addDialogVisible"
      :update-dialog-visible="updateDialogVisible"
      :workflowData="workflowData"
      @close="onClosed"
      @list-templates="listFlowsData"
    />

    <!-- 预览 -->
    <Preview :PreviewDialogvisble="PreviewDialogvisble" :data="graphData" @close="onPrevieClosed" />
  </div>
</template>

<script lang="ts" setup>
import { h, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import createWorkflow from "./create/index.vue"
import { deleteWorkflowApi, deployWorkflowApi, listWorkflowApi } from "@/api/workflow/workflow"
import { workflow } from "@/api/workflow/types/workflow"
import OperateBtn from "@/components/OperateBtn/index.vue"
import Preview from "./preview/Preview.vue"
import { ElMessage, ElMessageBox } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogVisible = ref<boolean>(false)
const updateDialogVisible = ref<boolean>(false)
const elCardVisibe = ref<boolean>(true)

const handlerCreate = () => {
  addDialogVisible.value = !addDialogVisible.value
  elCardVisibe.value = !elCardVisibe.value
}

const onClosed = () => {
  addDialogVisible.value = false
  elCardVisibe.value = !elCardVisibe.value
  updateDialogVisible.value = false
}

const onPrevieClosed = () => {
  PreviewDialogvisble.value = !PreviewDialogvisble.value
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

const graphData = ref<any>()
const workflowData = ref<workflow>()
const operateEvent = (data: any, name: string) => {
  if (name === "预览") {
    PreviewDialogvisble.value = !PreviewDialogvisble.value
    graphData.value = data.flow_data
  }

  if (name === "部署") {
    deployWorkflow(data)
  }

  // 编辑
  if (name === "3") {
    workflowData.value = data
    updateDialogVisible.value = !updateDialogVisible.value
    elCardVisibe.value = !elCardVisibe.value
  }

  // 删除
  if (name === "4") {
    handleDelete(data)
  }
}

const handleDelete = (row: workflow) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteWorkflowApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listFlowsData()
    })
  })
}

const deployWorkflow = (row: workflow) => {
  ElMessageBox({
    title: "部署确认",
    message: h("p", null, [
      h("span", null, "正在部署名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认部署？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deployWorkflowApi(row.id).then(() => {
      ElMessage.success("部署成功")
      listFlowsData()
    })
  })
}
const PreviewDialogvisble = ref<boolean>(false)
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
