<template>
  <DataTable
    :data="data"
    :columns="columns"
    :show-selection="true"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    :table-props="{}"
    :loading="loading"
    @selection-change="emit('selection-change', $event)"
    @size-change="emit('size-change', $event)"
    @current-change="emit('current-change', $event)"
  >
    <template #groupName="{ row }">
      {{ formatGroup(row) }}
    </template>

    <template #createType="{ row }">
      <el-tag v-if="row.create_type === 1" effect="plain" type="primary" disable-transitions class="type-tag">
        系统自建
      </el-tag>
      <el-tag v-else-if="row.create_type === 2" effect="plain" type="warning" disable-transitions class="type-tag">
        企业微信
      </el-tag>
      <el-tag v-else type="info" effect="plain" disable-transitions class="type-tag">未知类型</el-tag>
    </template>

    <template #actions="{ row }">
      <OperateBtn :items="getOperateItems(row)" :operateItem="row" :maxLength="2" @routeEvent="emitOperateEvent" />
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import type { Column as DataTableColumn } from "@@/components/DataTable/types"
import type { template } from "@/api/ticket/template/types/template"
import type { TicketTemplateOperateItem } from "../types"

interface PaginationData {
  total: number
  pageSize: number
  currentPage: number
  pageSizes: number[]
  layout: string
}

withDefaults(
  defineProps<{
    data: template[]
    columns: DataTableColumn[]
    paginationData: PaginationData
    loading?: boolean
    formatGroup: (row: template) => string
    getOperateItems: (row: template) => TicketTemplateOperateItem[]
  }>(),
  {
    loading: false
  }
)

const emit = defineEmits<{
  (event: "selection-change", value: template[]): void
  (event: "size-change", value: number): void
  (event: "current-change", value: number): void
  (event: "operate", row: template, action: string): void
}>()

const emitOperateEvent = (row: template, action: string) => {
  emit("operate", row, action)
}
</script>

<style scoped lang="scss">
.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid;
  min-width: 60px;
  text-align: center;
  white-space: nowrap;
  display: inline-block;

  &.el-tag--primary {
    color: #3b82f6;
    background: #eff6ff;
    border-color: #dbeafe;
  }

  &.el-tag--warning {
    color: #d97706;
    background: #fef3c7;
    border-color: #fde68a;
  }

  &.el-tag--info {
    color: #6b7280;
    background: #f9fafb;
    border-color: #e5e7eb;
  }
}
</style>
