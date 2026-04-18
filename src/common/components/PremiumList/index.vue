<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, ref, useAttrs, useSlots } from "vue"
import { Search, CircleCheckFilled } from "@element-plus/icons-vue"

interface Props {
  title?: string
  total?: number
  loading?: boolean
  currentPage?: number
  pageSize?: number
  indicatorColor?: string
  searchPlaceholder?: string
  searchDebounce?: number
  showSearch?: boolean
  hideHeader?: boolean
  hidePagination?: boolean
  hideOnSinglePage?: boolean
  hideColumnHeader?: boolean
  data: T[]
  emptyText?: string
  emptyImageSize?: number
  // 选择相关
  showSelection?: boolean
  selection?: T[]
  rowKey?: PropertyKey
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  total: 0,
  loading: false,
  currentPage: 1,
  pageSize: 10,
  indicatorColor: "#3b82f6",
  searchPlaceholder: "全文搜索标识...",
  searchDebounce: 260,
  showSearch: undefined,
  hideHeader: false,
  hidePagination: false,
  hideOnSinglePage: false,
  hideColumnHeader: false,
  emptyText: "无符合条件的授权条目",
  emptyImageSize: 100,
  showSelection: false,
  selection: () => [],
  rowKey: "id"
})

const emit = defineEmits<{
  "update:currentPage": [page: number]
  "update:selection": [selection: T[]]
  pageChange: [page: number]
  selectionChange: [selection: T[]]
  search: [keyword: string]
}>()

const attrs = useAttrs()
const slots = useSlots()
const hasExtraFilters = computed(() => !!slots["extra-filters"])
const hasHeaderActions = computed(() => !!slots["header-actions"])
const hasSearchListener = computed(() => typeof attrs.onSearch === "function")
const shouldShowSearch = computed(() => {
  if (typeof props.showSearch === "boolean") {
    return props.showSearch
  }

  return hasExtraFilters.value || hasSearchListener.value
})
const searchKeyword = ref("")
let searchTimer: ReturnType<typeof setTimeout> | undefined

// 分页 Model
const currentPageModel = computed({
  get: () => props.currentPage || 1,
  set: (val) => {
    emit("update:currentPage", val)
    emit("pageChange", val)
  }
})

const getRowValue = (item: T) => {
  return (item as Record<PropertyKey, unknown>)[props.rowKey]
}

const selectedKeySet = computed(() => new Set(props.selection.map((item) => getRowValue(item))))

const currentPageKeys = computed(() => props.data.map((item) => getRowValue(item)))

const currentSelectedCount = computed(() => {
  return currentPageKeys.value.filter((key) => selectedKeySet.value.has(key)).length
})

const emitSelection = (selection: T[]) => {
  emit("update:selection", selection)
  emit("selectionChange", selection)
}

const selectCurrentPage = () => {
  const nextSelection = [...props.selection]
  props.data.forEach((item) => {
    if (!selectedKeySet.value.has(getRowValue(item))) {
      nextSelection.push(item)
    }
  })
  emitSelection(nextSelection)
}

const clearCurrentPageSelection = () => {
  const nextSelection = props.selection.filter((item) => !currentPageKeys.value.includes(getRowValue(item)))
  emitSelection(nextSelection)
}

const isAllSelected = computed({
  get: () => props.data.length > 0 && currentSelectedCount.value === props.data.length,
  set: (val) => {
    if (val) {
      selectCurrentPage()
      return
    }

    clearCurrentPageSelection()
  }
})

const isIndeterminate = computed(() => currentSelectedCount.value > 0 && currentSelectedCount.value < props.data.length)

const toggleItemSelection = (item: T) => {
  const rowValue = getRowValue(item)
  const nextSelection = selectedKeySet.value.has(rowValue)
    ? props.selection.filter((selectedItem) => getRowValue(selectedItem) !== rowValue)
    : [...props.selection, item]
  emitSelection(nextSelection)
}

const handleSearchInput = (value: string | number) => {
  searchKeyword.value = String(value ?? "")
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit("search", searchKeyword.value.trim())
  }, props.searchDebounce)
}

const handleSearchReset = () => {
  searchKeyword.value = ""
  handleSearchInput("")
}

const isItemSelected = (item: T) => {
  return selectedKeySet.value.has(getRowValue(item))
}

const isPropertyKey = (value: unknown): value is PropertyKey => {
  return typeof value === "string" || typeof value === "number" || typeof value === "symbol"
}

const getItemKey = (item: T, index: number): PropertyKey => {
  const rowValue = getRowValue(item)
  return isPropertyKey(rowValue) && rowValue !== "" ? rowValue : index
}

const showLoadingPlaceholder = computed(() => props.loading && props.data.length === 0)

const renderedItems = computed(() => {
  return props.data.map((item, index) => ({
    item,
    index,
    key: getItemKey(item, index),
    selected: isItemSelected(item)
  }))
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="premium-shelf">
    <!-- 头部治理区：参考授权治理风格 -->
    <div v-if="!hideHeader" class="shelf-header">
      <div v-show="selection.length === 0" class="header-main-bar">
        <!-- 标题组 -->
        <div class="title-group">
          <div class="indicator" :style="{ backgroundColor: indicatorColor }" />
          <span class="text">{{ title }}</span>
          <span class="badge">{{ total }}</span>
        </div>

        <div v-if="shouldShowSearch" class="toolbar-search">
          <div class="command-search-wrap" :class="{ 'has-filters': hasExtraFilters }">
            <div class="search-main">
              <el-input
                v-model="searchKeyword"
                :placeholder="searchPlaceholder"
                clearable
                class="command-input"
                @input="handleSearchInput"
              >
                <template #prefix>
                  <el-icon class="search-icon"><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <div v-if="hasExtraFilters" class="inner-divider" />
            <div v-if="hasExtraFilters" class="extra-filters">
              <slot name="extra-filters" />
            </div>
          </div>

          <button v-if="searchKeyword" type="button" class="search-reset" @click="handleSearchReset">清空</button>
        </div>

        <!-- 动作组 -->
        <div v-if="hasHeaderActions" class="action-group">
          <slot name="header-actions" />
        </div>
      </div>

      <!-- 批量授权拦截条 -->
      <transition name="fade">
        <div v-if="selection.length > 0" class="header-batch-bar">
          <div class="status-info">
            <el-icon class="icon"><CircleCheckFilled /></el-icon>
            <span
              >选择了 <strong class="num">{{ selection.length }}</strong> 项</span
            >
          </div>
          <div class="batch-actions">
            <slot name="batch-actions" />
          </div>
        </div>
      </transition>
    </div>

    <!-- 列表实体 -->
    <div v-loading="loading" class="shelf-content">
      <!-- 字段头 -->
      <div v-if="data.length > 0 && !hideColumnHeader" class="content-labels">
        <div v-if="showSelection" class="label-check">
          <el-checkbox v-model="isAllSelected" :indeterminate="isIndeterminate" />
        </div>
        <div class="label-main">
          <slot name="column-header">
            <span>授权明细看板</span>
          </slot>
        </div>
      </div>

      <!-- 条目堆栈 -->
      <div v-if="data.length > 0" class="items-list">
        <div v-for="row in renderedItems" :key="row.key" class="item-row" :class="{ 'is-active': row.selected }">
          <div v-if="showSelection" class="row-checkbox">
            <el-checkbox :model-value="row.selected" @change="toggleItemSelection(row.item)" />
          </div>
          <div class="row-body">
            <slot name="item" :item="row.item" :index="row.index" :selected="row.selected" />
          </div>
        </div>
      </div>

      <div v-else-if="showLoadingPlaceholder" class="loading-placeholder" aria-hidden="true" />

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <slot name="empty">
          <el-empty :image-size="emptyImageSize" :description="emptyText" />
        </slot>
      </div>
    </div>

    <!-- 页脚分页 -->
    <div v-if="!hidePagination && total > 0" class="shelf-footer">
      <el-pagination
        v-model:current-page="currentPageModel"
        :page-size="pageSize"
        :hide-on-single-page="hideOnSinglePage"
        layout="total, prev, pager, next"
        :total="total"
        background
        small
        :style="{ '--el-color-primary': indicatorColor }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.premium-shelf {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 头部：参考授权治理风格 */
.shelf-header {
  min-height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  display: flex;
  align-items: center;
  padding: 14px 18px;

  .header-main-bar,
  .header-batch-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .indicator {
      width: 5px;
      height: 26px;
      border-radius: 999px;
    }

    .text {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.005em;
    }

    .badge {
      min-width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e5edf5;
      padding: 0 8px;
      border-radius: 999px;
    }
  }

  .toolbar-search {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
  }

  .command-search-wrap {
    flex: 0 1 500px;
    min-width: 280px;
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 0;
    padding: 0;
    overflow: visible;

    .search-main {
      flex: 1 1 320px;
      min-width: 0;
      height: 38px;
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #dbe4ef;
      border-radius: 10px;
      padding: 0 10px 0 12px;
      transition: border-color 0.2s ease;
    }

    &:focus-within .search-main,
    &:focus-within .extra-filters {
      border-color: #bfdbfe;
    }

    .command-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
      }

      :deep(.el-input__wrapper.is-focus) {
        box-shadow: none !important;
      }

      :deep(.el-input__inner) {
        height: 36px;
        font-size: 13px;
        color: #0f172a;
        font-weight: 500;
      }
      :deep(.el-input__inner::placeholder) {
        color: #94a3b8;
        font-size: 13px;
        font-weight: 500;
      }
      :deep(.el-input__suffix) {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 18px;
      }
      :deep(.el-input__suffix-inner) {
        min-width: 18px;
      }
      .search-icon {
        color: #94a3b8;
        font-size: 15px;
      }
    }

    .inner-divider {
      display: none;
    }

    .extra-filters {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      height: 38px;
      min-width: 116px;
      padding: 0 12px;
      background: #ffffff;
      border: 1px solid #dbe4ef;
      border-radius: 10px;
      :deep(.el-select__wrapper) {
        box-shadow: none !important;
        background: transparent;
        font-size: 13px;
        color: #475569;
        padding: 0;
        height: 100%;
        min-height: 36px;
      }
      :deep(.el-select__wrapper.is-focused) {
        box-shadow: none !important;
      }
      :deep(.el-select__selected-item) {
        font-size: 13px;
        font-weight: 500;
        color: #334155;
      }
      :deep(.el-select__placeholder) {
        color: #64748b;
        font-weight: 500;
        font-size: 13px;
      }
      :deep(.el-select__caret) {
        color: #94a3b8;
      }
    }

    &.has-filters {
      .search-main,
      .extra-filters {
        border-color: #dbe4ef;
      }
    }
  }

  .search-reset {
    flex-shrink: 0;
    height: 30px;
    padding: 0 4px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
      color 0.2s ease,
      background-color 0.2s ease;

    &:hover {
      color: #3b82f6;
      background: transparent;
    }
  }

  .action-group {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: auto;
  }

  /* 批量激活态 */
  .header-batch-bar {
    position: absolute;
    inset: 0;
    padding: 0 18px;
    background: #ffffff;
    z-index: 5;
    .status-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #334155;
      .icon {
        color: #3b82f6;
        font-size: 16px;
      }
      .num {
        font-weight: 700;
        color: #1e293b;
      }
    }
    .batch-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      :deep(.el-button:not(.cancel-btn)) {
        height: 34px;
        padding: 0 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      :deep(.el-button--danger) {
        border-color: #ef4444;
        background: #ef4444;
        color: #ffffff;
      }

      :deep(.el-button--danger:hover) {
        border-color: #dc2626;
        background: #dc2626;
        color: #ffffff;
      }
    }
  }
}

/* 主体：数据行看板 */
.shelf-content {
  flex: 1;
  min-height: 140px;
}

.content-labels {
  display: flex;
  align-items: center;
  min-height: 44px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.7) 100%);
  border-bottom: 1px solid #f1f5f9;

  .label-check {
    width: 48px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .label-main {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 24px;
    font-size: 13px;
  }
}

.item-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.1s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f9fafb;
  }
  &.is-active {
    background: #f0f7ff;
  }

  .row-checkbox {
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .row-body {
    flex: 1;
    min-width: 0;
    padding: 0 24px;
  }
}

.empty-state {
  padding: 40px 0;
}

.loading-placeholder {
  min-height: 140px;
}

/* 页脚：极简分页 */
.shelf-footer {
  height: 44px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

@media (max-width: 960px) {
  .shelf-header {
    .header-main-bar {
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .toolbar-search {
      order: 3;
      width: 100%;
      justify-content: stretch;
      gap: 8px;
    }

    .command-search-wrap {
      flex: 1;
      min-width: 0;
      flex-wrap: wrap;
    }

    .search-main,
    .extra-filters {
      width: 100%;
    }

    .action-group {
      margin-left: 0;
    }
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
