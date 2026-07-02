<script setup lang="ts">
import { watch } from "vue"
import { Close, OfficeBuilding } from "@element-plus/icons-vue"
import { listTenantsApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 租户选择器 (公共组件)
 * 采用统一的 ResourceSelectorLayout 架构，支持全量租户检索、分页及多选
 */

const visible = defineModel<boolean>({ default: false })

interface TenantSelectProps {
  confirmLoading?: boolean
  title?: string
  subtitle?: string
  confirmText?: string
}

withDefaults(defineProps<TenantSelectProps>(), {
  title: "选择关联租户",
  subtitle: "检索并选择目标租户空间，建立身份映射关系",
  confirmText: "确认加入"
})

const emit = defineEmits<{
  confirm: [selectedTenants: Tenant[]]
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
} = useResourceSelector<Tenant, { keyword: string }>({
  fetchApi: listTenantsApi,
  listKey: "tenants",
  rowKey: (row: Tenant) => String(row.id),
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
    :header-icon="OfficeBuilding"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    search-placeholder="搜索租户名称、空间编码..."
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
        <el-table-column label="租户实体" min-width="240">
          <template #default="{ row }">
            <div class="tenant-row">
              <div class="u-meta">
                <span class="name">{{ row.name }}</span>
                <span class="id">{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="domain" label="身份域名" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="{ 'is-active': row.status === 1 }">
              {{ row.status === 1 ? "运行中" : "已停用" }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="item in selectedList" :key="item.id" class="resource-entity-card">
        <div class="card-content">
          <div class="entity-info">
            <span class="entity-name">{{ item.name }}</span>
            <span class="entity-id">{{ item.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(item)"><Close /></el-icon>
        </div>
      </div>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$text-main: #0f172a;
$text-sub: #64748b;

.tenant-row {
  display: flex;
  align-items: center;
  gap: 12px;
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

.status-tag {
  font-size: 11px;
  padding: 1px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  &.is-active {
    background: #ecfdf5;
    color: #059669;
  }
}
</style>
