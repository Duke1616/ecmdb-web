<template>
  <div class="user-picker-container" ref="containerRef">
    <div class="user-picker-input" @click="toggleUserPicker" :class="{ 'is-focus': showUserPicker }">
      <!-- 多选模式 -->
      <div v-if="multiple && selectedUsers.length > 0" class="selected-users">
        <div v-for="user in selectedUsers" :key="user.id" class="user-tag">
          <div class="user-avatar" :style="{ background: generateUserColor(user.username || '') }">
            {{ user.display_name?.charAt(0) || user.username?.charAt(0) }}
          </div>
          <span class="user-name">{{ user.display_name || user.username }}</span>
          <button @click.stop="removeUser(user)" class="remove-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <!-- 单选模式 -->
      <div v-else-if="!multiple && selectedUser" class="selected-user">
        <div class="user-avatar" :style="{ background: generateUserColor(selectedUser.username || '') }">
          {{ selectedUser.display_name?.charAt(0) || selectedUser.username?.charAt(0) }}
        </div>
        <span class="user-name">{{ selectedUser.display_name || selectedUser.username }}</span>
      </div>
      <!-- 占位符 -->
      <div v-else class="placeholder-text">{{ placeholder }}</div>
      <div class="picker-arrow" :class="{ 'is-open': showUserPicker }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- 使用 Teleport 将下拉菜单渲染到 body 中，避免被任何容器遮挡 -->
    <Teleport to="body">
      <div v-if="showUserPicker" class="user-picker-dropdown" :style="dropdownStyle" @click.stop>
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
              placeholder="搜索用户..."
              class="search-input"
              ref="searchInputRef"
            />
          </div>
        </div>

        <div class="users-list" v-loading="loading">
          <div v-if="usersData.length === 0 && !loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>暂无用户数据</span>
          </div>

          <div
            v-for="user in usersData"
            :key="user.id"
            class="user-item"
            :class="{ 'is-selected': isUserSelected(user) }"
            @click="handleUserSelect(user)"
          >
            <div class="user-avatar" :style="{ background: generateUserColor(user.username) }">
              {{ user.display_name?.charAt(0) || user.username?.charAt(0) }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.display_name || user.username }}</div>
              <div class="user-username">@{{ user.username }}</div>
            </div>
            <div v-if="isUserSelected(user)" class="selected-indicator">
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
import { watch, onMounted, onUnmounted, ref, computed } from "vue"
import { useUsers } from "@@/composables/useUsers"
import { useUserStore } from "@/pinia/stores/user"
import type { user } from "@/api/user/types/user"

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ""
  },
  placeholder: {
    type: String,
    default: "选择用户"
  },
  defaultToCurrentUser: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(["update:modelValue"])

// 获取用户 store
const userStore = useUserStore()

// 容器引用
const containerRef = ref<HTMLElement>()

// 计算下拉菜单位置
const dropdownStyle = computed(() => {
  if (!containerRef.value || !showUserPicker.value) {
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

// 基于用户名生成随机颜色
const generateUserColor = (username: string) => {
  const colors = [
    "#667eea", // 蓝紫色
    "#764ba2", // 紫色
    "#f093fb", // 粉色
    "#f5576c", // 红色
    "#4facfe", // 蓝色
    "#00f2fe", // 青色
    "#43e97b", // 绿色
    "#38f9d7", // 青绿色
    "#fa709a", // 粉红色
    "#fee140", // 黄色
    "#a8edea", // 浅青色
    "#fed6e3", // 浅粉色
    "#ffecd2", // 浅橙色
    "#fcb69f", // 浅红色
    "#ff9a9e", // 浅粉红
    "#a18cd1", // 浅紫色
    "#fbc2eb", // 浅粉紫
    "#ffecd2", // 浅橙黄
    "#fcb69f", // 浅橙红
    "#ff9a9e" // 浅粉红
  ]

  // 使用用户名生成哈希值
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 转换为32位整数
  }

  // 确保哈希值为正数并选择颜色
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const {
  loading,
  usersData,
  showUserPicker,
  searchKeyword,
  selectedUser,
  searchInputRef,
  paginationData,
  toggleUserPicker,
  selectUser,
  handleSearch,
  handleCurrentChange,
  getUserByUsername
} = useUsers()

// 多选模式的状态
const selectedUsers = ref<user[]>([])

// 判断用户是否被选中
const isUserSelected = (user: user) => {
  if (props.multiple) {
    return selectedUsers.value.some((u) => u.id === user.id)
  } else {
    return props.modelValue === user.username
  }
}

// 移除用户（多选模式）
const removeUser = (user: user) => {
  const index = selectedUsers.value.findIndex((u) => u.id === user.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
    const usernames = selectedUsers.value.map((u) => u.username)
    emits("update:modelValue", usernames)
  }
}

const handleUserSelect = (user: user) => {
  if (props.multiple) {
    // 多选模式
    const existingIndex = selectedUsers.value.findIndex((u) => u.id === user.id)
    if (existingIndex > -1) {
      // 如果已选中，则取消选中
      selectedUsers.value.splice(existingIndex, 1)
    } else {
      // 如果未选中，则添加到选中列表
      selectedUsers.value.push(user)
    }
    const usernames = selectedUsers.value.map((u) => u.username)
    emits("update:modelValue", usernames)
  } else {
    // 单选模式
    selectUser(user, (selectedUser) => {
      emits("update:modelValue", selectedUser.username)
    })
  }
}

// 设置默认用户为当前登录用户
const setDefaultToCurrentUser = async () => {
  // 如果用户信息还没有加载，先尝试获取
  if (!userStore.username) {
    try {
      await userStore.getInfo()
    } catch (error) {
      console.warn("Failed to get user info:", error)
      return
    }
  }

  if (props.defaultToCurrentUser && (!props.modelValue || props.modelValue === "") && userStore.username) {
    try {
      const currentUser = await getUserByUsername(userStore.username)
      if (currentUser) {
        selectedUser.value = currentUser
        emits("update:modelValue", currentUser.username)
      }
    } catch (error) {
      console.warn("Failed to set default user:", error)
    }
  }
}

watch(
  () => props.modelValue,
  async (newValue) => {
    if (props.multiple) {
      // 多选模式
      if (Array.isArray(newValue) && newValue.length > 0) {
        // 根据用户名数组获取用户对象
        const users = []
        for (const username of newValue) {
          try {
            const user = await getUserByUsername(username as string)
            if (user) {
              users.push(user)
            }
          } catch (error) {
            console.warn(`Failed to get user ${username}:`, error)
          }
        }
        selectedUsers.value = users
      } else {
        selectedUsers.value = []
      }
    } else {
      // 单选模式
      if (typeof newValue === "string" && newValue !== "") {
        await getUserByUsername(newValue)
      } else {
        selectedUser.value = null
        // 如果没有值且启用了默认当前用户，则设置默认值
        if (props.defaultToCurrentUser) {
          await setDefaultToCurrentUser()
        }
      }
    }
  },
  { immediate: true }
)

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  if (showUserPicker.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
    showUserPicker.value = false
  }
}

// 组件挂载时设置默认用户
onMounted(async () => {
  // 如果用户信息还没有加载，先尝试获取
  if (!userStore.username) {
    try {
      await userStore.getInfo()
    } catch (error) {
      console.warn("Failed to get user info:", error)
    }
  }

  // 设置默认用户
  if (props.defaultToCurrentUser && (!props.modelValue || props.modelValue === "")) {
    await setDefaultToCurrentUser()
  }

  // 添加点击外部关闭事件监听
  document.addEventListener("click", handleClickOutside)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style lang="scss" scoped>
.user-picker-container {
  position: relative;
  width: 100%;
}

.user-picker-input {
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
}

.user-picker-input:hover {
  border-color: #667eea;
  background: #f1f5f9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.user-picker-input.is-focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.selected-user {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.user-avatar {
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

.user-name {
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

.user-picker-dropdown {
  position: fixed; /* 使用 fixed 定位，通过 Teleport 渲染到 body */
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 400px; /* 限制最大高度 */
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

.users-list {
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

.user-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e5e7eb;
}

.user-item:hover {
  background: #f1f5f9;
}

.user-item.is-selected {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.2);
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info .user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.user-username {
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
.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1;
  min-height: 24px;
}

.user-tag {
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

.user-tag .user-avatar {
  width: 20px;
  height: 20px;
  font-size: 10px;
  box-shadow: none;
}

.user-tag .user-name {
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
  color: #ef4444; /* currentColor for svg */
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.remove-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
}

.remove-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
}

.remove-btn svg {
  width: 12px;
  height: 12px;
}
</style>
