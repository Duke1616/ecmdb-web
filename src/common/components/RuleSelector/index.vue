<template>
  <div class="rule-selector-container" ref="containerRef" :class="`variant-${variant}`">
    <div
      class="rule-selector-input"
      @click="!props.disabled && togglePicker()"
      :class="{ 'is-focus': showPicker, 'is-disabled': props.disabled }"
    >
      <!-- 已选择规则 -->
      <div v-if="selectedRule" class="selected-item">
        <div class="item-icon" :style="{ background: generateItemColor(selectedRule.name) }">
          {{ selectedRule.name?.charAt(0) }}
        </div>
        <span class="item-name">{{ selectedRule.name }}</span>
      </div>
      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ props.placeholder }}</div>
      <div class="picker-arrow" :class="{ 'is-open': showPicker }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中 -->
    <Teleport to="body">
      <div v-if="showPicker && !props.disabled" class="rule-selector-dropdown" :style="dropdownStyle" @click.stop>
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
              placeholder="搜索告警规则..."
              class="search-input"
              ref="searchInputRef"
            />
          </div>
        </div>

        <div class="items-list" v-loading="loading">
          <div v-if="rulesData.length === 0 && !loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>未找到匹配的规则</span>
          </div>

          <div
            v-for="rule in rulesData"
            :key="rule.id"
            class="item"
            :class="{ 'is-selected': isRuleSelected(rule) }"
            @click="handleRuleSelect(rule)"
          >
            <div class="item-icon" :style="{ background: generateItemColor(rule.name) }">
              {{ rule.name?.charAt(0) }}
            </div>
            <div class="item-info">
              <div class="item-name">{{ rule.name }}</div>
              <div v-if="rule.description" class="item-description">{{ rule.description }}</div>
              <div class="item-meta">
                <el-tag :type="getLevelTagType(rule.level)" size="small">
                  {{ getLevelPriority(rule.level) }}
                </el-tag>
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small">
                  {{ rule.enabled ? "已启用" : "已禁用" }}
                </el-tag>
              </div>
            </div>
            <div v-if="isRuleSelected(rule)" class="selected-indicator">
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
import { listRulesByKeywordApi } from "@/api/alert/rule"
import type { Rule } from "@/api/alert/rule/types/rule"
import { usePagination } from "@/common/composables/usePagination"

interface Props {
  modelValue?: number // 选中的规则ID
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择告警规则",
  disabled: false,
  variant: "fancy"
})

const emit = defineEmits<{
  "update:modelValue": [value: number]
}>()

// 响应式数据
const showPicker = ref(false)
const searchKeyword = ref("")
const rulesData = ref<Rule[]>([])
const loading = ref(false)
const containerRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

// 计算下拉菜单位置
const dropdownStyle = computed(() => {
  if (!containerRef.value) return {}
  const rect = containerRef.value.getBoundingClientRect()
  return {
    position: "fixed" as const,
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 9999
  }
})

// 分页配置
const initPagination = {
  currentPage: 1,
  pageSize: 20,
  layout: "prev, pager, next"
}

const { paginationData, handleCurrentChange } = usePagination(initPagination)

// 选中的规则
const selectedRule = computed(() => {
  if (!props.modelValue) return null
  return rulesData.value.find((rule) => rule.id === props.modelValue)
})

// 生成颜色
const generateItemColor = (name: string) => {
  const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

// 获取告警级别优先级
const getLevelPriority = (level: number) => {
  const levels = ["", "P0", "P1", "P2", "P3", "P4"]
  return levels[level] || ""
}

// 获取告警级别标签类型
const getLevelTagType = (level: number) => {
  switch (level) {
    case 1:
    case 2:
      return "danger"
    case 3:
      return "warning"
    case 4:
    case 5:
      return "info"
    default:
      return "info"
  }
}

// 加载规则列表
const loadRules = async () => {
  try {
    loading.value = true
    const keyword = searchKeyword.value.trim()

    const params: any = {
      keyword, // 允许为空字符串
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    const { data } = await listRulesByKeywordApi(params)
    rulesData.value = data.rules || []
    paginationData.total = data.total || 0
  } catch (error) {
    console.error("加载规则列表失败:", error)
    rulesData.value = []
  } finally {
    loading.value = false
  }
}

// 切换选择器显示
const togglePicker = async () => {
  console.log("togglePicker called, current showPicker:", showPicker.value)
  showPicker.value = !showPicker.value
  console.log("after toggle, showPicker:", showPicker.value)
  if (showPicker.value) {
    await nextTick()
    searchInputRef.value?.focus()
    paginationData.currentPage = 1
    // 打开时立即加载数据
    loadRules()
  }
}

// 检查规则是否被选中
const isRuleSelected = (rule: Rule) => {
  return rule.id === props.modelValue
}

// 处理规则选择
const handleRuleSelect = (rule: Rule) => {
  emit("update:modelValue", rule.id)
  showPicker.value = false
}

// 搜索
const searchTimer: NodeJS.Timeout | null = null
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  // 立即加载，不等待
  paginationData.currentPage = 1
  loadRules()
}

// 监听分页变化
watch([() => paginationData.currentPage], () => {
  if (showPicker.value) {
    loadRules()
  }
})

// 点击外部关闭
const handleClickOutside = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest(".rule-selector-container")) {
    showPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  // 由于使用 computed，不需要手动更新位置
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style lang="scss" scoped>
.rule-selector-container {
  position: relative;
  width: 100%;
}

/* 默认 fancy 样式 */
.rule-selector-input {
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

.rule-selector-input:hover {
  border-color: #667eea;
  background: #f1f5f9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.rule-selector-input.is-focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.rule-selector-input.is-disabled {
  background: #f5f7fa;
  border-color: #dcdfe6;
  cursor: not-allowed;
  opacity: 0.6;
}

.rule-selector-input.is-disabled:hover {
  border-color: #dcdfe6;
  background: #f5f7fa;
  box-shadow: none;
}

/* simple 变体样式 */
.rule-selector-container.variant-simple .rule-selector-input {
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

.rule-selector-container.variant-simple .rule-selector-input:hover {
  border-color: #c0c4cc;
  background: #ffffff;
  box-shadow: none;
}

.rule-selector-container.variant-simple .rule-selector-input.is-focus {
  border-color: #409eff;
  background: #ffffff;
  box-shadow: none;
  outline: none;
}

.rule-selector-container.variant-simple .rule-selector-input.is-disabled {
  background: #f5f7fa;
  border-color: #dcdfe6;
  cursor: not-allowed;
  opacity: 0.6;
}

.rule-selector-container.variant-simple .rule-selector-input.is-disabled:hover {
  border-color: #dcdfe6;
  background: #f5f7fa;
  box-shadow: none;
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

/* simple 变体的图标样式 */
.rule-selector-container.variant-simple .item-icon {
  width: 16px;
  height: 16px;
  font-size: 10px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #606266;
  box-shadow: none;
  font-weight: normal;
}

.rule-selector-container.variant-simple .item-name {
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.rule-selector-container.variant-simple .placeholder-text {
  font-size: 14px;
  color: #c0c4cc;
  text-align: left;
}

.rule-selector-container.variant-simple .picker-arrow {
  width: 16px;
  height: 16px;
  color: #c0c4cc;
}

.rule-selector-container.variant-simple .picker-arrow svg {
  width: 12px;
  height: 12px;
}

.rule-selector-dropdown {
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
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  gap: 6px;
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
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  background: #f8fafc;
}

:deep(.el-loading-mask) {
  border-radius: 0 0 16px 16px;
}
</style>
