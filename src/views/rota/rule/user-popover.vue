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
            <span class="user-name">{{ user.display_name + " [" + user.username + "] " }}</span>
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
              :layout="paginationData.layout"
              :page-sizes="paginationData.pageSizes"
              :total="paginationData.total"
              :page-size="paginationData.pageSize"
              :current-page="paginationData.currentPage"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
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
import { listUsersApi, listUsersByKeywordApi } from "@/api/user"
import { user as userInfo } from "@/api/user/types/user"
import { Loading, Check } from "@element-plus/icons-vue"
import { debounce } from "lodash-es"
import { ref, onUnmounted, nextTick } from "vue"

interface Props {
  addRotaGroup: (user: userInfo) => void
  existingUsers?: string[] // 已存在的用户名列表
}

const props = defineProps<Props>()

// 基础状态
const visible = ref<boolean>(false)
const loading = ref<boolean>(false)
const keyword = ref<string>("")
const usersData = ref<userInfo[]>([])
const popoverStyle = ref<Record<string, string>>({})

// 分页状态
const paginationData = ref({
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "total, prev, next"
})

// 请求控制器
let abortController: AbortController | null = null

// 防抖搜索
const debouncedSearch = debounce(() => {
  paginationData.value.currentPage = 1
  loadUsers()
}, 300)

// 加载用户数据
const loadUsers = async (): Promise<void> => {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }

  // 创建新的请求控制器
  abortController = new AbortController()
  loading.value = true

  try {
    const params = {
      offset: (paginationData.value.currentPage - 1) * paginationData.value.pageSize,
      limit: paginationData.value.pageSize
    }

    const response = keyword.value
      ? await listUsersByKeywordApi({ ...params, keyword: keyword.value })
      : await listUsersApi(params)

    if (!abortController.signal.aborted) {
      paginationData.value.total = response.data.total
      usersData.value = response.data.users || []
    }
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("加载用户数据失败:", error)
      usersData.value = []
    }
  } finally {
    if (!abortController?.signal.aborted) {
      loading.value = false
    }
    abortController = null
  }
}

// 处理搜索
const handleSearch = (): void => {
  debouncedSearch()
}

// 处理分页变化
const handleSizeChange = (size: number): void => {
  paginationData.value.pageSize = size
  paginationData.value.currentPage = 1
  loadUsers()
}

const handleCurrentChange = (page: number): void => {
  paginationData.value.currentPage = page
  loadUsers()
}

// 暴露给父组件的方法
const show = async (targetElement?: HTMLElement): Promise<void> => {
  if (targetElement) {
    // 计算弹窗位置 - 在按钮下方居中
    const rect = targetElement.getBoundingClientRect()
    const popoverWidth = 320
    const windowWidth = window.innerWidth

    // 计算居中位置
    let left = rect.left + (rect.width - popoverWidth) / 2

    // 边界检测 - 确保弹窗不会超出屏幕
    if (left < 8) {
      left = 8 // 距离左边至少8px
    } else if (left + popoverWidth > windowWidth - 8) {
      left = windowWidth - popoverWidth - 8 // 距离右边至少8px
    }

    popoverStyle.value = {
      position: "fixed",
      left: `${left}px`,
      top: `${rect.bottom + 8}px`,
      width: "320px",
      zIndex: "9999"
    }
  }

  // 显示弹窗并加载数据
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
const handleUserClick = (user: userInfo): void => {
  console.log("用户点击:", user)

  // 如果用户已存在，不执行添加操作
  if (isUserExists(user.username)) {
    console.log("用户已存在，跳过添加")
    return
  }

  props.addRotaGroup(user)
  visible.value = false
  cleanup()
}

// 处理取消按钮
const handleCancel = (): void => {
  visible.value = false
  cleanup()
}

// 处理遮罩层点击
const handleOverlayClick = (): void => {
  visible.value = false
  cleanup()
}

// 清理资源
const cleanup = (): void => {
  // 取消进行中的请求
  if (abortController) {
    abortController.abort()
    abortController = null
  }

  // 重置状态
  keyword.value = ""
  usersData.value = []
  loading.value = false
  paginationData.value.currentPage = 1
  paginationData.value.total = 0

  // 取消防抖
  debouncedSearch.cancel()
}

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})
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
