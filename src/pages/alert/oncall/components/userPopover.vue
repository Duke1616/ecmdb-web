<template>
  <!-- 使用 Teleport 将弹窗渲染到 body 中 -->
  <Teleport to="body">
    <div v-if="visible" class="user-popover-overlay" @click="handleOverlayClick">
      <div class="user-popover-content" :style="popoverStyle" @click.stop>
        <div class="search-wrapper">
          <el-input
            v-model="keyword"
            @input="handleSearch"
            placeholder="输入内容检索"
            clearable
            class="search-input"
            prefix-icon="Search"
          />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>加载中...</span>
        </div>

        <!-- 用户数据列表 -->
        <div v-else-if="usersData.length > 0" class="users-list">
          <div
            v-for="user in usersData"
            :key="user.id"
            class="user-item"
            :class="{ 'user-disabled': isUserExists(user.username) }"
            @click="handleUserClick(user)"
          >
            <span class="user-name">{{ (user.nickname || user.username) + " [" + user.username + "] " }}</span>
            <el-icon v-if="isUserExists(user.username)" class="disabled-icon">
              <Check />
            </el-icon>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-wrapper">
          <span>暂无用户数据</span>
        </div>

        <!-- 分页控件和操作按钮 -->
        <div class="footer-wrapper">
          <div v-if="!loading && usersData.length > 0" class="pager-wrapper">
            <el-pagination
              background
              layout="total, prev, next"
              :total="total"
              :page-size="pageSize"
              :current-page="currentPage"
              @current-change="handlePageChange"
            />
          </div>

          <div class="action-buttons">
            <el-button size="small" @click="handleCancel">取消</el-button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { User as IIamUser } from "@/api/iam/user/type"
import { Loading, Check } from "@element-plus/icons-vue"
import { ref, nextTick } from "vue"
import { useUsers } from "@/common/composables/useUsers"

interface Props {
  addOnCallGroup: (user: IIamUser) => void
  existingUsers?: string[] // 已存在的用户名列表
}

const props = defineProps<Props>()

// 弹窗特有状态
const visible = ref<boolean>(false)
const popoverStyle = ref<Record<string, string>>({})

// 使用通用的用户 Hook
const {
  loading,
  usersList: usersData,
  total,
  currentPage,
  pageSize,
  keyword,
  loadUsersList: loadUsers,
  handleSearch,
  handlePageChange
} = useUsers({ pageSize: 5 })

// 暴露给父组件的方法
const show = async (targetElement?: HTMLElement): Promise<void> => {
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect()
    const popoverWidth = 320
    const windowWidth = window.innerWidth
    let left = rect.left + (rect.width - popoverWidth) / 2
    if (left < 8) {
      left = 8
    } else if (left + popoverWidth > windowWidth - 8) {
      left = windowWidth - popoverWidth - 8
    }

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
  loadUsers()
}

// 暴露方法
defineExpose({
  show
})

// 检查用户是否已存在
const isUserExists = (username: string): boolean => {
  return props.existingUsers?.includes(username) || false
}

// 处理用户点击
const handleUserClick = (user: IIamUser): void => {
  if (isUserExists(user.username)) return
  props.addOnCallGroup(user)
  visible.value = false
  cleanup()
}

// 处理取消和遮罩层点击
const handleCancel = (): void => {
  visible.value = false
  cleanup()
}

const handleOverlayClick = (): void => {
  visible.value = false
  cleanup()
}

const cleanup = (): void => {
  keyword.value = ""
  usersData.value = []
  loading.value = false
  currentPage.value = 1
  total.value = 0
}
</script>

<style scoped>
/* 遮罩层 */
.user-popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background-color: transparent;
}

/* 弹窗内容容器 */
.user-popover-content {
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
}

/* 搜索框容器 */
.search-wrapper {
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* 搜索框样式 */
.search-input {
  width: 100%;
}

/* 用户列表容器 */
.users-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  margin-bottom: 12px;
}

/* 用户项样式 */
.user-item {
  margin-bottom: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 用户名称样式 */
.user-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

/* 已存在用户样式 */
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

/* 已存在图标样式 */
.disabled-icon {
  color: #22c55e;
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 8px;
}

/* 加载状态样式 */
.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  gap: 8px;
}

/* 空状态样式 */
.empty-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 底部容器 */
.footer-wrapper {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 分页控件容器 */
.pager-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.pager-wrapper .el-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 操作按钮容器 */
.action-buttons {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .popover-content {
    max-height: 300px;
  }

  .users-list {
    max-height: 150px;
  }
}
</style>
