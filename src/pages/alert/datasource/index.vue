<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="数据源管理"
      subtitle="管理 Prometheus、VictoriaMetrics、Loki 等监控数据源"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleAdd"> 添加数据源 </el-button>
        <el-tooltip content="刷新数据">
          <el-button :icon="RefreshRight" class="action-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="数据源名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入数据源名称"
            clearable
            @input="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择数据源类型"
            clearable
            @change="handleSearch"
            style="width: 150px"
          >
            <el-option v-for="type in datasourceTypes" :key="type.type" :label="type.name" :value="type.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.enabled"
            placeholder="请选择状态"
            clearable
            @change="handleSearch"
            style="width: 120px"
          >
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
          <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <DataTable
      :data="datasources"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 数据源类型插槽 -->
      <template #type="{ row }">
        <el-tag :type="getTypeTagType(row.type) as any">
          {{ getTypeName(row.type) }}
        </el-tag>
      </template>

      <!-- 状态插槽 -->
      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'">
          {{ row.enabled ? "启用" : "禁用" }}
        </el-tag>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems()" :operate-item="row" :max-length="2" @route-event="handleOperateEvent" />
      </template>
    </DataTable>

    <!-- 数据源新增/编辑抽屉 -->
    <DatasourceDrawer
      v-model="drawerVisible"
      :datasource="currentDatasource"
      :datasource-types="datasourceTypes"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, RefreshRight, Search, Refresh } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { debounce } from "lodash-es"
import { listDatasourceApi, deleteDatasourceApi } from "@/api/alert/datasource"
import type { Datasource, DatasourceType } from "@/api/alert/datasource/types/datasource"
import { DatasourceTypeEnum } from "@/api/alert/datasource/types/datasource"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import DatasourceDrawer from "./components/DatasourceDrawer.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 搜索表单
const searchForm = ref({
  name: "",
  type: "" as DatasourceTypeEnum | "",
  enabled: undefined as boolean | undefined
})

// 数据源列表
const datasources = ref<Datasource[]>([])

// 写死的数据源类型
const datasourceTypes = ref<DatasourceType[]>([
  {
    type: DatasourceTypeEnum.PROMETHEUS,
    name: "Prometheus",
    description: "Prometheus 监控系统",
    icon: "monitor"
  },
  {
    type: DatasourceTypeEnum.LOKI,
    name: "Loki",
    description: "Loki 日志聚合系统",
    icon: "document"
  }
])

// 抽屉状态
const drawerVisible = ref(false)
const currentDatasource = ref<Datasource | null>(null)

// 表格配置
const tableColumns = [
  { prop: "name", label: "数据源名称", minWidth: 150 },
  { prop: "type", label: "类型", width: 200, slot: "type" },
  { prop: "http.url", label: "连接地址", minWidth: 200 },
  { prop: "enabled", label: "状态", width: 150, slot: "enabled" },
  { prop: "description", label: "描述", minWidth: 200 }
]

// 操作按钮配置
const getOperateItems = () => [
  {
    name: "编辑",
    code: "edit",
    type: "warning",
    icon: "Edit"
  },
  {
    name: "删除",
    code: "delete",
    type: "danger",
    icon: "Delete"
  }
]

// 获取数据源类型名称
const getTypeName = (type: DatasourceTypeEnum) => {
  const typeMap = {
    [DatasourceTypeEnum.PROMETHEUS]: "Prometheus",
    [DatasourceTypeEnum.LOKI]: "Loki"
  }
  return typeMap[type] || type
}

// 获取数据源类型标签类型
const getTypeTagType = (type: DatasourceTypeEnum) => {
  const typeMap = {
    [DatasourceTypeEnum.PROMETHEUS]: "danger",
    [DatasourceTypeEnum.LOKI]: "success"
  }
  return typeMap[type] || "info"
}

// 查询数据源列表
const listDatasources = () => {
  listDatasourceApi({
    name: searchForm.value.name || undefined,
    type: searchForm.value.type || undefined,
    enabled: searchForm.value.enabled,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      datasources.value = data.data_sources
    })
    .catch(() => {
      datasources.value = []
    })
}

// 数据源类型已写死，不需要从后端获取

// 搜索处理
const handleSearch = debounce(() => {
  paginationData.currentPage = 1
  listDatasources()
}, 300)

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    name: "",
    type: "",
    enabled: undefined
  }
  paginationData.currentPage = 1
  listDatasources()
}

// 刷新数据
const handleRefresh = () => {
  listDatasources()
}

// 添加数据源
const handleAdd = () => {
  currentDatasource.value = null
  drawerVisible.value = true
}

// 编辑数据源
const handleEdit = (row: Datasource) => {
  currentDatasource.value = row
  drawerVisible.value = true
}

// 删除数据源
const handleDelete = async (row: Datasource) => {
  try {
    await ElMessageBox.confirm(`确定要删除数据源 "${row.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteDatasourceApi(row.id)
    ElMessage.success("删除成功")
    listDatasources()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

// 操作按钮事件处理
const handleOperateEvent = (row: Datasource, code: string) => {
  switch (code) {
    case "edit":
      handleEdit(row)
      break
    case "delete":
      handleDelete(row)
      break
  }
}

// 表单成功处理
const handleFormSuccess = () => {
  listDatasources()
}

// 初始化
onMounted(() => {
  listDatasources()
})
</script>

<style lang="scss" scoped>
.search-card {
  margin-bottom: 1rem;
}

.table-card {
  .el-card__body {
    padding: 0;
  }
}
</style>
