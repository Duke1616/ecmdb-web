<template>
  <div class="search-selector-container" :class="[`variant-${variant}`, { 'is-multiple': props.multiple }]">
    <div
      class="search-selector-input"
      ref="containerRef"
      @click="!props.disabled && togglePicker()"
      :class="{ 'is-focus': showPicker, 'is-disabled': props.disabled, 'has-value': hasValue }"
    >
      <!-- 多选模式：展示标签 -->
      <div v-if="props.multiple && selectedItems.length > 0" class="selected-items">
        <div v-for="item in selectedItems" :key="item[idField]" class="item-tag">
          <div class="item-icon" :style="{ background: generateItemColor(item[itemNameField] || '') }">
            {{ item[itemNameField]?.charAt(0) }}
          </div>
          <span class="item-name">{{ item[itemNameField] }}</span>
          <button v-if="!props.disabled" @click.stop="removeItem(item)" class="remove-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 单选模式：展示选中项 -->
      <div v-else-if="!props.multiple && selectedItem" class="selected-item">
        <div class="item-icon" :style="{ background: generateItemColor(selectedItem[itemNameField]) }">
          {{ selectedItem[itemNameField]?.charAt(0) }}
        </div>
        <span class="item-name">{{ selectedItem[itemNameField] }}</span>
      </div>

      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ props.placeholder }}</div>

      <!-- 操作区域 -->
      <div class="input-actions">
        <!-- 清除按钮 (单选且有值时) -->
        <div v-if="!props.multiple && selectedItem && !props.disabled" class="clear-btn" @click.stop="handleClear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <!-- 箭头 -->
        <div class="picker-arrow" :class="{ 'is-open': showPicker }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中 -->
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
  modelValue?: number | string | (number | string)[]
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  variant?: "fancy" | "simple"
  // 数据加载函数
  loadData: (params: any) => Promise<any>
  // 获取单个项详情函数 (用于回显)
  getItemById?: (id: number | string) => Promise<any>
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
  multiple: false,
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
  "update:modelValue": [value: any]
}>()

// 响应式状态
const showPicker = ref(false)
const searchKeyword = ref("")
const itemsData = ref<any[]>([])
const loading = ref(false)
const containerRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const dropdownRef = ref<HTMLElement>()
const popperInstance = ref<PopperInstance | null>(null)

// 多选缓存：存储已选中的完整对象
const selectedItemsMap = ref(new Map<string | number, any>())

// 分页配置
const { paginationData, handleCurrentChange } = usePagination({
  currentPage: 1,
  pageSize: props.pageSize,
  layout: "prev, pager, next"
})

// 计算属性：是否有值
const hasValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0
  }
  return (
    props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== "" && props.modelValue !== 0
  )
})

// 计算属性：单选选中的项
const selectedItem = computed(() => {
  if (props.multiple) return null
  if (!props.modelValue) return null
  // 优先从当前页查找
  const found = itemsData.value.find((item) => item[props.idField] === props.modelValue)
  if (found) return found
  // 如果没找到，返回缓存中的
  return selectedItemsMap.value.get(props.modelValue as string | number)
})

// 计算属性：多选选中的项列表
const selectedItems = computed(() => {
  if (!props.multiple) return []
  const values = Array.isArray(props.modelValue) ? props.modelValue : []
  return values.map((val) => selectedItemsMap.value.get(val) || { [props.idField]: val, [props.itemNameField]: val })
})

// 生成颜色
const generateItemColor = (name: string) => {
  const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
  const hash = String(name || "")
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

// 加载数据
const loadItems = async () => {
  try {
    loading.value = true
    const params = {
      keyword: searchKeyword.value.trim(),
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }
    const response = await props.loadData(params)
    if (response.data) {
      const list =
        response.data.roles ||
        response.data.items ||
        response.data.templates ||
        response.data.rules ||
        response.data.codebooks ||
        response.data.runners ||
        response.data.list ||
        []
      itemsData.value = list
      paginationData.total = response.data.total || 0

      // 更新缓存
      list.forEach((item: any) => {
        selectedItemsMap.value.set(item[props.idField], item)
      })
    }
  } catch (error) {
    console.error("SearchSelector load error:", error)
    itemsData.value = []
  } finally {
    loading.value = false
  }
}

// 切换显示
const togglePicker = async () => {
  showPicker.value = !showPicker.value
  if (showPicker.value) {
    await nextTick()
    if (containerRef.value && dropdownRef.value) {
      dropdownRef.value.style.width = `${containerRef.value.offsetWidth}px`
      popperInstance.value = createPopper(containerRef.value, dropdownRef.value, {
        placement: "bottom-start",
        modifiers: [{ name: "offset", options: { offset: [0, 8] } }]
      })
    }
    searchInputRef.value?.focus()
    paginationData.currentPage = 1
    loadItems()
  } else if (popperInstance.value) {
    popperInstance.value.destroy()
    popperInstance.value = null
  }
}

// 检查是否选中
const isItemSelected = (item: any) => {
  const id = item[props.idField]
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(id)
  }
  return id === props.modelValue
}

// 处理项选择
const handleItemSelect = (item: any) => {
  const id = item[props.idField]
  selectedItemsMap.value.set(id, item)

  if (props.multiple) {
    const values = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = values.indexOf(id)
    if (idx > -1) {
      values.splice(idx, 1)
    } else {
      values.push(id)
    }
    emit("update:modelValue", values)
  } else {
    emit("update:modelValue", id)
    showPicker.value = false
  }
}

// 移除项 (多选)
const removeItem = (item: any) => {
  const id = item[props.idField]
  if (Array.isArray(props.modelValue)) {
    const values = props.modelValue.filter((v) => v !== id)
    emit("update:modelValue", values)
  }
}

// 清除选择 (单选)
const handleClear = (e: Event) => {
  e.stopPropagation()
  emit("update:modelValue", props.idField === "id" ? 0 : "")
}

// 搜索
const handleSearch = () => {
  paginationData.currentPage = 1
  loadItems()
}

// 监听分页
watch(
  () => paginationData.currentPage,
  () => {
    if (showPicker.value) loadItems()
  }
)

// 点击外部关闭
const handleClickOutside = (e: Event) => {
  if (!showPicker.value) return
  const target = e.target as HTMLElement
  if (containerRef.value?.contains(target) || dropdownRef.value?.contains(target)) return
  showPicker.value = false
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside, true)
  popperInstance.value?.destroy()
})
</script>

<style lang="scss" scoped>
.search-selector-container {
  position: relative;
  width: 100%;
}

.search-selector-input {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 11px;
  min-height: 32px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;

  &:hover:not(.is-disabled) {
    border-color: #c0c4cc;
  }

  &.is-focus {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }

  &.is-disabled {
    cursor: not-allowed;
    background: #f5f7fa;
    opacity: 0.7;
  }
}

/* 多选标签样式 */
.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
  flex: 1;
}

.item-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  max-width: 150px;

  .item-icon {
    width: 16px;
    height: 16px;
    font-size: 10px;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-name {
    font-size: 12px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    color: #c0c4cc;
    display: flex;
    align-items: center;

    &:hover {
      color: #f56c6c;
    }

    svg {
      width: 12px;
      height: 12px;
    }
  }
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .item-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .item-name {
    font-size: 14px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.placeholder-text {
  font-size: 14px;
  color: #c0c4cc;
  flex: 1;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.clear-btn,
.picker-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  width: 16px;
  height: 16px;

  svg {
    width: 14px;
    height: 14px;
  }
}

.clear-btn:hover {
  color: #909399;
}

.picker-arrow {
  transition: transform 0.3s;
  &.is-open {
    transform: rotate(180deg);
  }
}

/* 下拉菜单样式 */
.search-selector-dropdown {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 300px;
  z-index: 9999;
}

.search-section {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 10px;
    width: 14px;
    color: #c0c4cc;
  }

  .search-input {
    width: 100%;
    padding: 6px 10px 6px 30px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: #409eff;
    }
  }
}

.items-list {
  flex: 1;
  overflow-y: auto;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }

  &.is-selected {
    color: #409eff;
    background: #f0f7ff;
  }

  .item-icon {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-name {
      font-size: 14px;
      font-weight: 500;
    }

    .item-description {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

.pagination-section {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

/* Variant: Fancy */
.variant-fancy.is-multiple {
  .search-selector-input {
    border-radius: 8px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    min-height: 40px;

    &.is-focus {
      background: #fff;
      border-color: #3b82f6;
    }
  }
}
</style>
