<template>
  <div class="manager-content">
    <div class="content-card">
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
/* 主内容区域 */
.manager-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.data-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.data-table {
  flex: 1;
  width: 100%;
  min-height: 0;

  :deep(.el-table) {
    height: 100%;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }

  :deep(.el-table__header) {
    th {
      background: #f8fafc;
      color: #374151;
      font-weight: 600;
      height: 48px;
      padding: 12px 16px;
    }
  }

  :deep(.el-table__body) {
    td {
      height: 52px;
      padding: 12px 16px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
      min-height: 28px;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.pagination-container {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}
</style>
