<template>
  <DataTable
    v-loading="loading"
    :data="data"
    :columns="columns"
    :show-selection="true"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :page-sizes="paginationData.pageSizes"
    :pagination-layout="paginationData.layout"
    @size-change="emit('size-change', $event)"
    @current-change="emit('current-change', $event)"
  >
    <template #execute_target="{ row }">
      <TaskHistoryExecuteTarget :target="row.target" :handler="row.handler" />
    </template>

    <template #status="{ row }">
      <TaskHistoryStatusBadge :status="row.status" />
    </template>

    <template #is_timing="{ row }">
      <span class="type-tag">{{ row.is_timing ? "定时任务" : "即时任务" }}</span>
    </template>

    <template #run_time="{ row }">
      <TaskHistoryRunTime
        :is-timing="row.is_timing"
        :scheduled-time="row.scheduled_time"
        :start-time="row.start_time"
      />
    </template>

    <template #actions="{ row }">
      <OperateBtn :items="operateItems" :operateItem="row" :maxLength="2" @routeEvent="emitOperateEvent" />
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import TaskHistoryExecuteTarget from "./TaskHistoryExecuteTarget.vue"
import TaskHistoryStatusBadge from "./TaskHistoryStatusBadge.vue"
import TaskHistoryRunTime from "./TaskHistoryRunTime.vue"
import type { Column as DataTableColumn } from "@@/components/DataTable/types"
import type { task } from "@/api/ticket/task/types/task"
import type { TaskHistoryOperateItem } from "../types"

interface PaginationData {
  total: number
  pageSize: number
  currentPage: number
  pageSizes: number[]
  layout: string
}

interface Props {
  data: task[]
  columns: DataTableColumn[]
  operateItems: TaskHistoryOperateItem[]
  paginationData: PaginationData
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (event: "size-change", value: number): void
  (event: "current-change", value: number): void
  (event: "operate", row: task, action: string): void
}>()

const emitOperateEvent = (row: task, action: string) => {
  emit("operate", row, action)
}
</script>

<style scoped lang="scss">
.type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 24px;
  padding: 0 8px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>
