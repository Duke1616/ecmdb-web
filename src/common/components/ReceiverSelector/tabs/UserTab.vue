<template>
  <div class="user-tab-container">
    <div class="header-wrapper">
      <div class="search-wrapper">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或姓名..."
          clearable
          :prefix-icon="Search"
          @input="handleSearch"
        />
      </div>
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, next"
          @current-change="handlePageChange"
          hide-on-single-page
          small
        />
      </div>
    </div>

    <div class="user-list" v-loading="loading">
      <div
        v-for="user in displayUsers"
        :key="user.id"
        class="user-item"
        :class="{ active: isSelected(user.username) }"
        @click="toggleUser(user)"
      >
        <div class="user-avatar">
          <el-avatar :size="32" :style="{ backgroundColor: generateColor(user.username) }">
            {{ (user.display_name || user.username).charAt(0).toUpperCase() }}
          </el-avatar>
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.display_name || user.username }}</div>
          <div class="user-meta">{{ user.username }}</div>
        </div>
        <el-icon v-if="isSelected(user.username)" class="check-icon"><Check /></el-icon>
      </div>

      <div v-if="displayUsers.length === 0 && !loading" class="empty-state">
        <el-icon><User /></el-icon>
        <span>{{ searchQuery ? '未找到匹配的用户' : '暂无用户数据' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { Search, Check, User } from "@element-plus/icons-vue"
import { listUsersByKeywordApi } from "@/api/user"

interface Props {
  selectedUsernames: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedUsernames: () => []
})

const emit = defineEmits<{
  (e: "change", users: any[]): void
}>()

const searchQuery = ref("")
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const displayUsers = ref<any[]>([])
const selectedUsers = ref<any[]>([])

const isSelected = (username: string) => {
  return selectedUsers.value.some((u) => u.username === username)
}

const toggleUser = (user: any) => {
  const index = selectedUsers.value.findIndex((u) => u.username === user.username)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(user)
  }
  emit("change", selectedUsers.value)
}

const loadUsers = async () => {
  loading.value = true
  try {
    const { data } = await listUsersByKeywordApi({
      offset: (currentPage.value - 1) * pageSize,
      limit: pageSize,
      keyword: searchQuery.value
    })
    displayUsers.value = data.users || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
    displayUsers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handlePageChange = () => {
  loadUsers()
}

// 生成头像颜色
const generateColor = (str: string) => {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#6366f1",
    "#f43f5e"
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// 初始化已选用户
watch(
  () => props.selectedUsernames,
  async (usernames) => {
    if (usernames.length > 0 && selectedUsers.value.length === 0) {
      // 如果有初始选中的用户名，需要加载这些用户的完整信息
      try {
        const { data } = await listUsersByKeywordApi({
          offset: 0,
          limit: 100,
          keyword: ""
        })
        selectedUsers.value = (data.users || []).filter((u: any) => usernames.includes(u.username))
      } catch (e) {
        console.error(e)
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.user-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search-wrapper {
  flex: 1;
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e2e8f0;
    &:hover,
    &.is-focus {
      border-color: #3b82f6;
      background: #fff;
    }
  }
}

.user-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;

  .user-avatar {
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-meta {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .check-icon {
    font-size: 18px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &.active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

    .user-name {
      color: #1e40af;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #cbd5e1;
  text-align: center;

  .el-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  span {
    font-size: 13px;
  }
}

.pagination-wrapper {
  flex-shrink: 0;
  :deep(.el-pagination) {
    .btn-prev,
    .btn-next,
    .el-pagination__total {
      font-size: 12px;
    }
    .btn-prev,
    .btn-next {
      min-width: 24px;
      height: 24px;
      line-height: 24px;
    }
  }
}
</style>
