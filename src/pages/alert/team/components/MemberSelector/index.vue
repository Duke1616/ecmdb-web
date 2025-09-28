<template>
  <div class="member-selector-container">
    <!-- 左侧：部门选择和用户列表 -->
    <div class="left-panel">
      <div class="panel-header">
        <h4 class="panel-title">选择成员</h4>
        <span class="selection-count">已选择 {{ props.modelValue.length }} 人</span>
      </div>

      <!-- 部门选择 -->
      <div class="department-section">
        <el-tree-select
          v-model="selectedDepartment"
          :data="departments"
          :props="defaultProps"
          placeholder="选择部门"
          clearable
          check-strictly
          :render-after-expand="false"
          :default-expand-all="true"
          class="department-select"
          @change="handleDepartmentChange"
        />
      </div>

      <!-- 用户列表 -->
      <div class="user-list-wrapper">
        <div class="user-list" v-loading="loading">
          <div v-for="user in filteredUsers" :key="user.id" class="user-card" @click="toggleUser(user)">
            <div class="user-checkbox">
              <el-checkbox :model-value="isUserSelected(user)" @change="toggleUser(user)" @click.stop />
            </div>
            <div class="user-info">
              <div class="user-avatar" :style="{ background: generateUserColor(user.username) }">
                {{ user.display_name?.charAt(0) || user.username?.charAt(0) }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.display_name || user.username }}</div>
                <div class="user-username">@{{ user.username }}</div>
              </div>
            </div>
          </div>
          <div v-if="filteredUsers.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无用户数据" :image-size="80" />
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="paginationData.total > 0" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="paginationData.currentPage"
            :page-size="paginationData.pageSize"
            :total="paginationData.total"
            :layout="paginationData.layout"
            @current-change="handleCurrentChangeWithLoad"
            small
          />
        </div>
      </div>
    </div>

    <!-- 分隔符 -->
    <div class="divider" />

    <!-- 右侧：已选择的用户 -->
    <div class="right-panel">
      <div class="panel-header">
        <h4 class="panel-title">已选择成员</h4>
        <span class="selection-count">已选择 {{ props.modelValue.length }} 人</span>
      </div>
      <div class="selected-users-wrapper">
        <div v-if="props.modelValue.length === 0" class="empty-state">
          <el-icon class="empty-icon"><User /></el-icon>
          <p class="empty-text">暂无选择的成员</p>
          <p class="empty-hint">请在左侧选择团队成员</p>
        </div>
        <div v-else class="selected-users-list">
          <div v-for="user in getSelectedUsers()" :key="user.id" class="user-card selected">
            <div class="user-info">
              <div class="user-avatar" :style="{ background: generateUserColor(user.username) }">
                {{ user.display_name?.charAt(0) || user.username?.charAt(0) }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.display_name || user.username }}</div>
                <div class="user-username">@{{ user.username }}</div>
              </div>
            </div>
            <button class="remove-btn" @click="removeUser(user)" title="移除">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { User, Close } from "@element-plus/icons-vue"
import { listDepartmentTreeApi } from "@/api/department"
import { listUsersByDepartmentApi } from "@/api/user"
import { usePagination } from "@@/composables/usePagination"
import type { user } from "@/api/user/types/user"
import type { department } from "@/api/department/types/department"

interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()
const emits = defineEmits<{
  "update:modelValue": [value: string[]]
}>()

// 部门选择相关
const selectedDepartment = ref<number | null>(null)
const departments = ref<department[]>([])
const users = ref<user[]>([])
const selectedUsers = ref<user[]>([])

// 使用分页封装
const { paginationData, handleCurrentChange } = usePagination({
  pageSize: 20,
  layout: "prev, next, total"
})

// 加载状态
const loading = ref(false)

// 树形选择器配置
const defaultProps = {
  children: "children",
  label: "name",
  value: "id"
}

// 根据部门过滤用户
const filteredUsers = computed(() => {
  return users.value
})

// 生成用户头像颜色
const generateUserColor = (username: string) => {
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
    "#fed6e3"
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 判断用户是否被选中
const isUserSelected = (user: user) => {
  return selectedUsers.value.some((u) => u.id === user.id)
}

// 切换用户选择
const toggleUser = (user: user) => {
  const index = selectedUsers.value.findIndex((u) => u.id === user.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(user)
  }
  // 同步到 modelValue
  const usernames = selectedUsers.value.map((u) => u.username)
  emits("update:modelValue", usernames)
}

// 移除用户
const removeUser = (user: user) => {
  const index = selectedUsers.value.findIndex((u) => u.id === user.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
    const usernames = selectedUsers.value.map((u) => u.username)
    emits("update:modelValue", usernames)
  }
}

// 获取已选择的用户对象
const getSelectedUsers = () => {
  return selectedUsers.value
}

// 部门变化处理
const handleDepartmentChange = () => {
  // 重置分页到第一页
  paginationData.currentPage = 1
  // 加载该部门的用户
  loadUsersByDepartment()
}

// 重写分页变化处理，添加数据加载
const handleCurrentChangeWithLoad = (page: number) => {
  handleCurrentChange(page)
  loadUsersByDepartment()
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    const { data } = await listDepartmentTreeApi()
    // 在部门列表前面添加"全部"选项
    departments.value = [
      {
        id: 0,
        pid: 0,
        name: "全部部门",
        sort: 0,
        enabled: true,
        leaders: [],
        main_leader: "",
        children: []
      },
      ...(data || [])
    ]
  } catch (error) {
    console.error("加载部门列表失败:", error)
  }
}

// 根据部门加载用户列表
const loadUsersByDepartment = async () => {
  if (selectedDepartment.value === null) {
    users.value = []
    paginationData.total = 0
    return
  }

  loading.value = true
  try {
    const { data } = await listUsersByDepartmentApi({
      department_id: selectedDepartment.value,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })
    users.value = data.users || []
    paginationData.total = data.total || 0
  } catch (error) {
    console.error("加载部门用户失败:", error)
    users.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

// 根据用户名找到对应的用户对象
const findUsersByUsernames = (usernames: string[]) => {
  return users.value.filter((user) => usernames.includes(user.username))
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (Array.isArray(newValue) && newValue.length > 0) {
      selectedUsers.value = findUsersByUsernames(newValue)
    } else {
      selectedUsers.value = []
    }
  },
  { immediate: true }
)

// 组件挂载时加载数据
onMounted(async () => {
  await loadDepartments()
  // 默认选中"全部"
  selectedDepartment.value = 0
  // 加载所有用户
  loadUsersByDepartment()
})
</script>

<style lang="scss" scoped>
/* 成员选择器样式 */
.member-selector-container {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.left-panel,
.right-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.divider {
  width: 1px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .selection-count {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
}

.department-section {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .department-select {
    width: 100%;
  }
}

.user-list-wrapper,
.selected-users-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}

.pagination-wrapper {
  padding: 16px 0 0 0;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.user-list,
.selected-users-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  min-height: 0;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  &.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .user-checkbox {
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
  }

  .user-details {
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-username {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: #ef4444;
      color: #ffffff;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
  text-align: center;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 8px 0;
  }

  .empty-hint {
    font-size: 12px;
    margin: 0;
    opacity: 0.7;
  }
}
</style>
