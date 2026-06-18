<template>
  <DataTable
    :data="data"
    :columns="columns"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    :loading="loading"
    :table-props="resolvedTableProps"
    @size-change="emit('size-change', $event)"
    @current-change="emit('current-change', $event)"
  >
    <template #templateName="{ row }">
      {{ templateToolsStore.getTemplateName(row.template_id) }}
    </template>

    <template #provide="{ row }">
      <span class="quiet-tag">{{ getProvideText(row.provide) }}</span>
    </template>

    <template #status="{ row }">
      <span class="quiet-tag" :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
    </template>

    <template #actions="{ row }">
      <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="emitOperateEvent" />
    </template>
  </DataTable>
</template>

<script lang="ts" setup>
import { computed } from "vue"
import type { Column, TableColumnCtx } from "element-plus"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import type { order } from "@/api/ticket/order/types/order"
import type { Column as DataTableColumn } from "@@/components/DataTable/types"
import type { TicketOperateItem, TicketOrderAction } from "../composables/types"

interface RowWithSpan {
  mergeCell?: string[]
  [key: `rowspan_${string}`]: number | undefined
}

const props = withDefaults(
  defineProps<{
    data: order[]
    columns: DataTableColumn[]
    paginationData: {
      total: number
      pageSize: number
      currentPage: number
      pageSizes: number[]
      layout: string
    }
    loading?: boolean
    spanMethod?: boolean
    getOperateItems: (row: order) => TicketOperateItem[]
  }>(),
  {
    loading: false,
    spanMethod: false
  }
)

const emit = defineEmits<{
  (event: "size-change", value: number): void
  (event: "current-change", value: number): void
  (event: "operate", row: order, action: TicketOrderAction): void
}>()

const templateToolsStore = useTemplateToolsStore()

const defaultTableProps = {
  stripe: false,
  border: true,
  "header-cell-style": { background: "#F6F6F6", height: "10px", "text-align": "center" }
}

const objectSpanMethod = ({ row, column }: { row: RowWithSpan; column: TableColumnCtx<Column> }) => {
  if (!row.mergeCell?.includes(column.property)) return

  const rowspan = row[`rowspan_${column.property}`]
  if (rowspan) {
    return { rowspan, colspan: 1 }
  }

  return { rowspan: 0, colspan: 0 }
}

const resolvedTableProps = computed(() => {
  if (!props.spanMethod) return defaultTableProps

  return {
    ...defaultTableProps,
    "span-method": objectSpanMethod
  }
})

const emitOperateEvent = (row: order, action: TicketOrderAction) => {
  emit("operate", row, action)
}

const getProvideText = (provide: number) => {
  const provideTextMap: Record<number, string> = {
    1: "本系统",
    2: "企业微信",
    3: "告警平台"
  }
  return provideTextMap[provide] || "未知类型"
}

const getStatusText = (status: number) => {
  const statusTextMap: Record<number, string> = {
    3: "结单",
    4: "撤单"
  }
  return statusTextMap[status] || "未知"
}

const getStatusClass = (status: number) => {
  if (status === 3) return "is-success"
  if (status === 4) return "is-danger"
  return ""
}
</script>

<style scoped lang="scss">
.quiet-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 8px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;

  &.is-success {
    color: #166534;
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  &.is-danger {
    color: #991b1b;
    background: #fef2f2;
    border-color: #fecaca;
  }
}
</style>
