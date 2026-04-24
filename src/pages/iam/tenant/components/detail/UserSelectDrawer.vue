<script setup lang="ts">
import { watch } from "vue"
import { Search, Close, UserFilled } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/iam/user"
import type { User } from "@/api/iam/user/type"
import { Drawer } from "@@/components/Dialogs"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

const visible = defineModel<boolean>({ default: false })

defineProps<{
  confirmLoading?: boolean
}>()

const emit = defineEmits<{
  confirm: [selectedIds: number[]]
}>()

// --- 用户选择器核心逻辑 (从全局用户池中选择) ---
const userSelector = useResourceSelector<User, { keyword: string }>({
  fetchApi: listUsersApi,
  listKey: "users",
  rowKey: (row: User) => String(row.id),
  initialQuery: { keyword: "" }
})

// --- 弹窗生命周期管理 ---
watch(visible, (val) => {
  if (val) {
    userSelector.fetchList()
  } else {
    userSelector.reset()
  }
})

const handleConfirm = () => {
  if (userSelector.selectedTotal.value === 0) return
  emit(
    "confirm",
    userSelector.selectedList.value.map((u) => u.id)
  )
}
</script>

<template>
  <Drawer
    v-model="visible"
    title="分派新成员"
    subtitle="从全平台用户池中检索并加入当前租户空间"
    size="880px"
    :header-icon="UserFilled"
    :confirm-loading="confirmLoading"
    @confirm="handleConfirm"
  >
    <div class="dual-panel-container">
      <!-- 左侧：待选列表 -->
      <div class="panel-source">
        <div class="panel-source-header">
          <el-input
            v-model="userSelector.query.keyword"
            placeholder="搜索姓名、用户名或邮箱..."
            class="search-input"
            clearable
            @input="userSelector.debouncedSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-table
          :ref="userSelector.tableRef"
          v-loading="userSelector.loading.value"
          :data="userSelector.list.value"
          height="100%"
          :row-key="(row) => String(row.id)"
          @selection-change="userSelector.handleSelectionChange"
        >
          <el-table-column type="selection" width="45" reserve-selection />

          <el-table-column label="用户信息" min-width="220">
            <template #default="{ row }">
              <div class="user-info-cell">
                <el-avatar :size="32" :src="row.avatar" class="u-avatar">
                  {{ row.nickname?.charAt(0) || row.username.charAt(0) }}
                </el-avatar>
                <div class="u-detail">
                  <span class="nickname">{{ row.nickname || "—" }}</span>
                  <span class="username mono">@{{ row.username }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="联系邮箱" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="email-text mono">{{ row.email || "—" }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="userSelector.query.page"
            v-model:page-size="userSelector.query.limit"
            small
            background
            layout="total, prev, pager, next"
            :total="userSelector.total.value"
            @current-change="userSelector.fetchList"
          />
        </div>
      </div>

      <!-- 右侧：已选清单 (购物车) -->
      <div class="panel-buffer">
        <div class="buffer-header">
          <div class="left">
            <span>已选成员</span>
            <span class="count-tag">{{ userSelector.selectedTotal.value }}</span>
          </div>
          <el-button
            v-if="userSelector.selectedTotal.value > 0"
            link
            type="danger"
            size="small"
            @click="userSelector.clearSelection()"
          >
            清空
          </el-button>
        </div>

        <div class="buffer-list">
          <TransitionGroup name="list-fade">
            <div v-for="item in userSelector.selectedList.value" :key="item.id" class="buffer-item">
              <div class="info">
                <span class="name">{{ item.nickname || item.username }}</span>
                <span class="id mono">@{{ item.username }}</span>
              </div>
              <el-icon class="remove-btn" @click="userSelector.removeSelection(item)">
                <Close />
              </el-icon>
            </div>
          </TransitionGroup>
          <el-empty v-if="userSelector.selectedTotal.value === 0" description="暂未选择成员" :image-size="40" />
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style lang="scss" scoped>
.dual-panel-container {
  display: flex;
  height: 520px;
  background: #ffffff;
}

.panel-source {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  min-height: 0;

  .panel-source-header {
    margin-bottom: 16px;
    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        background-color: #f8fafc;
        box-shadow: 0 0 0 1px #e2e8f0 inset;
      }
    }
  }

  .pagination-bar {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.panel-buffer {
  width: 280px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;

  .buffer-header {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;

    .left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #475569;
    }

    .count-tag {
      background: #3b82f6;
      color: white;
      padding: 0 6px;
      height: 18px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: 800;
    }
  }

  .buffer-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  .u-avatar {
    background: #f1f5f9;
    color: #64748b;
    font-weight: 700;
  }
  .u-detail {
    display: flex;
    flex-direction: column;
    min-width: 0;
    .nickname {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .username {
      font-size: 11px;
      color: #94a3b8;
    }
  }
}

.email-text {
  font-size: 12px;
  color: #64748b;
}

.buffer-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 80%;
    .name {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .id {
      font-size: 10px;
      color: #94a3b8;
    }
  }

  .remove-btn {
    cursor: pointer;
    color: #94a3b8;
    font-size: 14px;
    &:hover {
      color: #ef4444;
    }
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}

.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.2s ease;
}
.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  font-size: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}
</style>
