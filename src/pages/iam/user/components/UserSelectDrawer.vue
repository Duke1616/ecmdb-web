<script setup lang="ts">
import { watch } from "vue"
import { Close, User as UserIcon, Check } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/iam/user"
import type { User } from "@/api/iam/user/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 用户选择器 (极简版)
 * 已将布局、搜索、分页完全委托给 ResourceSelectorLayout。
 */

const visible = defineModel<boolean>({ default: false })

interface UserSelectProps {
  confirmLoading?: boolean
  title?: string
  excludeIds?: number[]
}

withDefaults(defineProps<UserSelectProps>(), {
  title: "分派用户主体",
  excludeIds: () => []
})

const emit = defineEmits<{
  confirm: [selectedUsers: User[]]
}>()

const {
  list,
  total,
  loading,
  query,
  pagination,
  tableRef,
  selectedList,
  selectedTotal,
  fetchList,
  handleSearch,
  handlePageChange,
  handleSelectionChange,
  removeSelection,
  clearSelection,
  reset
} = useResourceSelector<User, { keyword: string }>({
  fetchApi: listUsersApi,
  listKey: "users",
  rowKey: (row: User) => String(row.id),
  initialQuery: { keyword: "" }
})

watch(visible, (val) => {
  if (val) fetchList()
  else reset()
})

const handleConfirm = () => {
  if (selectedTotal.value === 0) return
  emit("confirm", [...selectedList.value])
}
</script>

<template>
  <ResourceSelectorLayout
    v-model="visible"
    v-model:keyword="query.keyword"
    v-model:current-page="pagination.currentPage"
    :title="title"
    subtitle="快速检索用户账户并建立主体关联"
    :header-icon="UserIcon"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    search-placeholder="搜索用户名、姓名、账户标识..."
    accent-color="#3b82f6"
    layer-bg="#f8fafc"
    @update:keyword="handleSearch"
    @page-change="handlePageChange"
    @refresh="fetchList"
    @clear="clearSelection"
    @confirm="handleConfirm"
  >
    <!-- 1. 表格内容 -->
    <template #table>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        height="100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column label="身份主体" min-width="220">
          <template #default="{ row }">
            <div class="user-row">
              <el-avatar :size="28" :src="row.avatar" class="u-avatar">
                {{ (row.nickname || row.username).charAt(0) }}
              </el-avatar>
              <div class="u-meta">
                <span class="name">{{ row.nickname || row.username }}</span>
                <span class="id">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="联系邮箱" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="200" align="center">
          <template #default="{ row }">
            <div class="status-tag" :class="{ 'is-active': row.status === 'active' }">
              <span class="dot" />
              {{ row.status === "active" ? "正常" : "禁用" }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="user in selectedList" :key="user.id" class="entity-card">
        <div class="card-content">
          <div class="ok-mark">
            <el-icon><Check /></el-icon>
          </div>
          <div class="entity-info">
            <span class="entity-name">{{ user.nickname || user.username }}</span>
            <span class="entity-id">@{{ user.username }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(user)"><Close /></el-icon>
        </div>
      </div>
    </template>

    <!-- 3. 自定义确认按钮 -->
    <template #footer-action>
      <el-button
        type="primary"
        class="prime-action user-theme-btn"
        :disabled="selectedTotal === 0"
        :loading="confirmLoading"
        @click="handleConfirm"
      >
        完成分派关联
      </el-button>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$accent: #3b82f6;
$text-main: #0f172a;
$text-sub: #64748b;
$line: #e2e8f0;

:deep(.el-table) {
  .el-table__header-wrapper,
  .el-table__body-wrapper {
    padding-right: 16px; // 增加右侧呼吸感
  }
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  .u-avatar {
    background: #f1f5f9;
    color: $accent;
    font-weight: 700;
  }
  .u-meta {
    .name {
      display: block;
      font-weight: 600;
      color: $text-main;
    }
    .id {
      font-size: 11px;
      color: $text-sub;
    }
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 11px;
  color: $text-sub;
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #94a3b8;
  }
  &.is-active {
    background: #ecfdf5;
    color: #059669;
    .dot {
      background: #10b981;
    }
  }
}

.entity-card {
  margin-bottom: 8px;
  .card-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid $line;
    border-radius: 8px;
    transition: border-color 0.2s;
    &:hover {
      border-color: $accent;
      .del-btn {
        opacity: 1;
      }
    }
    .ok-mark {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #eff6ff;
      color: $accent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
    }
    .entity-info {
      flex: 1;
      min-width: 0;
      .entity-name {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: $text-main;
      }
      .entity-id {
        font-size: 11px;
        color: $text-sub;
      }
    }
    .del-btn {
      opacity: 0;
      cursor: pointer;
      color: #94a3b8;
      font-size: 14px;
      &:hover {
        color: #ef4444;
      }
    }
  }
}

.user-theme-btn {
  width: 100%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}
</style>
