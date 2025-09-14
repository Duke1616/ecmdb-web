<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="排班管理" subtitle="管理系统排班和值班安排" @refresh="handleRefresh">
      <template #actions>
        <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerCreate"> 新增排班 </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="rotasData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{ loading, stripe: true, height: 'calc(100vh - 12rem)' }"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 状态列自定义插槽 -->
      <template #status="{ row }">
        <el-tag v-if="row.enabled === true" effect="plain" type="primary">启用</el-tag>
        <el-tag v-else type="info" effect="plain">禁用</el-tag>
      </template>

      <!-- 管理员列自定义插槽 -->
      <template #owner="{ row }">
        {{ userToolsStore.getOnlyDisplayName(row.owner) }}
      </template>

      <!-- 操作列自定义插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnStatus" @routeEvent="operateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 添加/编辑排班对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      subtitle="配置排班信息"
      header-icon="Calendar"
      confirm-text="保存"
      cancel-text="取消"
      @confirm="handlerSubmitRota"
      @cancel="onClosed"
      @closed="onClosed"
    >
      <div class="form-content">
        <Form ref="apiRef" @callback="listRotasData" @closed="onClosed" />
      </div>
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, h, computed } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { rota } from "@/api/rota/types/rota"
import { deleteRotaApi, listRotasApi } from "@/api/rota"
import Form from "./form.vue"
import router from "@/router"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import PageContainer from "@/common/components/PageContainer/index.vue"
const userToolsStore = useUserToolsStore()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>(false)
const loading = ref<boolean>(false)
const isEdit = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof Form>>()

// 对话框标题
const dialogTitle = computed(() => (isEdit.value ? "编辑排班" : "添加排班"))

// 表格列配置
const tableColumns = [
  {
    prop: "name",
    label: "名称",
    align: "center" as const
  },
  {
    prop: "enabled",
    label: "状态",
    align: "center" as const,
    slot: "status"
  },
  {
    prop: "owner",
    label: "管理员",
    align: "center" as const,
    slot: "owner"
  },
  {
    prop: "desc",
    label: "描述",
    align: "center" as const
  }
]

// OperateBtn 配置
const operateBtnStatus = ref([
  {
    name: "详情",
    code: "view",
    icon: "View"
  },
  {
    name: "修改",
    code: "edit",
    icon: "Edit"
  },
  {
    name: "删除",
    code: "delete",
    icon: "Delete",
    type: "danger"
  }
])

// 选中的行
const selectedRows = ref<rota[]>([])

// 选择变化事件
const handleSelectionChange = (selection: rota[]) => {
  selectedRows.value = selection
}

// OperateBtn 操作事件处理
const operateEvent = (data: rota, name: string) => {
  console.log("OperateBtn action triggered:", name, data)
  switch (name) {
    case "view":
      handleDetailClick(data)
      break
    case "edit":
      handleUpdateClick(data)
      break
    case "delete":
      handleDeleteClick(data)
      break
  }
}

const handleDetailClick = (row: rota) => {
  router.push({
    path: "/cmdb/rota/detail",
    query: { id: row.id }
  })
}

const handleUpdateClick = (row: rota) => {
  isEdit.value = true
  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.setFrom(row)
  })
}

const onClosed = () => {
  apiRef.value?.resetForm()
  dialogVisible.value = false
  isEdit.value = false
}

const handlerSubmitRota = () => {
  apiRef.value?.submitForm()
}

const handlerCreate = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const handleRefresh = () => {
  listRotasData()
  ElMessage.success("数据已刷新")
}

/** 查询排班列表 */
const rotasData = ref<rota[]>([])
const listRotasData = () => {
  loading.value = true
  listRotasApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      rotasData.value = data.rotas

      const usernames = rotasData.value.map((item) => item.owner)
      if (usernames.length > 0) {
        userToolsStore.setByUsernames(usernames)
      }
    })
    .catch(() => {
      rotasData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

const handleDeleteClick = (row: rota) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除排班: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteRotaApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listRotasData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRotasData, { immediate: true })
</script>

<style lang="scss" scoped>
.form-content {
  overflow-y: auto;
  padding: 0;
  margin: 0;
}
</style>
