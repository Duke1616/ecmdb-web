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
import { computed, useSlots, ref, onMounted, onUnmounted } from "vue"

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

// 窗口宽度响应式变量
const windowWidth = ref(window.innerWidth)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
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
  // 如果有自定义操作列插槽，尝试从插槽内容中获取实际按钮信息
  if (hasActionsSlot.value) {
    // 基于窗口宽度和数据量来动态计算
    const dataLength = props.data?.length || 0
    const isSmallScreen = windowWidth.value < 1400

    // 基础宽度 - 确保能容纳4字按钮
    let baseWidth = 200

    // 根据屏幕大小调整
    if (isSmallScreen) {
      baseWidth = 220 // 小屏幕也需要足够宽度显示4字按钮
    } else if (windowWidth.value > 1920) {
      baseWidth = 280 // 大屏幕可以使用更宽的列
    }

    // 根据数据量调整
    if (dataLength > 100) {
      baseWidth += 40 // 大量数据可能需要更多操作
    }

    // 确保最小宽度能容纳2个4字按钮
    const minWidthForTwoButtons = 180 // 2个4字按钮的最小宽度
    baseWidth = Math.max(baseWidth, minWidthForTwoButtons)

    return baseWidth
  }

  // 根据操作按钮数量动态调整宽度
  if (props.actions && props.actions.length > 0) {
    // 分析按钮文字长度，计算实际需要的宽度
    let maxTextLength = 0
    props.actions.forEach((action) => {
      const textLength = action.label ? action.label.length : 0
      maxTextLength = Math.max(maxTextLength, textLength)
    })

    // 中文字符宽度计算：9px字体
    const chineseCharWidth = 9
    const buttonPadding = 12 // 按钮内边距
    const buttonSpacing = 6 // 按钮间距
    const columnPadding = 16 // 列内边距
    const iconWidth = 12 // 图标宽度（如果有）

    // 计算单个按钮的宽度
    const singleButtonWidth = maxTextLength * chineseCharWidth + buttonPadding + iconWidth

    // 计算总宽度
    const totalWidth =
      props.actions.length * singleButtonWidth + (props.actions.length - 1) * buttonSpacing + columnPadding

    return Math.max(120, totalWidth)
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
      height: calc(2.4rem + 0.4vw);
      padding: calc(0.4rem + 0.25vw) calc(0.6rem + 0.35vw);
      font-size: calc(0.6rem + 0.2vw);
    }
  }

  :deep(.el-table__body) {
    td {
      font-size: calc(0.7rem + 0.25vw);
      padding: calc(0.4rem + 0.25vw) calc(0.6rem + 0.35vw);
      height: calc(2.6rem + 0.4vw);
    }
  }

  // 确保所有列都有一致的背景色
  :deep(.el-table__body) {
    // 重置所有单元格的背景色，让斑马纹效果统一
    tr {
      td {
        background-color: transparent !important;
      }
    }
    
    // 斑马纹样式 - 确保整行包括所有列都有一致背景
    tr.el-table__row--striped {
      background-color: #fafafa;
      
      td {
        background-color: #fafafa !important;
      }
    }
    
    // 斑马纹悬停样式
    tr.el-table__row--striped:hover {
      background-color: #f5f7fa;
      
      td {
        background-color: #f5f7fa !important;
      }
    }
    
    // 普通行悬停样式
    tr:hover {
      background-color: #f5f7fa;
      
      td {
        background-color: #f5f7fa !important;
      }
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
    gap: calc(0.4rem + 0.15vw);
    justify-content: center;
    align-items: center;

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: calc(0.2rem + 0.08vw);
      padding: calc(0.15rem + 0.08vw) calc(0.4rem + 0.15vw);
      border-radius: 4px;
      font-size: calc(0.6rem + 0.15vw);
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
      min-height: calc(1.4rem + 0.3vw);

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
  padding: calc(0.6rem + 0.25vw) calc(0.8rem + 0.35vw);
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}
</style>
