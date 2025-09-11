<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="运行器管理"
      subtitle="管理工作节点运行器配置"
      add-button-text="新增运行器"
      @add="handlerCreate"
      @refresh="listRunnerData"
    />

    <!-- 主内容区域 -->
    <DataTable
      :data="runnersData"
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
      <!-- 标签列插槽 -->
      <template #tags="{ row }">
        <el-tag v-for="tag in row.tags" :key="tag" :style="{ marginRight: '5px' }" effect="plain" type="primary">
          {{ tag }}
        </el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
    <Drawer
      v-model="dialogVisible"
      :title="isEditMode ? '修改执行器' : '添加执行器'"
      subtitle="配置执行器的基本信息和运行参数"
      :header-icon="Setting"
      size="35%"
      direction="rtl"
      :show-footer="true"
      cancel-button-text="取消"
      confirm-button-text="保存"
      @closed="onClosed"
      @cancel="dialogVisible = false"
      @confirm="handlerCreateOrUpdagte"
    >
      <!-- 注册Runner -->
      <Form ref="runnerApiRef" @callback="listRunnerData" @closed="onClosed" />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { h, nextTick, ref, watch } from "vue"
import { Edit, Delete, Setting } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { runner } from "@/api/runner/types/runner"
import { deleteRunnerApi, listRunnerApi } from "@/api/runner"
import Form from "./form.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { Drawer } from "@@/components/Dialogs"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表格列配置
const tableColumns = [
  { prop: "name", label: "名称", align: "center" as const },
  { prop: "worker_name", label: "工作节点", align: "center" as const },
  { prop: "codebook_uid", label: "绑定模版", align: "center" as const },
  { prop: "tags", label: "标签", align: "center" as const, slot: "tags" }
]

// 操作按钮配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete }
]

// 选中的行
const selectedRows = ref<runner[]>([])

// 操作按钮事件
const handleOperateEvent = (row: runner, action: string) => {
  if (action === "edit") {
    handleUpdate(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

// 选择变化事件
const handleSelectionChange = (selection: runner[]) => {
  selectedRows.value = selection
}

const runnerApiRef = ref<InstanceType<typeof Form>>()
const dialogVisible = ref<boolean>(false)
const isEditMode = ref<boolean>(false)

const handlerCreate = () => {
  isEditMode.value = false
  dialogVisible.value = true
}

const onClosed = () => {
  runnerApiRef.value?.resetForm()
  dialogVisible.value = false
  isEditMode.value = false
}

/** 查询模版列表 */
const runnersData = ref<runner[]>([])
const listRunnerData = () => {
  listRunnerApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      runnersData.value = data.runners
    })
    .catch(() => {
      runnersData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: runner) => {
  isEditMode.value = true
  dialogVisible.value = true
  nextTick(() => {
    runnerApiRef.value?.setFrom(row)
  })
}

const handlerCreateOrUpdagte = () => {
  runnerApiRef.value?.submitForm()
}

const handleDelete = (row: runner) => {
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
    deleteRunnerApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listRunnerData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRunnerData, { immediate: true })
</script>
