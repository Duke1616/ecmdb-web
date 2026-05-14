<script setup lang="ts">
import { watch } from "vue"
import { Close, User as UserIcon } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/iam/user"
import type { User } from "@/api/iam/user/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 用户选择器 (通用版)
 * 已将布局、搜索、分页完全委托给 ResourceSelectorLayout。
 */

const visible = defineModel<boolean>({ default: false })

interface UserSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
}

withDefaults(defineProps<UserSelectProps>(), {
  title: "选择用户对象",
  subtitle: "快速检索用户账户并建立主体关联",
  confirmText: "确认选择"
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
    :subtitle="subtitle"
    :header-icon="UserIcon"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    search-placeholder="搜索名称、账户标识..."
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
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-row">
              <div class="u-meta">
                <span class="name">{{ row.nickname || row.username }}</span>
                <span class="id">{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="140" align="center" />
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="user in selectedList" :key="user.id" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ user.nickname || user.username }}</span>
            <span class="entity-id">{{ user.username }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(user)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .user-icon {
    width: 32px;
    height: 32px;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 16px;
  }
  .u-meta {
    .name {
      display: block;
      font-weight: 600;
      color: $text-main;
      font-size: 13px;
    }
    .id {
      font-size: 11px;
      color: $text-sub;
    }
  }
}
</style>
