<template>
  <div class="api-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input
        v-model="filterInput"
        size="large"
        placeholder="根据路径进行搜索..."
        :prefix-icon="Search"
        class="search-input"
        clearable
        @input="debouncedSearch"
      />
      <el-button type="primary" :icon="RefreshRight" @click="refreshData" class="refresh-btn"> 刷新数据 </el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <DataTable
        ref="dataTableRef"
        :data="endpointsData"
        :columns="tableColumns"
        :show-selection="true"
        :show-pagination="true"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        :page-sizes="paginationData.pageSizes"
        :pagination-layout="paginationData.layout"
        :table-props="{}"
        @selection-change="handleSelectionChange"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
        <!-- 接口方法插槽 -->
        <template #method="{ row }">
          <el-tag :type="getMethodTagType(row.method)" size="small">
            {{ row.method || "N/A" }}
          </el-tag>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listEndpointApi } from "@/api/endpoint"
import { endpoint } from "@/api/endpoint/types/endpoint"
import { Search, RefreshRight } from "@element-plus/icons-vue"
import { debounce } from "lodash-es"
import DataTable from "@/common/components/DataTable/index.vue"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 10,
  layout: "total, prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

// 定义事件
const emits = defineEmits<{
  confirm: [endpoints: endpoint[]]
}>()

// 表格配置
const tableColumns = [
  { prop: "path", label: "接口路径", minWidth: 260 },
  { prop: "method", label: "方法", width: 150, slot: "method" },
  { prop: "resource", label: "资源标识", minWidth: 150 },
  { prop: "desc", label: "接口介绍", minWidth: 260 }
]

// 获取接口方法标签类型
const getMethodTagType = (method: string | undefined): "success" | "primary" | "warning" | "info" | "danger" => {
  if (!method) return "info"

  const methodMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info"
  }
  return methodMap[method.toUpperCase()] || "info"
}

/** 查询模版列表 */
const filterInput = ref<string>("")
const endpointsData = ref<endpoint[]>([])
const selectedEndpoints = ref<endpoint[]>([])
const dataTableRef = ref()

const listEndpointsData = () => {
  listEndpointApi({
    path: filterInput.value,
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

// 防抖搜索
const debouncedSearch = debounce(() => {
  paginationData.currentPage = 1
  listEndpointsData()
}, 300)

// 刷新数据
const refreshData = () => {
  listEndpointsData()
}

// 处理选择变化
const handleSelectionChange = (selection: endpoint[]) => {
  selectedEndpoints.value = selection
}

// 清空选择
const clearSelection = () => {
  selectedEndpoints.value = []
  // 清空 DataTable 的选择状态
  dataTableRef.value?.clearSelection()
}

// 设置选择状态
const setSelection = (endpoints: endpoint[]) => {
  selectedEndpoints.value = [...endpoints]

  // 等待更长时间确保对话框和表格完全渲染
  setTimeout(() => {
    if (dataTableRef.value && dataTableRef.value.tableRef) {
      // 清空当前选择
      dataTableRef.value.tableRef.clearSelection()

      // 设置新的选择
      endpoints.forEach((endpoint) => {
        const row = endpointsData.value.find(
          (item) => item.path === endpoint.path && item.resource === endpoint.resource
        )
        if (row) {
          dataTableRef.value.tableRef.toggleRowSelection(row, true)
        }
      })
    }
  }, 100)
}

// 确认选择
const confirmSelection = () => {
  if (selectedEndpoints.value.length > 0) {
    // 触发选择确认事件，将选中的接口传递给父组件
    emits("confirm", selectedEndpoints.value)
  }
}

// 保持原有的方法用于外部调用
const getSelectionTableData = () => {
  return selectedEndpoints.value
}

const resetFilterInput = () => {
  filterInput.value = ""
}

defineExpose({
  getSelectionTableData,
  clearSelection,
  setSelection,
  confirmSelection,
  resetFilterInput
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listEndpointsData, { immediate: true })
</script>

<style lang="scss" scoped>
.api-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.search-section {
  padding-bottom: 12px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;

  .search-input {
    flex: 1;
  }

  .refresh-btn {
    height: 40px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    flex-shrink: 0;
    white-space: nowrap;
  }
}

.table-section {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .selection-info {
    .selection-count {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }
  }

  .footer-actions {
    display: flex;
    gap: 12px;

    .el-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    padding: 12px;
    flex-direction: column;
    gap: 8px;

    .search-input {
      width: 100%;
    }
  }

  .table-section {
    padding: 12px;
  }
}
</style>
