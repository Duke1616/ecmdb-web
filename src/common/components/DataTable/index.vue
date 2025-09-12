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

            <!-- 默认操作列 -->
            <el-table-column
              v-if="actions && actions.length > 0 && !hasActionsSlot"
              :label="actionColumnLabel"
              :width="dynamicActionColumnWidth"
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

            <!-- 自定义操作列插槽 -->
            <el-table-column
              v-if="hasActionsSlot"
              :label="actionColumnLabel"
              :width="dynamicActionColumnWidth"
              :fixed="actionColumnFixed"
              align="center"
            >
              <template #default="scope">
                <slot name="actions" :row="scope.row" :column="scope.column" :index="scope.$index" />
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
import { computed, useSlots } from "vue"

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
  actionColumnWidth: 200,
  actionColumnFixed: "right",
  tableProps: () => ({}),
  showPagination: false
})

const slots = useSlots()

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

// 如果传入了固定高度，优先使用，否则根据是否有分页来决定高度
const finalTableHeight = computed(() => {
  if (props.tableProps.height) {
    return props.tableProps.height
  }
  // 如果没有分页，使用 100% 让表格填充容器
  if (!props.showPagination) {
    return "100%"
  }
  // 有分页时使用 auto
  return "auto"
})

// 检查是否有自定义操作列插槽
const hasActionsSlot = computed(() => {
  return !!slots.actions
})

// 动态计算操作列宽度
const dynamicActionColumnWidth = computed(() => {
  // 如果有自定义操作列插槽，尝试从插槽内容中检测按钮数量
  if (hasActionsSlot.value) {
    // 通过检查插槽内容来动态调整宽度
    // 这里我们使用一个更智能的方式：根据常见的按钮数量模式来调整
    // 由于无法直接访问插槽内容，我们使用一个合理的默认值
    return 200 // 大多数情况下使用200px
  }

  // 根据操作按钮数量动态调整宽度
  if (props.actions && props.actions.length > 0) {
    return props.actions.length <= 2 ? 200 : 250
  }

  return props.actionColumnWidth
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
  display: flex;
  flex-direction: column;

  :deep(.el-table) {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-table__body-wrapper) {
    flex: 1;
    overflow-y: auto;
  }

  :deep(.el-table__header-wrapper) {
    flex-shrink: 0;
  }

  :deep(.el-table__header) {
    th {
      background: #f8fafc;
      color: #374151;
      font-weight: 600;
      height: 48px;
      padding: 12px 16px;
      font-size: 14px;
    }
  }

  :deep(.el-table__body) {
    td {
      font-size: 14px;
      padding: 12px 16px;
    }
  }

  // :deep(.el-table__body) {
  //   td {
  //     height: 52px;
  //     padding: 12px 16px;
  //   }
  // }

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

/* 高分辨率屏幕优化 */
@media (min-width: 1440px) {
  .data-table {
    :deep(.el-table__header) {
      th {
        font-size: 15px;
        height: 52px;
        padding: 14px 18px;
      }
    }

    :deep(.el-table__body) {
      td {
        font-size: 15px;
        padding: 14px 18px;
        height: 56px;
      }
    }
  }

  .action-buttons {
    .action-btn {
      font-size: 13px;
      padding: 8px 14px;
      min-height: 32px;
    }
  }

  .pagination-container {
    padding: 18px 22px;

    :deep(.el-pagination) {
      font-size: 15px;

      .el-pagination__sizes,
      .el-pagination__total,
      .el-pagination__jump {
        font-size: 15px;
      }
    }
  }
}

/* 超高分辨率屏幕优化 */
@media (min-width: 1920px) {
  .data-table {
    :deep(.el-table__header) {
      th {
        font-size: 16px;
        height: 56px;
        padding: 16px 20px;
      }
    }

    :deep(.el-table__body) {
      td {
        font-size: 16px;
        padding: 16px 20px;
        height: 60px;
      }
    }
  }

  .action-buttons {
    .action-btn {
      font-size: 14px;
      padding: 10px 16px;
      min-height: 36px;
    }
  }

  .pagination-container {
    padding: 20px 24px;

    :deep(.el-pagination) {
      font-size: 16px;

      .el-pagination__sizes,
      .el-pagination__total,
      .el-pagination__jump {
        font-size: 16px;
      }
    }
  }
}
</style>
