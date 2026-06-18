<template>
  <div
    class="generic-picker-container"
    ref="containerRef"
    :class="[`variant-${variant}`, multiple ? 'is-multiple' : 'is-single', containerClass]"
  >
    <div class="picker-input-box" @click="toggleDropdown" :class="{ 'is-focus': showDropdown }">
      <!-- 多选模式下的标签显示区 -->
      <div v-if="multiple && selectedItems.length > 0" class="selected-tags">
        <div v-for="item in selectedItems" :key="String(item[keyField])" class="picker-tag">
          <!-- 默认插槽渲染 tag 自定义内容，兜底只渲染 label/key -->
          <slot name="tag" :item="item">
            <span class="tag-text">{{ (item[labelField] as string) || (item[keyField] as string) }}</span>
          </slot>
          <button @click.stop="removeItem(item)" class="remove-btn" type="button" title="移除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <!-- 单选模式下的文本显示区 -->
      <div v-else-if="!multiple && selectedItem" class="selected-single">
        <slot name="single" :item="selectedItem">
          <span class="single-text">{{
            (selectedItem[labelField] as string) || (selectedItem[keyField] as string)
          }}</span>
        </slot>
      </div>
      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ placeholder }}</div>
      <div class="picker-arrow" :class="{ 'is-open': showDropdown }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown Panel -->
    <Teleport to="body">
      <div v-if="showDropdown" class="picker-dropdown-panel" :class="dropdownClass" :style="dropdownStyle" @click.stop>
        <div class="search-section" @click.stop>
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="searchKeyword"
              @input="handleSearch"
              @click.stop
              :placeholder="searchPlaceholder"
              class="search-input"
              ref="searchInputRef"
            />
          </div>
        </div>

        <div class="items-list" v-loading="showLoading && loading">
          <div v-if="listData.length === 0 && !loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>暂无匹配数据</span>
          </div>

          <div
            v-for="item in listData"
            :key="String(item[keyField])"
            class="list-item"
            :class="{ 'is-selected': isItemSelected(item) }"
            @click="handleSelect(item)"
          >
            <slot name="item" :item="item" :is-selected="isItemSelected(item)">
              <div class="default-item-content">
                <div class="item-label">{{ item[labelField] }}</div>
                <div class="item-key">{{ item[keyField] }}</div>
              </div>
            </slot>
            <div v-if="isItemSelected(item)" class="selected-indicator">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div v-if="showPagination && paginationData.total > paginationData.pageSize" class="pagination-section">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            @current-change="handlePageChange"
            small
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts" generic="T, K extends string | number">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { useGenericPicker } from "../../composables/useGenericPicker"

interface IGenericPickerProps {
  placeholder?: string
  searchPlaceholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  // API 属性与辅助函数
  searchApi: (params: { keyword: string; offset: number; limit: number }) => Promise<{ total: number; data: T[] }>
  resolveApi: (key: K) => Promise<T | null>
  keyField: keyof T
  labelField: keyof T
  fallbackBuilder: (key: K) => T
  containerClass?: string
  dropdownClass?: string
  pageSize?: number
  showPagination?: boolean
  showLoading?: boolean
}

const props = withDefaults(defineProps<IGenericPickerProps>(), {
  placeholder: "请选择",
  searchPlaceholder: "搜索...",
  multiple: false,
  variant: "fancy",
  pageSize: 3,
  showPagination: true,
  showLoading: false
})

// NOTE: 该组件为纯通用 UI 选择控制组件，通过 v-model 将选中的主键绑定同步给外部父组件
const model = defineModel<K | K[]>()

const containerRef = ref<HTMLElement>()

const {
  loading,
  listData,
  showDropdown,
  searchKeyword,
  selectedItems,
  selectedItem,
  paginationData,
  toggleDropdown,
  closeDropdown,
  handleSearch,
  handlePageChange,
  resolveDetail
} = useGenericPicker<T, K>({
  searchApi: props.searchApi,
  resolveApi: props.resolveApi,
  keyField: props.keyField,
  pageSize: props.pageSize
})

// 下拉菜单定位样式计算
const dropdownStyle = computed(() => {
  if (!containerRef.value || !showDropdown.value) return {}
  const rect = containerRef.value.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  return {
    position: "fixed" as const,
    top: `${rect.bottom + scrollTop + 8}px`,
    left: `${rect.left + scrollLeft}px`,
    width: `${rect.width}px`,
    zIndex: 9999
  }
})

/**
 * 判断列表项是否已被选中
 * @param item 列表项
 */
const isItemSelected = (item: T): boolean => {
  const currentKey = item[props.keyField] as unknown as K
  if (props.multiple) {
    if (Array.isArray(model.value)) {
      return (model.value as K[]).includes(currentKey)
    }
    return false
  }
  return model.value === currentKey
}

/**
 * 从已选中列表移除指定项（仅限多选模式）
 * @param item 要移除的项
 */
const removeItem = (item: T) => {
  const currentKey = item[props.keyField] as unknown as K
  if (props.multiple && Array.isArray(model.value)) {
    model.value = (model.value as K[]).filter((key) => key !== currentKey)
  }
}

/**
 * 选中或取消选中当前项
 * @param item 当前点击的项
 */
const handleSelect = (item: T) => {
  const currentKey = item[props.keyField] as unknown as K
  if (props.multiple) {
    const currentModel = Array.isArray(model.value) ? (model.value as K[]) : []
    if (currentModel.includes(currentKey)) {
      model.value = currentModel.filter((key) => key !== currentKey)
    } else {
      model.value = [...currentModel, currentKey]
    }
  } else {
    selectedItem.value = item
    model.value = currentKey
    closeDropdown()
  }
}

// 监听绑定的 model 值，通过 resolveDetail 进行增量解析并反写详情对象
watch(
  () => model.value,
  async (newValue) => {
    if (props.multiple) {
      if (Array.isArray(newValue) && newValue.length > 0) {
        const resolved: T[] = []
        for (const key of newValue) {
          const item = await resolveDetail(key, props.fallbackBuilder)
          resolved.push(item)
        }
        selectedItems.value = resolved
      } else {
        selectedItems.value = []
      }
    } else {
      if (newValue !== undefined && newValue !== null && newValue !== "") {
        const item = await resolveDetail(newValue as K, props.fallbackBuilder)
        selectedItem.value = item
      } else {
        selectedItem.value = null
      }
    }
  },
  { immediate: true }
)

const handleClickOutside = (event: Event) => {
  if (showDropdown.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style lang="scss" scoped>
.generic-picker-container {
  position: relative;
  width: 100%;
}

/* 默认 fancy 风格输入框 */
.picker-input-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  min-height: 42px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 4px 12px;
  gap: 12px;
}

.picker-input-box:hover {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.picker-input-box.is-focus {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.06);
}

/* simple 风格输入框（类似 el-select 原生风格） */
.generic-picker-container.variant-simple .picker-input-box {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 32px;
  padding: 0 12px;
  box-shadow: none;
  gap: 6px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.generic-picker-container.variant-simple .picker-input-box:hover {
  border-color: #c0c4cc;
  background: #ffffff;
  box-shadow: none;
}

.generic-picker-container.variant-simple .picker-input-box.is-focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 1px #3b82f6 inset;
  outline: none;
}

/* 当父级 el-form-item 校验失败时，将边框变红以配合 element plus 整体校验视觉 */
:global(.is-error) .generic-picker-container.variant-simple .picker-input-box {
  border-color: #f56c6c;
}

:global(.is-error) .generic-picker-container.variant-simple .picker-input-box.is-focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px #f56c6c inset;
}

.selected-single {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.single-text {
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 400;
  flex: 1;
}

.picker-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #94a3b8;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.picker-arrow.is-open {
  transform: rotate(180deg);
}

.picker-arrow svg {
  width: 16px;
  height: 16px;
}

/* simple 变体的文字与占位符样式 */
.generic-picker-container.variant-simple .selected-single {
  gap: 6px;
}

.generic-picker-container.variant-simple .single-text {
  font-size: 13px;
  color: #606266;
  font-weight: normal;
}

.generic-picker-container.variant-simple .placeholder-text {
  font-size: 13px;
  color: #c0c4cc;
}

.generic-picker-container.variant-simple .picker-arrow {
  color: #c0c4cc;
}

.generic-picker-container.variant-simple .picker-arrow svg {
  width: 12px;
  height: 12px;
}

/* element 风格输入框：用于需要和 Element Plus 表单控件完全对齐的场景 */
.generic-picker-container.variant-element .picker-input-box {
  min-height: 40px;
  padding: 0 11px;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: none;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.generic-picker-container.variant-element .picker-input-box:hover {
  background: #ffffff;
  border-color: #c0c4cc;
  box-shadow: none;
}

.generic-picker-container.variant-element .picker-input-box.is-focus {
  background: #ffffff;
  border-color: #dcdfe6;
  box-shadow: none;
}

.generic-picker-container.variant-element .selected-single {
  gap: 0;
}

.generic-picker-container.variant-element .single-text,
.generic-picker-container.variant-element .placeholder-text {
  font-size: 14px;
  font-weight: 400;
}

.generic-picker-container.variant-element .single-text {
  color: #606266;
}

.generic-picker-container.variant-element .placeholder-text {
  color: #a8abb2;
}

.generic-picker-container.variant-element .picker-arrow {
  color: #a8abb2;
}

.generic-picker-container.variant-element .picker-arrow svg {
  width: 14px;
  height: 14px;
}

/* Dropdown Panel 样式 */
.picker-dropdown-panel {
  position: fixed;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  max-height: 380px;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #ffffff;
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.06);
}

.search-input::placeholder {
  color: #94a3b8;
}

.items-list {
  max-height: 240px;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #94a3b8;
  gap: 12px;
}

.empty-state svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.empty-state span {
  font-size: 13px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:hover {
  background: #f8fafc;
}

.list-item.is-selected {
  background: rgba(59, 130, 246, 0.04);
}

.list-item:last-child {
  border-bottom: none;
}

.default-item-content {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.item-key {
  font-size: 11px;
  color: #64748b;
}

.selected-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #3b82f6;
  flex-shrink: 0;
}

.selected-indicator svg {
  width: 16px;
  height: 16px;
}

.pagination-section {
  padding: 8px 16px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}

/* 多选模式的标签容器样式 */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex: 1;
  min-height: 24px;
}

.picker-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 2px 4px 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  max-width: 180px;
  height: 24px;
}

.picker-tag .tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: transparent;
  border: none;
  color: #f56c6c;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
  border-radius: 50%;
  padding: 0;
}

.remove-btn:hover {
  color: #dd2f2f;
  background: transparent;
}

.remove-btn svg {
  width: 10px;
  height: 10px;
}

/* simple 变体的标签样式 */
.generic-picker-container.variant-simple .picker-tag {
  padding: 0 4px 0 8px;
  border-radius: 4px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  height: 24px;
  margin: 1px 0;
}

.generic-picker-container.variant-simple .remove-btn {
  background: transparent;
  color: #f56c6c;
}

.generic-picker-container.variant-simple .remove-btn:hover {
  background: transparent;
  color: #dd2f2f;
}
</style>
