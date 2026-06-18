<template>
  <div class="manager-content">
    <div class="content-card">
      <div class="data-table-container" v-loading="loading">
        <div class="table-wrapper">
          <el-table
            ref="tableRef"
            :data="enableRowDrag ? draggableData : data || []"
            class="data-table"
            :stripe="false"
            :height="finalTableHeight"
            v-bind="tableProps"
            @selection-change="handleSelectionChange"
            row-key="id"
          >
            <!-- 选择列 -->
            <el-table-column
              v-if="showSelection"
              type="selection"
              width="50"
              align="center"
              header-align="center"
              class-name="selection-column"
              :selectable="selectable"
            />

            <!-- 拖拽列 -->
            <el-table-column v-if="enableRowDrag" label="拖拽" width="85" align="center">
              <template #default="{}">
                <el-icon class="drag-handle" style="cursor: move; color: #999">
                  <Rank />
                </el-icon>
              </template>
            </el-table-column>

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
                <div class="data-table-cell-content" :class="`is-${column.align || 'center'}`">
                  <slot
                    v-if="column.slot"
                    :name="column.slot"
                    :row="scope.row"
                    :column="column"
                    :index="scope.$index"
                  />
                  <span v-else class="data-table-cell-text">{{ getColumnValue(scope.row, column) }}</span>
                </div>
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
                <OperateBtn
                  :items="getOperateItems(scope.row)"
                  :operate-item="scope.row"
                  :max-length="2"
                  @route-event="(row: any, key: string) => handleAction(key, row, scope.$index)"
                />
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

            <!-- 空状态自定义插槽，统一系统品牌调性 -->
            <template #empty>
              <div v-if="loading" class="table-loading-empty" />
              <slot v-else name="empty">
                <el-empty :image-size="120" description="暂无数据" />
              </slot>
            </template>
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
            small
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
import { computed, useSlots, ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { Rank } from "@element-plus/icons-vue"
import Sortable from "sortablejs"
import type { Column, Action } from "./types"
import OperateBtn from "@/common/components/OperateBtn/index.vue"

interface Props {
  data: any[]
  columns: Column[]
  actions?: Action[]
  showSelection?: boolean
  actionColumnLabel?: string
  actionColumnWidth?: string | number
  actionColumnFixed?: "left" | "right" | boolean
  tableProps?: Record<string, any>
  loading?: boolean

  // 分页相关
  showPagination?: boolean
  total?: number
  pageSize?: number
  currentPage?: number
  pageSizes?: number[]
  paginationLayout?: string

  // 行拖拽相关
  enableRowDrag?: boolean
  // 选择逻辑控制
  selectable?: (row: any, index: number) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  showSelection: false,
  actionColumnLabel: "操作",
  actionColumnWidth: 200,
  enableRowDrag: false,
  actionColumnFixed: "right",
  tableProps: () => ({}),
  loading: false,
  showPagination: false,
  selectable: () => true
})

const slots = useSlots()

// 表格引用
const tableRef = ref()

// 可拖拽的数据数组
const draggableData = ref(Array.isArray(props.data) ? [...props.data] : [])

// 窗口宽度响应式变量
const windowWidth = ref(window.innerWidth)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener("resize", handleResize)
  if (props.enableRowDrag) {
    initSortable()
  }
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
  destroySortable()
})

// 监听数据变化，同步到可拖拽数据
watch(
  () => props.data,
  (newData) => {
    // NOTE: 加上防御性判断，防止异步或未定义数据在展开时抛出 is not iterable 异常
    draggableData.value = Array.isArray(newData) ? [...newData] : []
  },
  { deep: true, immediate: true }
)

// 监听拖拽功能开关
watch(
  () => props.enableRowDrag,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        initSortable()
      })
    } else {
      destroySortable()
    }
  }
)

const emit = defineEmits<{
  action: [key: string, row: any, index: number]
  selectionChange: [selection: any[]]
  sizeChange: [size: number]
  currentChange: [page: number]
  rowDrag: [data: any[]]
}>()

// Sortable 实例
let sortableInstance: Sortable | null = null

// 初始化拖拽
const initSortable = () => {
  if (!props.enableRowDrag || !tableRef.value) return

  nextTick(() => {
    const tbody = tableRef.value.$el.querySelector("tbody")
    if (tbody && !sortableInstance) {
      sortableInstance = new Sortable(tbody, {
        handle: ".drag-handle",
        animation: 200,
        ghostClass: "ghost",
        chosenClass: "chosen",
        dragClass: "drag",
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt
          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            // 移动数组元素
            const item = draggableData.value.splice(oldIndex, 1)[0]
            draggableData.value.splice(newIndex, 0, item)

            // 触发事件
            emit("rowDrag", draggableData.value)
          }
        }
      })
    }
  })
}

// 销毁拖拽
const destroySortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
}

// 获取列值
const getColumnValue = (row: any, column: Column) => {
  // 支持嵌套属性访问，如 "http.url"
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : ""
    }, obj)
  }

  const value = getNestedValue(row, column.prop)
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
    let baseWidth = 180

    // 根据屏幕大小调整
    if (isSmallScreen) {
      baseWidth = 200 // 小屏幕也需要足够宽度显示4字按钮
    } else if (windowWidth.value > 1920) {
      baseWidth = 200 // 大屏幕维持稳定操作列，避免过宽
    }

    // 根据数据量调整
    if (dataLength > 100) {
      baseWidth += 40 // 大量数据可能需要更多操作
    }

    // 确保最小宽度能容纳2个4字按钮
    const minWidthForTwoButtons = 170 // 2个4字按钮的最小宽度
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

const getOperateItems = (row: any) => {
  return (props.actions || []).map((action) => ({
    name: action.label,
    code: action.key,
    type: action.type,
    icon: action.icon,
    disabled: Boolean(action.loading?.(row) || action.disabled?.(row)),
    capability: action.capability
  }))
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

// 清空选择
const clearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

// 暴露方法给父组件
defineExpose({
  clearSelection,
  tableRef
})
</script>

<style lang="scss" scoped>
/* 主内容区域 */
.manager-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;

  /* 强制设置表格样式变量 */
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: #f5f7fa;
  --el-table-stripe-bg-color: #fafafa;
  --el-table-header-bg-color: #f8fafc;
}

/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: none;
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
  background: #ffffff;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-loading-empty {
  min-height: 220px;
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
    color: #334155;
    font-size: 13px;
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
      background: #f8fafc !important;
      color: #334155;
      font-weight: 700;
      height: 48px;
      padding: 0;
      font-size: 13px;
    }

    th .cell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 12px 14px;
      box-sizing: border-box;
      text-align: center;
    }
  }

  :deep(.el-table__body) {
    td {
      color: #334155;
      font-size: 13px;
      padding: 0;
      height: 56px;
    }

    td .cell {
      display: flex;
      align-items: center;
      min-height: 56px;
      padding: 12px 14px;
      box-sizing: border-box;
    }
  }

  :deep(.selection-column .cell) {
    justify-content: center;
    padding: 0;
  }

  :deep(.selection-column .el-checkbox) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    margin: 0;
  }

  :deep(.selection-column .el-checkbox__input) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-table__cell .cell) {
    width: 100%;
  }

  .data-table-cell-content {
    display: flex;
    align-items: center;
    min-width: 0;
    width: 100%;

    &.is-left {
      justify-content: flex-start;
      text-align: left;
    }

    &.is-center {
      justify-content: center;
      text-align: center;
    }

    &.is-right {
      justify-content: flex-end;
      text-align: right;
    }
  }

  .data-table-cell-text {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 确保所有列都有一致的背景色 - 使用更高优先级的选择器
  :deep(.el-table__body tr) {
    --el-table-tr-bg-color: #ffffff;
    background-color: var(--el-table-tr-bg-color);
  }

  :deep(.el-table__body tr:hover),
  :deep(.el-table__body tr.hover-row),
  :deep(.el-table__body tr.current-row) {
    --el-table-tr-bg-color: #f8fafc;
    background-color: var(--el-table-tr-bg-color);
  }

  :deep(.el-table__body td) {
    background-color: var(--el-table-tr-bg-color) !important;
  }

  :deep(.el-table__inner-wrapper::before),
  :deep(.el-table__border-left-patch) {
    background-color: #e2e8f0;
  }

  :deep(.el-table__cell) {
    border-color: #e2e8f0;
  }

  :deep(.el-table--border .el-table__cell) {
    border-right-color: #eef2f7;
  }

  :deep(.el-table__cell.el-table-fixed-column--left),
  :deep(.el-table__cell.el-table-fixed-column--right) {
    position: relative;
    z-index: 2;
    background-color: var(--el-table-tr-bg-color) !important;
  }

  :deep(.el-table__cell.el-table-fixed-column--left .cell),
  :deep(.el-table__cell.el-table-fixed-column--right .cell) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    background: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  :deep(th.el-table__cell.el-table-fixed-column--left),
  :deep(th.el-table__cell.el-table-fixed-column--right) {
    z-index: 3;
    background-color: #f8fafc !important;
  }

  :deep(.el-table-fixed-column--left.is-last-column) {
    border-right: none;
  }

  :deep(.el-table-fixed-column--right.is-first-column) {
    border-left: none;
  }

  :deep(.el-table-fixed-column--left.is-last-column::before),
  :deep(.el-table-fixed-column--right.is-first-column::before) {
    display: none;
  }
}

.pagination-container {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}

:deep(.pagination) {
  --el-pagination-button-width: 28px;
  --el-pagination-button-height: 28px;
  font-weight: 500;
}

// 行拖拽相关样式
.drag-handle {
  cursor: move;
  color: #999;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}

.ghost {
  opacity: 0.5;
  background: #f5f7fa;
}

.chosen {
  background: #e6f7ff;
}

.drag {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
