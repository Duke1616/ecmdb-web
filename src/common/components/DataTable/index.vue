<template>
  <div class="data-table-container">
    <div class="table-wrapper">
      <el-table
        :data="data"
        class="data-table"
        stripe
        :height="finalTableHeight"
        v-bind="tableProps"
        @selection-change="handleSelectionChange"
      >
        <!-- 选择列 -->
        <el-table-column v-if="showSelection" type="selection" width="50" align="center" />

        <!-- 动态列 -->
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :align="column.align || 'center'"
          :show-overflow-tooltip="column.showOverflowTooltip"
        >
          <template #default="scope">
            <!-- 自定义插槽 -->
            <slot v-if="column.slot" :name="column.slot" :row="scope.row" :column="column" :index="scope.$index" />
            <!-- 默认显示 -->
            <span v-else>{{ getColumnValue(scope.row, column) }}</span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          v-if="actions && actions.length > 0"
          :label="actionColumnLabel"
          :width="actionColumnWidth"
          :fixed="actionColumnFixed"
          align="center"
        >
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                v-for="action in actions"
                :key="action.key"
                :type="action.type || 'primary'"
                :plain="action.plain !== false"
                :size="action.size || 'small'"
                :disabled="action.disabled && action.disabled(scope.row)"
                @click="handleAction(action.key, scope.row, scope.$index)"
                class="action-btn"
              >
                <el-icon v-if="action.icon">
                  <component :is="action.icon" />
                </el-icon>
                {{ action.label }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div v-if="showPagination" class="pagination-container">
      <el-pagination
        background
        :layout="paginationLayout"
        :page-sizes="pageSizes"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Column {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: "left" | "right"
  align?: "left" | "center" | "right"
  showOverflowTooltip?: boolean
  slot?: string
  formatter?: (row: any, column: any, cellValue: any) => string
}

interface Action {
  key: string
  label: string
  type?: "primary" | "success" | "warning" | "danger" | "info"
  plain?: boolean
  size?: "small" | "default" | "large"
  icon?: any
  disabled?: (row: any) => boolean
}

interface Props {
  data: any[]
  columns: Column[]
  actions?: Action[]
  showSelection?: boolean
  actionColumnLabel?: string
  actionColumnWidth?: string | number
  actionColumnFixed?: "left" | "right"
  tableProps?: Record<string, any>
  // 分页相关
  showPagination?: boolean
  total?: number
  pageSize?: number
  currentPage?: number
  pageSizes?: number[]
  paginationLayout?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSelection: false,
  actionColumnLabel: "操作",
  actionColumnWidth: 320,
  actionColumnFixed: "right",
  tableProps: () => ({}),
  showPagination: false,
  total: 0,
  pageSize: 10,
  currentPage: 1,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: "total, sizes, prev, pager, next, jumper"
})

const emit = defineEmits<{
  action: [key: string, row: any, index: number]
  selectionChange: [selection: any[]]
  sizeChange: [size: number]
  currentChange: [page: number]
}>()

// 获取列值
const getColumnValue = (row: any, column: Column) => {
  const value = row[column.prop]
  return column.formatter ? column.formatter(row, column, value) : value
}

// 如果传入了固定高度，优先使用，否则使用 auto 让 flex 布局控制
const finalTableHeight = computed(() => {
  return props.tableProps.height || "auto"
})

// 处理操作按钮点击
const handleAction = (key: string, row: any, index: number) => {
  emit("action", key, row, index)
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  emit("selectionChange", selection)
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  emit("sizeChange", size)
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  emit("currentChange", page)
}
</script>

<style lang="scss" scoped>
.data-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 400px; /* 最小高度保证基本可用性 */
  overflow: hidden; /* 防止整体容器滚动 */
  border-radius: 8px;
  background: #ffffff;
}

.table-wrapper {
  flex: 1;
  min-height: 0; /* 关键：允许flex子项收缩 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-table {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-table) {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%; /* 确保el-table使用100%宽度 */
  }

  :deep(.el-table__header-wrapper) {
    flex-shrink: 0;
    overflow: visible;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8fafc;
  }

  :deep(.el-table__body-wrapper) {
    flex: 1;
    overflow-y: auto !important; /* 强制显示垂直滚动条 */
    overflow-x: auto;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 12px; /* 增加滚动条宽度使其更明显 */
      height: 12px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #94a3b8; /* 使滚动条更明显 */
      border-radius: 6px;
      transition: background 0.3s ease;

      &:hover {
        background: #64748b;
      }
    }

    /* 确保滚动条始终可见 */
    &::-webkit-scrollbar-thumb:vertical {
      min-height: 30px;
    }
  }

  :deep(.el-table__header) {
    background: #f8fafc;

    th {
      background: #f8fafc !important;
      color: #374151;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
      vertical-align: middle;
      height: 48px; /* 增加表头高度 */
      padding: 8px 12px;
      position: sticky;
      top: 0;
      z-index: 10;

      @media (max-width: 768px) {
        height: 40px;
        padding: 6px 8px;
        font-size: 13px;
      }
    }
  }

  :deep(.el-table__body) {
    tr {
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      td {
        vertical-align: middle;
        height: 52px; /* 增加行高 */
        padding: 8px 12px;
        border-bottom: 1px solid #f1f5f9;

        @media (max-width: 768px) {
          height: 44px;
          padding: 6px 8px;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 4px;
      flex-direction: column;
      align-items: stretch;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
      min-height: 28px;

      @media (max-width: 768px) {
        padding: 3px 6px;
        font-size: 11px;
        min-height: 24px;
        justify-content: center;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.pagination-container {
  flex-shrink: 0; /* 不允许收缩 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  min-height: 60px; /* 确保分页器有足够高度 */
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05); /* 添加上方阴影 */
}

@media (max-width: 768px) {
  .data-table-container {
    min-height: 300px;
  }

  .pagination-container {
    padding: 12px 16px;
    min-height: 50px;
  }
}
</style>
