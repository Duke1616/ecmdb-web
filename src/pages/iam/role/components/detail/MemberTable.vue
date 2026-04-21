<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import type { User } from "@/api/iam/user/type"

const selection = defineModel<User[]>("selection", { default: () => [] })

defineProps<{
  loading: boolean
  data: User[]
  total: number
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: User]
  batchUnbind: []
  search: [keyword: string]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="关联用户"
    search-placeholder="搜索用户姓名或用户名"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    indicator-color="#6366f1"
    show-selection
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="user-cols header-label-font">
        <span>个人信息</span>
        <span>用户名/邮箱</span>
        <span>岗位职务</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 头部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>添加成员</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button type="danger" size="small" @click="emit('batchUnbind')">批量移除成员</el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="user-grid-row">
        <div class="cell-identity">
          <el-avatar :size="32" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
          <div class="meta-info">
            <span class="name">{{ row.nickname }}</span>
          </div>
        </div>

        <div class="cell-account">
          <div class="account-item">
            <code>{{ row.username }}</code>
          </div>
          <div class="account-item email">{{ row.email }}</div>
        </div>

        <div class="cell-job">
          <span class="job-text">{{ row.job_title || "未设置岗位" }}</span>
        </div>

        <div class="cell-actions">
          <el-button type="danger" link size="small" class="delete-btn" @click.stop="emit('unbind', row)">
            <el-icon><Delete /></el-icon>
            <span>移除</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border-color: #6366f1;
  background: #6366f1;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #4f46e5;
    background: #4f46e5;
    color: #ffffff;
  }
}

.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
}

.user-cols {
  display: grid;
  grid-template-columns: 200px 1.5fr 1fr 100px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.user-grid-row {
  display: grid;
  grid-template-columns: 200px 1.5fr 1fr 100px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
}

.cell-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  .meta-info {
    .name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
  }
}

.cell-account {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .account-item {
    font-size: 13px;
    code {
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #1e293b;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
    }
    &.email {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.cell-job {
  font-size: 13px;
  color: #64748b;
}

.cell-actions {
  display: flex;
  justify-content: center;
  .delete-btn {
    color: #94a3b8;
    &:hover {
      color: #ef4444;
    }
  }
}
</style>
