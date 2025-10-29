<template>
  <div class="search-selector-container" :class="`variant-${variant}`">
    <div
      class="search-selector-input"
      ref="containerRef"
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

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中，避免被任何容器遮挡 -->
    <Teleport to="body">
      <div v-if="showPicker && !props.disabled" ref="dropdownRef" class="search-selector-dropdown" @click.stop>
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
import { createPopper, type Instance as PopperInstance } from "@popperjs/core"
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
const dropdownRef = ref<HTMLElement>()
const popperInstance = ref<PopperInstance | null>(null)

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
    // 创建 Popper 实例
    if (containerRef.value && dropdownRef.value) {
      // 设置下拉菜单宽度与输入框相同
      const width = containerRef.value.offsetWidth
      if (dropdownRef.value) {
        dropdownRef.value.style.width = `${width}px`
      }

      popperInstance.value = createPopper(containerRef.value, dropdownRef.value, {
        placement: "bottom-start",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 8]
            }
          },
          {
            name: "preventOverflow",
            options: {
              padding: 8
            }
          },
          {
            name: "flip",
            options: {
              fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"]
            }
          }
        ]
      })
    }
    searchInputRef.value?.focus()
    paginationData.currentPage = 1
    loadItems()
  } else {
    // 销毁 Popper 实例
    if (popperInstance.value) {
      popperInstance.value.destroy()
      popperInstance.value = null
    }
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

// 监听窗口大小变化和滚动
const handleResize = () => {
  if (popperInstance.value) {
    popperInstance.value.update()
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
  window.removeEventListener("resize", handleResize)
  if (popperInstance.value) {
    popperInstance.value.destroy()
    popperInstance.value = null
  }
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
  padding: 0 11px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

  &:hover:not(.is-disabled) {
    border-color: #c0c4cc;
  }

  &.is-focus {
    border-color: #409eff;
    outline: none;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background: #f5f7fa;
    border-color: #e4e7ed;
  }
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  height: 100%;
  line-height: 32px;

  .item-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-weight: 500;
    font-size: 12px;
    color: #ffffff;
  }

  .item-name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 400;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.placeholder-text {
  font-size: 14px;
  color: #c0c4cc;
  line-height: 32px;
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
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 274px;
  z-index: 9999;
}

.search-section {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background: #ffffff;
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  border-color: #409eff;
  outline: none;
}

.search-input::placeholder {
  color: #c0c4cc;
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
  padding: 32px 24px;
  color: #909399;
  gap: 12px;
}

.empty-state svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.empty-state span {
  font-size: 14px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
}

.item:hover {
  background: #f5f7fa;
}

.item.is-selected {
  background: #ecf5ff;
  color: #409eff;
}

.item:last-child {
  border-bottom: none;
}

.item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info .item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.item-description {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
  margin-bottom: 4px;
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
  padding: 8px 12px;
  border-top: 1px solid #e4e7ed;
  background: #ffffff;
  display: flex;
  justify-content: center;
}
</style>
