<template>
  <Teleport to="body">
    <div v-if="visible" class="user-popover-overlay" @click="handleOverlayClick">
      <div class="user-popover-content" :style="popoverStyle" @click.stop>
        <div class="search-wrapper">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="searchKeyword"
              @input="handleSearch"
              placeholder="搜索用户..."
              class="search-input"
              ref="searchInputRef"
            />
          </div>
        </div>

        <div v-loading="loading" class="users-list">
          <div v-if="listData.length === 0 && !loading" class="empty-state">
            <span>暂无匹配用户</span>
          </div>

          <div
            v-for="user in listData"
            :key="String(user[keyField])"
            class="user-item"
            :class="{ 'user-disabled': isDisabled(user) }"
            @click="handleSelect(user)"
          >
            <div class="user-info">
              <div class="user-avatar" :style="{ background: generateUserColor(user[keyField] as string) }">
                {{ getInitial(user) }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ user[labelField] }}</div>
                <div class="user-username">@{{ user[keyField] }}</div>
              </div>
            </div>
            <el-icon v-if="isDisabled(user)" class="disabled-icon">
              <Check />
            </el-icon>
          </div>
        </div>

        <div v-if="paginationData.total > paginationData.pageSize" class="footer-wrapper">
          <el-pagination
            background
            layout="total, prev, next"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            @current-change="handlePageChange"
            small
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts" generic="T, K extends string | number">
import { ref, nextTick } from "vue"
import { Check } from "@element-plus/icons-vue"
import { useGenericPicker } from "@@/composables/useGenericPicker"

interface IUserPopoverPickerProps<T, K extends string | number> {
  searchApi: (params: { keyword: string; offset: number; limit: number }) => Promise<{ total: number; data: T[] }>
  resolveApi: (key: K) => Promise<T | null>
  keyField: keyof T
  labelField: keyof T
  disabledKeys?: K[]
  pageSize?: number
}

const props = withDefaults(defineProps<IUserPopoverPickerProps<T, K>>(), {
  pageSize: 5,
  disabledKeys: () => []
})

const emit = defineEmits<{
  select: [user: T]
}>()

const visible = ref(false)
const popoverStyle = ref<Record<string, string>>({})

const {
  loading,
  listData,
  searchKeyword,
  searchInputRef,
  paginationData,
  handleSearch,
  handlePageChange,
  loadData,
  clearSearchTimer
} = useGenericPicker<T, K>({
  searchApi: props.searchApi,
  resolveApi: props.resolveApi,
  keyField: props.keyField,
  pageSize: props.pageSize
})

const isDisabled = (item: T): boolean => {
  return props.disabledKeys.includes(item[props.keyField] as unknown as K)
}

const handleSelect = (item: T) => {
  if (isDisabled(item)) return
  emit("select", item)
  close()
}

const show = async (targetElement?: HTMLElement) => {
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect()
    const popoverWidth = 320
    const windowWidth = window.innerWidth
    let left = rect.left + (rect.width - popoverWidth) / 2
    if (left < 8) left = 8
    else if (left + popoverWidth > windowWidth - 8) left = windowWidth - popoverWidth - 8

    popoverStyle.value = {
      position: "fixed",
      left: `${left}px`,
      top: `${rect.bottom + 8}px`,
      width: "320px",
      zIndex: "9999"
    }
  }

  visible.value = true
  await nextTick()
  searchInputRef.value?.focus()
  loadData()
}

const close = () => {
  clearSearchTimer()
  visible.value = false
  searchKeyword.value = ""
}

const handleOverlayClick = () => {
  close()
}

defineExpose({ show })

const getInitial = (item: T): string => {
  const label = (item[props.labelField] as string) || (item[props.keyField] as string) || ""
  return label.charAt(0)
}

const generateUserColor = (key: string): string => {
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
    "#fee140"
  ]
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}
</script>

<style lang="scss" scoped>
.user-popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background-color: transparent;
}

.user-popover-content {
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  padding: 16px;
}

.search-wrapper {
  margin-bottom: 12px;
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

.users-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  margin-bottom: 12px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 13px;
}

.user-item {
  margin-bottom: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.user-item.user-disabled {
  background-color: rgba(0, 0, 0, 0.05);
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

.user-item.user-disabled:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-color: transparent;
  transform: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 11px;
  color: #6b7280;
  font-weight: 400;
}

.disabled-icon {
  color: #22c55e;
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 8px;
}

.footer-wrapper {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
