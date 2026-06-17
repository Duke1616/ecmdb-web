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
      <el-tag v-if="row.provide === 1" effect="plain" type="primary" disable-transitions>本系统</el-tag>
      <el-tag v-else-if="row.provide === 2" effect="plain" type="warning" disable-transitions>企业微信</el-tag>
      <el-tag v-else-if="row.provide === 3" effect="plain" type="warning" disable-transitions>告警平台</el-tag>
      <el-tag v-else type="info" effect="plain" disable-transitions>未知类型</el-tag>
    </template>

    <template #status="{ row }">
      <el-tag v-if="row.status === 4" effect="plain" type="danger" disable-transitions>撤单</el-tag>
      <el-tag v-else-if="row.status === 3" effect="plain" type="success" disable-transitions>结单</el-tag>
      <el-tag v-else type="info" effect="plain" disable-transitions>未知</el-tag>
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
</script>
