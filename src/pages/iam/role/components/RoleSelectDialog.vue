<script setup lang="ts">
import { watch, computed } from "vue"
import { Close, OfficeBuilding } from "@element-plus/icons-vue"
import { listRolesApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 角色选择器 (通用版)
 */

const visible = defineModel<boolean>({ default: false })

interface RoleSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
  excludeCodes?: string[]
}

const props = withDefaults(defineProps<RoleSelectProps>(), {
  title: "选择角色对象",
  subtitle: "检索并选择业务角色，实现权限的批量继承或关联",
  confirmText: "确认选择",
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
  fetchApi: listRolesApi,
  listKey: "roles",
  rowKey: (row: Role) => row.code,
  initialQuery: { keyword: "" }
})

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
    :confirm-text="confirmText"
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
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="260" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <span class="type-tag" :class="{ 'is-system': row.type === 1 }">
              {{ row.type === 1 ? "系统" : "自定义" }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="role in selectedList" :key="role.code" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ role.name }}</span>
            <span class="entity-id">{{ role.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(role)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.role-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .role-icon {
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
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}

.type-tag {
  font-size: 11px;
  padding: 1px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  &.is-system {
    background: #eff6ff;
    color: #2563eb;
  }
}
</style>
