<template>
  <DataTable
    :data="data"
    :columns="tableColumns"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    :loading="loading"
    @size-change="emit('size-change', $event)"
    @current-change="emit('current-change', $event)"
  >
    <template #ownerName="{ row }">
      {{ formatOwner(row) }}
    </template>

    <template #isNotify="{ row }">
      <span class="quiet-tag" :class="{ 'is-warning': !row.is_notify }">
        {{ row.is_notify ? "开启" : "关闭" }}
      </span>
    </template>

    <template #notifyMethod="{ row }">
      <span class="quiet-tag" :class="{ 'is-muted': !row.notify_method }">
        {{ getNotifyMethodText(row.notify_method) }}
      </span>
    </template>

    <template #actions="{ row }">
      <OperateBtn
        :items="workflowOperateItems"
        :operate-item="row"
        :max-length="2"
        @route-event="(data: Workflow, action: string) => emit('operate', data, action)"
      />
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import type { Column } from "@@/components/DataTable/types"
import type { Workflow } from "@/api/ticket/workflow/types/workflow"
import { workflowOperateItems } from "../composables/useWorkflowActions"

defineProps<{
  data: Workflow[]
  paginationData: {
    total: number
    pageSize: number
    currentPage: number
    pageSizes: number[]
    layout: string
  }
  loading: boolean
  formatOwner: (row: Workflow) => string
}>()

const emit = defineEmits<{
  (event: "size-change", value: number): void
  (event: "current-change", value: number): void
  (event: "operate", row: Workflow, action: string): void
}>()

const tableColumns: Column[] = [
  { prop: "name", label: "名称", showOverflowTooltip: true, align: "center" },
  { prop: "owner", label: "负责人", slot: "ownerName", align: "center" },
  { prop: "is_notify", label: "消息通知", slot: "isNotify", align: "center" },
  { prop: "notify_method", label: "发送媒介", slot: "notifyMethod", align: "center" },
  { prop: "desc", label: "描述", showOverflowTooltip: true, align: "center" }
]

const getNotifyMethodText = (method: number) => {
  const methodMap: Record<number, string> = {
    1: "飞书",
    2: "微信"
  }

  return methodMap[method] || "暂未开启"
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
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;

  &.is-warning {
    color: #b45309;
    background: #fffbeb;
    border-color: #fde68a;
  }

  &.is-muted {
    color: #64748b;
    background: #f8fafc;
    border-color: #e2e8f0;
  }
}
</style>
