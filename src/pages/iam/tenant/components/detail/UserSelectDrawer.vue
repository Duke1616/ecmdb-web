<script setup lang="ts">
import { ref, watch } from "vue"
import { Search, Check } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/iam/user"
import type { User } from "@/api/iam/user/type"

const visible = defineModel<boolean>()

const props = defineProps<{
  loading?: boolean
  confirmLoading?: boolean
}>()

const emit = defineEmits<{
  confirm: [selectedIds: number[]]
  cancel: []
}>()

// 状态管理
const users = ref<User[]>([])
const total = ref(0)
const drawerLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const keyword = ref("")

const selectedUsers = ref<User[]>([])

// 加载数据
const fetchUsers = async () => {
  drawerLoading.value = true
  try {
    const { data } = await listUsersApi({
      keyword: keyword.value,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    })
    users.value = data.users || []
    total.value = data.total || 0
  } catch (error) {
    console.error("加载全局用户列表失败:", error)
  } finally {
    drawerLoading.value = false
  }
}

// 监听显隐，重置状态
watch(visible, (val) => {
  if (val) {
    currentPage.value = 1
    keyword.value = ""
    selectedUsers.value = []
    fetchUsers()
  }
})

// 处理选择逻辑
const toggleSelection = (user: User) => {
  const index = selectedUsers.value.findIndex((u) => u.id === user.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(user)
  }
}

const isSelected = (id: number) => {
  return selectedUsers.value.some((u) => u.id === id)
}

const handleConfirm = () => {
  if (selectedUsers.value.length === 0) return
  emit(
    "confirm",
    selectedUsers.value.map((u) => u.id)
  )
}
</script>

<template>
  <el-drawer v-model="visible" title="分派新成员" size="580px" destroy-on-close class="user-select-drawer">
    <template #header>
      <div class="drawer-header-custom">
        <span class="title">分派新成员</span>
        <span class="subtitle">从全平台用户池中检索并加入当前空间</span>
      </div>
    </template>

    <div class="drawer-content-wrapper">
      <!-- 搜索工具栏 -->
      <div class="search-toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索姓名、用户名或邮箱..."
          :prefix-icon="Search"
          clearable
          @input="
            () => {
              currentPage = 1
              fetchUsers()
            }
          "
        />
        <div v-if="selectedUsers.length > 0" class="selection-status">
          已选择 <span>{{ selectedUsers.length }}</span> 位待分派成员
        </div>
      </div>

      <!-- 用户列表容器 -->
      <div v-loading="drawerLoading || props.loading" class="user-list-scroller">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-select-card"
          :class="{ 'is-active': isSelected(user.id) }"
          @click="toggleSelection(user)"
        >
          <div class="card-inner">
            <el-avatar :size="36" :src="user.avatar" class="u-avatar">
              {{ user.nickname?.charAt(0) }}
            </el-avatar>
            <div class="u-info">
              <div class="top">
                <span class="nick">{{ user.nickname }}</span>
                <span class="user">@{{ user.username }}</span>
              </div>
              <div class="bottom">{{ user.email || "暂无邮箱地址" }}</div>
            </div>
            <div class="selection-indicator">
              <el-icon v-if="isSelected(user.id)"><Check /></el-icon>
            </div>
          </div>
        </div>

        <el-empty v-if="!drawerLoading && users.length === 0" description="未找到匹配的用户" />
      </div>

      <!-- 分页栏 -->
      <div class="pagination-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          small
          layout="total, prev, pager, next"
          @current-change="fetchUsers"
        />
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="confirmLoading"
          :disabled="selectedUsers.length === 0"
          class="confirm-btn"
          @click="handleConfirm"
        >
          确定分派 ({{ selectedUsers.length }})
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.user-select-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
  }
}

.drawer-header-custom {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }
  .subtitle {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }
}

.drawer-content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-toolbar {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .selection-status {
    font-size: 12px;
    color: #64748b;
    padding: 6px 12px;
    background: #eff6ff;
    border-radius: 6px;
    span {
      color: #3b82f6;
      font-weight: 700;
    }
  }
}

.user-list-scroller {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
}

.user-select-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #f9f8ff;
  }

  &.is-active {
    border-color: #3b82f6;
    background: #eff6ff;
    .selection-indicator {
      background: #3b82f6;
      color: #ffffff;
      border-color: #3b82f6;
    }
  }

  .card-inner {
    display: flex;
    align-items: center;
    gap: 12px;

    .u-avatar {
      background: #f1f5f9;
      color: #64748b;
      font-weight: 700;
    }

    .u-info {
      flex: 1;
      min-width: 0;
      .top {
        display: flex;
        align-items: center;
        gap: 8px;
        .nick {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        .user {
          font-size: 11px;
          color: #94a3b8;
        }
      }
      .bottom {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
    }

    .selection-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      .el-icon {
        font-size: 12px;
        font-weight: 800;
      }
    }
  }
}

.pagination-footer {
  padding-top: 16px;
  display: flex;
  justify-content: center;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;

  .confirm-btn {
    background: #3b82f6;
    border-color: #3b82f6;
    &:disabled {
      opacity: 0.5;
    }
  }
}
</style>
