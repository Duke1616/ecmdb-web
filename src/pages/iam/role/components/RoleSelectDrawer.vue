<script setup lang="ts">
import { watch } from "vue"
import { Close, OfficeBuilding, Check } from "@element-plus/icons-vue"
import { listRolesApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 角色选择器 (通用版)
 * 采用 ResourceSelectorLayout 架构，支持搜索、分页、多选及已选预览
 */

const visible = defineModel<boolean>({ default: false })

interface RoleSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  excludeCodes?: string[]
}

const props = withDefaults(defineProps<RoleSelectProps>(), {
  title: "选择角色主体",
  subtitle: "通过建立角色继承关系，实现权限的阶梯式传递与复用",
  excludeCodes: () => []
})

const emit = defineEmits<{
  confirm: [selectedRoles: Role[]]
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
} = useResourceSelector<Role, { keyword: string }>({
  fetchApi: (params) => listRolesApi({ ...params }),
  listKey: "roles",
  rowKey: (row: Role) => row.code,
  initialQuery: { keyword: "" }
})

// 过滤掉需要排除的角色
const filteredList = computed(() => {
  if (!props.excludeCodes.length) return list.value
  return list.value.filter((role) => !props.excludeCodes.includes(role.code))
})

watch(visible, (val) => {
  if (val) fetchList()
  else reset()
})

const handleConfirm = () => {
  if (selectedTotal.value === 0) return
  emit("confirm", [...selectedList.value])
}

import { computed } from "vue"
</script>

<template>
  <ResourceSelectorLayout
    v-model="visible"
    v-model:keyword="query.keyword"
    v-model:current-page="pagination.currentPage"
    :title="title"
    :subtitle="subtitle"
    :header-icon="OfficeBuilding"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    search-placeholder="搜索角色名称、标识码..."
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
        :data="filteredList"
        height="100%"
        row-key="code"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column label="角色信息" min-width="220">
          <template #default="{ row }">
            <div class="role-row">
              <div class="role-icon">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="职责描述" min-width="300" show-overflow-tooltip />
        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <div class="type-tag" :class="{ 'is-system': row.type === 1 }">
              {{ row.type === 1 ? "系统预设" : "自定义" }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="role in selectedList" :key="role.code" class="entity-card">
        <div class="card-content">
          <div class="ok-mark">
            <el-icon><Check /></el-icon>
          </div>
          <div class="entity-info">
            <span class="entity-name">{{ role.name }}</span>
            <span class="entity-id">{{ role.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(role)"><Close /></el-icon>
        </div>
      </div>
    </template>

    <!-- 3. 自定义确认按钮 -->
    <template #footer-action>
      <el-button
        type="primary"
        class="prime-action role-theme-btn"
        :disabled="selectedTotal === 0"
        :loading="confirmLoading"
        @click="handleConfirm"
      >
        确认选择并建立继承关系
      </el-button>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$accent: #3b82f6;
$text-main: #0f172a;
$text-sub: #64748b;
$line: #e2e8f0;

.role-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .role-icon {
    width: 32px;
    height: 32px;
    background: #eff6ff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $accent;
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
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}

.type-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  &.is-system {
    background: #fef3c7;
    color: #92400e;
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

.role-theme-btn {
  width: 100%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}
</style>
