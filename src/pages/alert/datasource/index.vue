<template>
  <ProGovernanceLayout
    title="数据源管理"
    subtitle="管理 Prometheus、VictoriaMetrics、Loki 等监控数据源"
    :primary-action="{ capability: ALERT_CAPABILITIES.Datasource.Add, label: '添加数据源', icon: CirclePlus }"
    @refresh="handleRefresh"
    @primary-action="handleAdd"
  >
    <template #search>
      <div class="datasource-search-command">
        <el-input
          v-model="searchForm.name"
          placeholder="搜索数据源名称..."
          class="command-input"
          clearable
          @input="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>

        <div class="divider" />

        <el-select
          v-model="searchForm.type"
          placeholder="数据源类型"
          clearable
          class="command-select"
          @change="handleSearch"
        >
          <el-option label="全部类型" value="" />
          <el-option v-for="type in datasourceTypes" :key="type.type" :label="type.name" :value="type.type" />
        </el-select>

        <el-select
          v-model="searchForm.enabled"
          placeholder="运行状态"
          clearable
          class="command-select is-status-select"
          @change="handleSearch"
        >
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
      </div>
    </template>

    <DataTable
      :loading="loading"
      :data="datasources"
      :columns="tableColumns"
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
      <template #name="{ row }">
        <div class="datasource-name-cell">
          <span class="datasource-name">{{ row.name }}</span>
          <span class="datasource-desc">{{ row.description || "暂无描述" }}</span>
        </div>
      </template>

      <template #url="{ row }">
        <span class="url-text">{{ row.http?.url || "-" }}</span>
      </template>

      <template #type="{ row }">
        <div class="datasource-type-cell">
          <img :src="getDatasourceTypeIcon(row.type)" :alt="getDatasourceTypeName(row.type)" class="datasource-icon" />
          <el-tag :type="getDatasourceTypeTagType(row.type) as any" effect="light">
            {{ getDatasourceTypeName(row.type) }}
          </el-tag>
        </div>
      </template>

      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'" effect="light">
          {{ row.enabled ? "启用" : "禁用" }}
        </el-tag>
      </template>

      <template #actions="{ row }">
        <OperateBtn :items="operateItems" :operate-item="row" :max-length="2" @route-event="handleOperateEvent" />
      </template>
    </DataTable>

    <DatasourceDrawer
      v-model="drawerVisible"
      :datasource="currentDatasource"
      :datasource-types="datasourceTypes"
      @success="handleFormSuccess"
    />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { CirclePlus, Delete, Edit, Search } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { debounce } from "lodash-es"
import { listDatasourceApi, deleteDatasourceApi } from "@/api/alert/datasource"
import type { Datasource, DatasourceType } from "@/api/alert/datasource/types/datasource"
import { DatasourceTypeEnum } from "@/api/alert/datasource/types/datasource"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import DatasourceDrawer from "./components/DatasourceDrawer.vue"
import {
  getDatasourceTypeIcon,
  getDatasourceTypeName,
  getDatasourceTypeTagType
} from "@/pages/alert/utils/datasourceMeta"
import type { Column } from "@@/components/DataTable/types"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const loading = ref(false)

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
    type: DatasourceTypeEnum.VICTORIA_METRICS,
    name: "VictoriaMetrics",
    description: "VictoriaMetrics 时序数据库",
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
const tableColumns: Column[] = [
  { prop: "name", label: "数据源名称", minWidth: 180, slot: "name" },
  { prop: "type", label: "类型", width: 160, slot: "type" },
  { prop: "http.url", label: "连接地址", minWidth: 260, slot: "url", showOverflowTooltip: true },
  { prop: "enabled", label: "状态", width: 120, slot: "enabled" }
]

// 操作按钮配置
const operateItems = [
  {
    name: "编辑",
    code: "edit",
    type: "warning",
    icon: Edit,
    capability: ALERT_CAPABILITIES.Datasource.Edit
  },
  {
    name: "删除",
    code: "delete",
    type: "danger",
    icon: Delete,
    capability: ALERT_CAPABILITIES.Datasource.Delete
  }
]

// 查询数据源列表
const listDatasources = () => {
  loading.value = true
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
    .finally(() => {
      loading.value = false
    })
}

// 数据源类型已写死，不需要从后端获取

// 搜索处理
const handleSearch = debounce(() => {
  paginationData.currentPage = 1
  listDatasources()
}, 300)

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
      console.error("删除数据源失败:", error)
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
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(260px, 22vw, 340px);
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: clamp(12px, 1.2vw, 20px);
  min-width: 0;
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.datasource-search-command {
  display: flex;
  align-items: center;
  flex: 0 1 560px;
  min-width: 0;
  max-width: 560px;
  height: 38px;
  padding: 0 10px 0 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: #0ea5e9;
  }

  .command-input {
    flex: 1 1 190px;
    min-width: 150px;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }

    .search-icon {
      color: #94a3b8;
      font-size: 16px;
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    margin: 0 10px;
    background: #e2e8f0;
    flex-shrink: 0;
  }

  .command-select {
    flex: 0 0 126px;
    width: 132px;

    &.is-status-select {
      flex-basis: 112px;
      width: 116px;
    }

    :deep(.el-select__wrapper) {
      padding: 0 8px;
      background: transparent;
      box-shadow: none !important;
    }

    :deep(.el-select__placeholder) {
      color: #64748b;
      font-size: 13px;
    }
  }
}

.datasource-name-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.datasource-name {
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-desc {
  max-width: 100%;
  overflow: hidden;
  color: #94a3b8;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-type-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.datasource-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.url-text {
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

@media (max-width: 1100px) {
  :deep(.manager-header) {
    align-items: stretch;
    flex-direction: column;
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.eiam-governance-bar) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .datasource-search-command {
    max-width: none;
  }
}

@media (max-width: 720px) {
  .datasource-search-command {
    height: auto;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 10px;

    .command-input,
    .command-select,
    .command-select.is-status-select {
      width: 100%;
    }

    .divider {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  :deep(.action-group) {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
