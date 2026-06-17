<template>
  <ProGovernanceLayout
    v-model:keyword="searchQuery"
    title="任务状态"
    subtitle="查看自动化任务执行历史和状态"
    search-placeholder="搜索工单ID或模板标识"
    @refresh="fetchTasksData"
  >
    <TaskHistoryTable
      :data="tasksData"
      :columns="taskHistoryColumns"
      :operate-items="taskHistoryOperateItems"
      :pagination-data="paginationData"
      :loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @operate="handleOperateEvent"
    />

    <TaskResultDialog
      v-model="resultVisible"
      :result="result"
      :language="language"
      :type="currentDialogType"
      :task-id="taskId"
      @closed="onResultDialogClosed"
      @save="handleSaveResult"
    />

    <TaskRetryDialog
      v-model="retryDialogVisible"
      :task-id="taskId"
      width="400px"
      :loading="retryLoading"
      @confirm="handleRetryConfirm"
    />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import TaskHistoryTable from "./components/TaskHistoryTable.vue"
import TaskResultDialog from "./components/TaskResultDialog.vue"
import TaskRetryDialog from "./components/TaskRetryDialog.vue"
import { useTaskHistory } from "./composables/useTaskHistory"
import { useTaskHistoryActions, taskHistoryOperateItems } from "./composables/useTaskHistoryActions"
import { taskHistoryColumns } from "./composables/useTaskHistoryColumns"

const { tasksData, loading, searchQuery, paginationData, fetchTasksData, handleCurrentChange, handleSizeChange } =
  useTaskHistory()

const {
  taskId,
  result,
  language,
  resultVisible,
  currentDialogType,
  retryDialogVisible,
  retryLoading,
  handleOperateEvent,
  onResultDialogClosed,
  handleSaveResult,
  handleRetryConfirm
} = useTaskHistoryActions({
  refresh: fetchTasksData
})
</script>
