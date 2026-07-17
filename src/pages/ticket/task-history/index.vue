<template>
  <ProGovernanceLayout
    title="自动化任务"
    subtitle="查看流程节点状态，并进入执行控制台追踪每次运行"
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

    <TaskAttemptDialog v-model="attemptDialogVisible" :task-id="taskId" />

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
import TaskAttemptDialog from "./components/TaskAttemptDialog.vue"
import TaskRetryDialog from "./components/TaskRetryDialog.vue"
import { useTaskHistory } from "./composables/useTaskHistory"
import { useTaskHistoryActions, taskHistoryOperateItems } from "./composables/useTaskHistoryActions"
import { taskHistoryColumns } from "./config"

const { tasksData, loading, paginationData, fetchTasksData, handleCurrentChange, handleSizeChange } = useTaskHistory()

const { taskId, attemptDialogVisible, retryDialogVisible, retryLoading, handleOperateEvent, handleRetryConfirm } =
  useTaskHistoryActions({
    refresh: fetchTasksData
  })
</script>
