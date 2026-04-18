<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import type { Tenant } from "@/api/iam/tenant/type"

defineProps<{
  loading: boolean
  data: Tenant[]
  total: number
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  search: [keyword: string]
  add: []
}>()
</script>

<template>
  <PremiumList
    title="已入驻租户"
    search-placeholder="搜索租户名称或标识符"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    indicator-color="#3b82f6"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 头部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>关联更多空间</span>
      </el-button>
    </template>
    <!-- 表头定义 -->
    <template #column-header>
      <div class="tenant-cols header-label-font">
        <span>租户主体</span>
        <span class="label-with-padding">空间标识</span>
        <span class="label-with-padding">入驻域名</span>
      </div>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="tenant-grid-row">
        <div class="cell-identity">
          <div class="meta-info">
            <span class="name">{{ row.name }}</span>
          </div>
        </div>

        <div class="cell-code">
          <div class="code-wrapper">
            <code>{{ row.code }}</code>
          </div>
        </div>

        <div class="cell-domain">
          <span class="domain-text">{{ row.domain || "-" }}</span>
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
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }
}

/* 表头字体统一规范 */
.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.tenant-cols {
  display: grid;
  grid-template-columns: minmax(260px, 1.3fr) minmax(240px, 1.5fr) 1fr;
  gap: 24px;
  width: 100%;
  align-items: center;

  .label-with-padding {
    padding-left: 8px;
  }
}

.tenant-grid-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.3fr) minmax(240px, 1.5fr) 1fr;
  align-items: center;
  gap: 24px;
  min-height: 76px;
}

.cell-identity {
  display: flex;
  align-items: center;
  min-width: 0;

  .meta-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
    .name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.cell-code {
  display: flex;
  align-items: center;
  min-width: 0;
  .code-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #475569;
    code {
      font-family: ui-monospace, SFMono-Regular, monospace;
      background: #f8fafce6;
      padding: 2px 8px;
      border-radius: 4px;
      color: #334155;
      font-weight: 500;
    }
  }
}

.cell-domain {
  display: flex;
  align-items: center;
  min-width: 0;
  .domain-text {
    font-size: 13px;
    color: #64748b;
    padding-left: 8px;
  }
}

@media (max-width: 1200px) {
  .tenant-cols,
  .tenant-grid-row {
    grid-template-columns: minmax(220px, 1fr) minmax(200px, 1fr) 1fr;
    gap: 16px;
  }
}
</style>
