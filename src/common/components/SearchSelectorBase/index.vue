<template>
  <div class="search-selector-container" ref="containerRef" :class="`variant-${variant}`">
    <div
      class="search-selector-input"
      @click="!props.disabled && togglePicker()"
      :class="{ 'is-focus': showPicker, 'is-disabled': props.disabled }"
    >
      <!-- 已选择项 -->
      <div v-if="selectedItem" class="selected-item">
        <div class="item-icon" :style="{ background: generateItemColor(selectedItem[itemNameField]) }">
          {{ selectedItem[itemNameField]?.charAt(0) }}
        </div>
        <span class="item-name">{{ selectedItem[itemNameField] }}</span>
      </div>
      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ props.placeholder }}</div>
      <!-- 清除按钮 -->
      <div v-if="selectedItem && !props.disabled" class="clear-btn" @click.stop="handleClear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div class="picker-arrow" :class="{ 'is-open': showPicker }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中 -->
    <Teleport to="body">
      <div v-if="showPicker && !props.disabled" class="search-selector-dropdown" :style="dropdownStyle" @click.stop>
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

        <div class="items-list" v-loading="loading">
          <div v-if="itemsData.length === 0 && !loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ emptyText }}</span>
          </div>

          <div
            v-for="item in itemsData"
            :key="item[idField]"
            class="item"
            :class="{ 'is-selected': isItemSelected(item) }"
            @click="handleItemSelect(item)"
          >
            <!-- 图标 -->
            <div class="item-icon" :style="{ background: generateItemColor(item[itemNameField]) }">
              {{ item[itemNameField]?.charAt(0) }}
            </div>

            <!-- 信息区域 -->
            <div class="item-info">
              <div class="item-name">{{ item[itemNameField] }}</div>

              <!-- 描述插槽 -->
              <div v-if="item[itemDescriptionField]" class="item-description">
                <slot name="description" :item="item">{{ item[itemDescriptionField] }}</slot>
              </div>

              <!-- 元数据插槽 -->
              <div class="item-meta">
                <slot name="meta" :item="item">
                  <!-- 默认显示可选字段 -->
                  <el-tag v-if="showIdTag" size="small">ID: {{ item[idField] }}</el-tag>
                </slot>
              </div>
            </div>

            <!-- 选中指示器 -->
            <div v-if="isItemSelected(item)" class="selected-indicator">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div v-if="paginationData.total > paginationData.pageSize" class="pagination-section">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            @current-change="handleCurrentChange"
            small
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"

interface Props {
  modelValue?: number // 选中的ID
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
  // 数据加载函数
  loadData: (params: any) => Promise<any>
  // 字段配置
  idField?: string
  itemNameField?: string
  itemDescriptionField?: string
  // 搜索配置
  searchPlaceholder?: string
  emptyText?: string
  // 分页配置
  pageSize?: number
  // 额外显示配置
  showIdTag?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择",
  disabled: false,
  variant: "fancy",
  idField: "id",
  itemNameField: "name",
  itemDescriptionField: "description",
  searchPlaceholder: "搜索...",
  emptyText: "未找到匹配的项",
  pageSize: 20,
  showIdTag: false
})

const emit = defineEmits<{
  "update:modelValue": [value: number]
}>()

// 响应式数据
const showPicker = ref(false)
const searchKeyword = ref("")
const itemsData = ref<any[]>([])
const loading = ref(false)
const containerRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

// 下拉菜单固定高度
const DROPDOWN_HEIGHT = 400

// 计算下拉菜单位置
const dropdownStyle = computed(() => {
  if (!containerRef.value) return {}
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  // 计算可用的最大高度
  const maxAvailableHeight = Math.max(spaceBelow, spaceAbove) - 20

  // 决定向上还是向下展开
  const shouldExpandUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

  // 下拉菜单的总高度
  const totalDropdownHeight = Math.min(maxAvailableHeight, DROPDOWN_HEIGHT)
  const maxHeight = totalDropdownHeight

  let top: string
  if (shouldExpandUpward) {
    // 向上展开
    top = `${rect.top - Math.min(maxHeight, DROPDOWN_HEIGHT) - 8}px`
  } else {
    // 向下展开
    top = `${rect.bottom + 8}px`
  }

  return {
    position: "fixed" as const,
    top,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: 9999
  }
})

// 分页配置
const initPagination = {
  currentPage: 1,
  pageSize: props.pageSize,
  layout: "prev, pager, next"
}

const { paginationData, handleCurrentChange } = usePagination(initPagination)

// 选中的项
const selectedItem = computed(() => {
  if (!props.modelValue) return null
  return itemsData.value.find((item) => item[props.idField] === props.modelValue)
})

// 生成颜色
const generateItemColor = (name: string) => {
  const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

// 加载数据
const loadItems = async () => {
  try {
    loading.value = true
    const keyword = searchKeyword.value.trim()

    const params = {
      keyword,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    const response = await props.loadData(params)

    // 处理响应数据
    if (response.data) {
      itemsData.value =
        response.data.items || response.data.templates || response.data.rules || response.data.list || []
      paginationData.total = response.data.total || 0
    }
  } catch (error) {
    console.error("加载数据失败:", error)
    itemsData.value = []
  } finally {
    loading.value = false
  }
}

// 切换选择器显示
const togglePicker = async () => {
  showPicker.value = !showPicker.value
  if (showPicker.value) {
    await nextTick()
    searchInputRef.value?.focus()
    paginationData.currentPage = 1
    loadItems()
  }
}

// 检查项是否被选中
const isItemSelected = (item: any) => {
  return item[props.idField] === props.modelValue
}

// 处理项选择
const handleItemSelect = (item: any) => {
  emit("update:modelValue", item[props.idField])
  showPicker.value = false
}

// 处理清除选择
const handleClear = (e: Event) => {
  e.stopPropagation()
  emit("update:modelValue", 0)
}

// 搜索
const handleSearch = () => {
  paginationData.currentPage = 1
  loadItems()
}

// 监听分页变化
watch([() => paginationData.currentPage], () => {
  if (showPicker.value) {
    loadItems()
  }
})

// 点击外部关闭
const handleClickOutside = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest(".search-selector-container")) {
    showPicker.value = false
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
.search-selector-container {
  position: relative;
  width: 100%;

  &.variant-simple {
    .search-selector-input {
      padding: 8px 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
  }
}

.search-selector-input {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(.is-disabled) {
    border-color: #cbd5e1;
  }

  &.is-focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background: #f3f4f6;
  }
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;

  .item-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    color: #ffffff;
  }

  .item-name {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 500;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.placeholder-text {
  font-size: 15px;
  color: #9ca3af;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 8px;

  &:hover {
    color: #ef4444;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.picker-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  &.is-open {
    transform: rotate(180deg);
  }

  svg {
    width: 20px;
    height: 20px;
    color: #c0c4cc;
  }
}

.search-selector-container.variant-simple .picker-arrow svg {
  width: 12px;
  height: 12px;
}

.search-selector-dropdown {
  position: fixed;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #6b7280;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #6b7280;
}

.items-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
  gap: 16px;
}

.empty-state svg {
  width: 56px;
  height: 56px;
  opacity: 0.5;
}

.empty-state span {
  font-size: 15px;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e5e7eb;
}

.item:hover {
  background: #f1f5f9;
}

.item.is-selected {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.2);
}

.item:last-child {
  border-bottom: none;
}

.item-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 600;
  font-size: 18px;
  color: #ffffff;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info .item-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.item-description {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.selected-indicator {
  width: 24px;
  height: 24px;
  color: #667eea;
  flex-shrink: 0;
}

.selected-indicator svg {
  width: 100%;
  height: 100%;
}

.pagination-section {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}
</style>
