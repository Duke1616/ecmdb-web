<template>
  <div class="table-container-card" v-loading="loading" element-loading-text="正在加载资产明细...">
    <DataTable
      :data="rows"
      :columns="columns"
      :loading="false"
      :show-pagination="true"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current-page="pagination.currentPage"
      :page-sizes="pagination.pageSizes"
      :pagination-layout="pagination.layout"
      :actions="actions"
      action-column-width="96"
      action-column-fixed="right"
      @action="(key: string, row: any) => emit('action', key, row)"
      @size-change="(size: number) => emit('sizeChange', size)"
      @current-change="(page: number) => emit('currentChange', page)"
    >
      <!-- 资产名称列插槽渲染 -->
      <template #name="{ row }">
        <span
          class="field-content asset-name-text"
          :class="{ 'text-highlight': isValueMatched(row.name) }"
          :title="row.name || '-'"
        >
          {{ row.name || "-" }}
        </span>
      </template>

      <!-- 动态属性列插槽渲染 -->
      <template v-for="field in displayFields" :key="field.field_uid" #[`${field.field_uid}`]="{ row }">
        <div class="search-table-cell">
          <!-- 敏感脱敏字段：密码类字段一键复制，多行文本类字段一键查看 -->
          <SecureFieldView
            v-if="field.secure"
            :content="row[field.field_uid]"
            :is-displaying="!!row[`${field.field_uid}_secure_display`]"
            :copy-only="field.field_type !== 'multiline'"
            @view-click="emit('secureClick', row, field.field_uid)"
            @display-change="(isDisplaying: boolean) => emit('secureDisplayChange', row, field.field_uid, isDisplaying)"
          />

          <!-- 文件附件字段 -->
          <ResourceTableFileUpload
            v-else-if="field.field_type === 'file'"
            :model-value="Array.isArray(row[field.field_uid]) ? row[field.field_uid] : []"
            :field-uid="field.field_uid"
            :row="normalizeResourceRow(row)"
            :limit="5"
            disabled
          />

          <!-- 字符串/列表/其他字段：支持搜索关键词高亮 -->
          <span
            v-else
            class="field-content"
            :class="{ 'text-highlight': isValueMatched(row[field.field_uid]) }"
            :title="String(row[field.field_uid] ?? '-')"
          >
            {{ row[field.field_uid] ?? "-" }}
          </span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import DataTable from "@/common/components/DataTable/index.vue"
import type { Action, Column } from "@/common/components/DataTable/types"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"
import ResourceTableFileUpload from "@/pages/cmdb/resource/components/ResourceTableFileUpload.vue"
import type { IResolvedFieldItem } from "../types"

interface ResourceTableProps {
  loading: boolean
  rows: any[]
  columns: Column[]
  displayFields: IResolvedFieldItem[]
  pagination: {
    total: number
    pageSize: number
    currentPage: number
    pageSizes: number[]
    layout: string
  }
  actions: Action[]
  isValueMatched: (val: any) => boolean
}

defineProps<ResourceTableProps>()

const emit = defineEmits<{
  (e: "action", key: string, row: any): void
  (e: "sizeChange", size: number): void
  (e: "currentChange", page: number): void
  (e: "secureClick", row: any, fieldUid: string): void
  (e: "secureDisplayChange", row: any, fieldUid: string, isDisplaying: boolean): void
}>()

const normalizeResourceRow = (row: any) => ({ ...row, data: row })
</script>

<style scoped lang="scss">
.table-container-card {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.manager-content) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
  }

  :deep(.content-card) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-shadow: none;
    border: none;
    border-radius: 0;
    margin: 0;
  }

  :deep(.data-table-container) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.table-wrapper) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  :deep(.pagination-container) {
    padding: 12px 16px;
    border-top: 1px solid #f1f5f9;
    background: #ffffff;
  }
}

.search-table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.field-content {
  display: inline-block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #334155;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.asset-name-text {
    font-weight: 600;
    color: #0f172a;
  }

  &.text-highlight {
    color: #dc2626;
    background-color: #fee2e2;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid #fca5a5;
  }
}
</style>
