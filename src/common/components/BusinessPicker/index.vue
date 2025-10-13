<template>
  <div class="business-picker-container" ref="containerRef" :class="`variant-${variant}`">
    <div class="business-picker-input" @click="togglePicker" :class="{ 'is-focus': showPicker }">
      <!-- 多选模式 -->
      <div v-if="props.multiple && selectedItems.length > 0" class="selected-items">
        <div v-for="item in selectedItems" :key="item.id" class="item-tag">
          <div class="item-icon" :style="{ background: generateItemColor(item.name || '') }">
            {{ item.name?.charAt(0) }}
          </div>
          <span class="item-name">{{ item.name }}</span>
          <button @click.stop="removeItem(item)" class="remove-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <!-- 单选模式 -->
      <div v-else-if="!props.multiple && selectedItem" class="selected-item">
        <div class="item-icon" :style="{ background: generateItemColor(selectedItem.name || '') }">
          {{ selectedItem.name?.charAt(0) }}
        </div>
        <span class="item-name">{{ selectedItem.name }}</span>
      </div>
      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ props.placeholder }}</div>
      <div class="picker-arrow" :class="{ 'is-open': showPicker }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中，避免被任何容器遮挡 -->
    <Teleport to="body">
      <div v-if="showPicker" class="business-picker-dropdown" :style="dropdownStyle" @click.stop>
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
              :placeholder="`搜索${getBusinessTypeLabel()}...`"
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
            <span>暂无{{ getBusinessTypeLabel() }}数据</span>
          </div>

          <div
            v-for="item in itemsData"
            :key="item.id"
            class="item"
            :class="{ 'is-selected': isItemSelected(item) }"
            @click="handleItemSelect(item)"
          >
            <div class="item-icon" :style="{ background: generateItemColor(item.name) }">
              {{ item.name?.charAt(0) }}
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div v-if="item.description" class="item-description">{{ item.description }}</div>
            </div>
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

<script lang="ts" setup>
import { watch, onMounted, onUnmounted, ref, computed, toRef } from "vue"
import { useBusinessPicker, BUSINESS_TYPES, type BusinessItem } from "@@/composables/useBusinessPicker"

const props = defineProps({
  businessType: {
    type: Number,
    required: true,
    validator: (value: number) => Object.values(BUSINESS_TYPES).includes(value as BUSINESS_TYPES)
  },
  placeholder: {
    type: String,
    default: "请选择"
  },
  multiple: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: "fancy",
    validator: (value: string) => ["fancy", "simple"].includes(value)
  }
})

const modelValue = defineModel<string | string[]>({ default: "" })

// 使用 composable
const {
  loading,
  itemsData,
  showPicker,
  searchKeyword,
  selectedItem,
  selectedItems,
  searchInputRef,
  paginationData,
  togglePicker,
  handleSearch,
  handleCurrentChange,
  handleClickOutside
} = useBusinessPicker(toRef(props, "businessType"))

// 容器引用
const containerRef = ref<HTMLElement>()

// 获取业务类型的中文标签
const getBusinessTypeLabel = () => {
  switch (props.businessType) {
    case BUSINESS_TYPES.WORKSPACE:
      return "工作空间"
    case BUSINESS_TYPES.WORKFLOW:
      return "工作流"
    default:
      return "项目"
  }
}

// 计算下拉菜单位置
const dropdownStyle = computed(() => {
  if (!containerRef.value || !showPicker.value) {
    return {}
  }

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

// 基于名称生成随机颜色
const generateItemColor = (name: string) => {
  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
    "#fa709a",
    "#fee140",
    "#a8edea",
    "#fed6e3",
    "#ffecd2",
    "#fcb69f",
    "#ff9a9e",
    "#a18cd1",
    "#fbc2eb",
    "#ffecd2"
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 判断项目是否被选中
const isItemSelected = (item: BusinessItem) => {
  if (props.multiple) {
    return selectedItems.value.some((i) => i.id === item.id)
  } else {
    return modelValue.value === item.id.toString()
  }
}

// 移除项目（多选模式）
const removeItem = (item: BusinessItem) => {
  const index = selectedItems.value.findIndex((i) => i.id === item.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
    const values = selectedItems.value.map((i) => i.id.toString())
    modelValue.value = values
  }
}

// 处理项目选择
const handleItemSelect = (item: BusinessItem) => {
  if (props.multiple) {
    const existingIndex = selectedItems.value.findIndex((i) => i.id === item.id)
    if (existingIndex > -1) {
      selectedItems.value.splice(existingIndex, 1)
    } else {
      selectedItems.value.push(item)
    }
    const values = selectedItems.value.map((i) => i.id.toString())
    modelValue.value = values
  } else {
    // 单选模式：直接设置值并关闭选择器
    modelValue.value = item.id.toString()
    showPicker.value = false
  }
}

// 监听业务类型变化，清空选中值
watch(
  () => props.businessType,
  () => {
    modelValue.value = ""
  }
)

// 同步选中状态
const syncSelectedState = (value: any) => {
  if (props.multiple) {
    selectedItems.value =
      Array.isArray(value) && value.length > 0
        ? itemsData.value.filter((item) => (value as string[]).includes(item.id.toString()))
        : []
  } else {
    selectedItem.value =
      value && typeof value === "string" ? itemsData.value.find((item) => item.id.toString() === value) || null : null
  }
}

// 监听 modelValue 变化，同步选中状态
watch(() => modelValue.value, syncSelectedState, { immediate: true })

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style lang="scss" scoped>
.business-picker-container {
  position: relative;
  width: 100%;
}

/* 默认 fancy 样式 */
.business-picker-input {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  min-height: 42px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 12px;
  padding: 0 16px;
}

.business-picker-input:hover {
  border-color: #667eea;
  background: #f1f5f9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.business-picker-input.is-focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* simple 变体样式 */
.business-picker-container.variant-simple .business-picker-input {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 32px;
  height: 32px;
  padding: 0 11px;
  box-shadow: none;
  gap: 6px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.business-picker-container.variant-simple .business-picker-input:hover {
  border-color: #c0c4cc;
  background: #ffffff;
  box-shadow: none;
}

.business-picker-container.variant-simple .business-picker-input.is-focus {
  border-color: #409eff;
  background: #ffffff;
  box-shadow: none;
  outline: none;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #667eea;
  color: #ffffff;
  border-radius: 50%;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.item-name {
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 400;
  flex: 1;
  text-align: center;
}

.picker-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #6b7280;
  transition: transform 0.3s ease;
}

.picker-arrow.is-open {
  transform: rotate(180deg);
}

.picker-arrow svg {
  width: 18px;
  height: 18px;
}

/* simple 变体的样式 */
.business-picker-container.variant-simple .item-icon {
  width: 16px;
  height: 16px;
  font-size: 10px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #606266;
  box-shadow: none;
  font-weight: normal;
}

.business-picker-container.variant-simple .item-name {
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.business-picker-container.variant-simple .placeholder-text {
  font-size: 14px;
  color: #c0c4cc;
  text-align: left;
}

.business-picker-container.variant-simple .picker-arrow {
  width: 16px;
  height: 16px;
  color: #c0c4cc;
}

.business-picker-container.variant-simple .picker-arrow svg {
  width: 12px;
  height: 12px;
}

.business-picker-dropdown {
  position: fixed;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 400px;
}

.search-section {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
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
  max-height: 320px;
  overflow-y: auto;
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
}

.selected-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #667eea;
}

.selected-indicator svg {
  width: 18px;
  height: 18px;
}

.pagination-section {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}

/* 多选模式样式 */
.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1;
  min-height: 24px;
}

.item-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  max-width: 200px;
}

.item-tag .item-icon {
  width: 20px;
  height: 20px;
  font-size: 10px;
  box-shadow: none;
}

.item-tag .item-name {
  color: white;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border: 1px solid #ef4444;
  border-radius: 50%;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.remove-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
}

.remove-btn svg {
  width: 12px;
  height: 12px;
}

/* simple 变体的多选模式样式 */
.business-picker-container.variant-simple .selected-items {
  gap: 4px;
  min-height: 20px;
}

.business-picker-container.variant-simple .item-tag {
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  height: 24px;
  line-height: 22px;
  background: #f0f2f5;
  border: 1px solid #e4e7ed;
  color: #606266;
  display: inline-flex;
  align-items: center;
  margin: 2px 0;
}

.business-picker-container.variant-simple .item-tag .item-icon {
  width: 14px;
  height: 14px;
  font-size: 8px;
  margin-right: 4px;
  background: #f5f7fa;
  color: #606266;
}

.business-picker-container.variant-simple .item-tag .item-name {
  font-size: 12px;
  margin: 0;
  color: #606266;
}

.business-picker-container.variant-simple .remove-btn {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  color: #c0c4cc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
}

.business-picker-container.variant-simple .remove-btn:hover {
  background: #c0c4cc;
  color: #ffffff;
  border: none;
  box-shadow: none;
}

.business-picker-container.variant-simple .remove-btn svg {
  width: 8px;
  height: 8px;
}
</style>
