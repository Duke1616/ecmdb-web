<template>
  <DataTable
    v-loading="loading"
    :data="data"
    :columns="columns"
    :show-selection="false"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    @size-change="emit('size-change', $event)"
    @current-change="emit('current-change', $event)"
  >
    <template #node="{ row }">
      <el-tooltip :content="row.node_id" placement="top" :show-after="400">
        <span class="node-name">{{ row.node_name || "自动化任务" }}</span>
      </el-tooltip>
    </template>

    <template #ticket="{ row }">
      <span class="ticket-no">#{{ row.ticket_id }}</span>
    </template>

    <template #status="{ row }">
      <TaskHistoryStatusBadge :status="row.status" :phase="row.phase" :scheduled-at="row.scheduled_at" />
    </template>

    <template #phase="{ row }">
      <el-tooltip :disabled="!row.last_error" :content="row.last_error" placement="top" :show-after="300">
        <span class="phase-text" :class="{ 'has-error': row.last_error }">
          <i />{{ formatAutomationTaskPhase(row.phase) }}
        </span>
      </el-tooltip>
    </template>

    <template #scheduled_at="{ row }">
      <span>{{ formatTime(row.scheduled_at) }}</span>
    </template>

    <template #utime="{ row }">
      <span>{{ formatTime(row.utime) }}</span>
    </template>

    <template #actions="{ row }">
      <OperateBtn :items="getOperateItems(row)" :operateItem="row" :maxLength="2" @routeEvent="emitOperateEvent" />
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import TaskHistoryStatusBadge from "./TaskHistoryStatusBadge.vue"
import dayjs from "dayjs"
import type { Column as DataTableColumn } from "@@/components/DataTable/types"
import { AutomationTaskStatus, type AutomationTask } from "@/api/ticket/task/types/task"
import type { TaskHistoryOperateItem } from "../types"
import { formatAutomationTaskPhase } from "../config"

interface PaginationData {
  total: number
  pageSize: number
  currentPage: number
  pageSizes: number[]
  layout: string
}

interface Props {
  data: AutomationTask[]
  columns: DataTableColumn[]
  operateItems: TaskHistoryOperateItem[]
  paginationData: PaginationData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (event: "size-change", value: number): void
  (event: "current-change", value: number): void
  (event: "operate", row: AutomationTask, action: string): void
}>()

const emitOperateEvent = (row: AutomationTask, action: string) => {
  emit("operate", row, action)
}

const formatTime = (value: number) => (value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-")

const getOperateItems = (row: AutomationTask) =>
  props.operateItems.map((item) =>
    item.code === "retry"
      ? {
          ...item,
          disabled: ![AutomationTaskStatus.Failed, AutomationTaskStatus.Blocked].includes(row.status)
        }
      : item
  )
</script>

<style scoped lang="scss">
.node-name {
  display: block;
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-no {
  color: #64748b;
  font-size: 13px;
}

.phase-text {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #475569;
  font-size: 12px;

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
  }

  &.has-error {
    color: #dc2626;

    i {
      background: #ef4444;
    }
  }
}
</style>
