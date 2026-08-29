<template>
  <ProGovernanceLayout
    title="调度任务管理"
    subtitle="集中配置与监控单次任务和周期任务"
    :primary-action="{ capability: TASK_CAPABILITIES.Manager.Add, label: '添加任务' }"
    @refresh="loadData"
    @primary-action="handleCreate"
  >
    <!-- 自定义搜索栏 -->
    <template #search>
      <div class="search-command-inner">
        <el-input
          v-model="query.query"
          placeholder="搜索任务名称..."
          class="command-input"
          clearable
          @keyup.enter="handleRefresh"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>

        <div class="divider" />

        <el-select v-model="typeFilter" placeholder="执行类型" clearable class="command-select">
          <el-option label="周期任务" :value="TaskType.RECURRING" />
          <el-option label="单次任务" :value="TaskType.ONE_TIME" />
        </el-select>
      </div>
    </template>

    <!-- 数据列表 -->
    <DataTable v-bind="tableProps" :columns="tableColumns">
      <!-- 任务名称 -->
      <template #name="{ row }">
        <div class="minimal-name-info">
          <span class="main-title">{{ formatTaskName(row.name) }}</span>
        </div>
      </template>

      <!-- 类型 -->
      <template #type="{ row }">
        <span class="task-type" :class="row.type === TaskType.RECURRING ? 'is-recurring' : 'is-one-time'">
          <i class="task-type-dot" />
          {{ row.type === TaskType.RECURRING ? "周期任务" : "单次任务" }}
        </span>
      </template>

      <!-- 下次运行 -->
      <template #next_time="{ row }">
        <span v-if="row.next_time" class="code-font next-time-text">
          {{ formatTimestamp(row.next_time) }}
        </span>
        <span v-else>-</span>
      </template>

      <!-- 状态列: 引入 StatusBadge 增强极致排版视觉效果 -->
      <template #status="{ row }">
        <StatusBadge size="default" :type="getStatusType(row.status)" :label="getStatusLabel(row.status)" />
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="handleAction" />
      </template>
    </DataTable>

    <!-- 任务自治表单抽屉 -->
    <TaskDrawer
      v-model="formVisible"
      :task-id="currentEditId!"
      :clone-task-id="cloneTaskId!"
      @success="handleFormSuccess"
    />

    <!-- 运行历史与日志弹窗 -->
    <TaskExecutionDialog v-if="logVisible" v-model="logVisible" :task-id="logTaskId" :task-name="logTaskName" />

    <!-- 任务运行确认弹窗 -->
    <TaskRunDialog v-model="runVisible" :task="runTask" :on-submit="submitRunTask" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Search, VideoPause, VideoPlay, Monitor, Edit, Delete, CopyDocument } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import TaskDrawer from "./components/TaskDrawer.vue"
import TaskExecutionDialog from "./components/TaskExecutionDialog.vue"
import TaskRunDialog from "./components/TaskRunDialog.vue"
import StatusBadge, { type StatusBadgeType } from "@/common/components/StatusBadge/index.vue"
import { TaskType, TaskStatus, type TaskItem } from "@/api/task/manager/type"
import type { TaskStatusEvent } from "@/api/task/manager"
import { useTaskManager } from "./composables/useTaskManager"
import { useTaskSSE } from "./composables/useTaskSSE"
import type { Column } from "@@/components/DataTable/types"
import { formatTimestamp } from "@@/utils/day"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"

const {
  tasksData,
  total,
  currentPage,
  pageSize,
  loading,
  query,
  formVisible,
  currentEditId,
  cloneTaskId,
  logVisible,
  logTaskId,
  logTaskName,
  runVisible,
  runTask,
  loadData,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleClone,
  handleDelete,
  handleLogs,
  handleRunTask,
  submitRunTask,
  handleStopTask,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useTaskManager()
const { hasPermission } = usePermission()

// 仅接受比当前列表更新的事件，避免 SSE 重连/跨节点转发时旧状态回写。
const applyTaskStatusEvent = (event: TaskStatusEvent) => {
  const task = tasksData.value.find((t) => t.id === event.task_id)
  if (!task || event.version <= task.version) return

  Object.assign(task, {
    status: event.status,
    next_time: event.next_time,
    version: event.version
  })
}

// SSE 只做对应行的局部更新，不触发表格 Loading。
useTaskSSE(applyTaskStatusEvent)

// --- 前端类型过滤 ---
const typeFilter = ref<string | null>(null)

const filteredTasks = computed(() => {
  if (!typeFilter.value) return tasksData.value
  return tasksData.value.filter((t) => t.type === typeFilter.value)
})

/** 打包表格通用属性，实现模板瘦身 */
const tableProps = computed(() => ({
  loading: loading.value,
  data: filteredTasks.value,
  total: total.value,
  pageSize: pageSize.value,
  currentPage: currentPage.value,
  showSelection: false,
  showPagination: true,
  onSizeChange: handleSizeChange,
  onCurrentChange: handleCurrentChange
}))

const tableColumns: Column[] = [
  { prop: "name", label: "任务名称", slot: "name", align: "center" },
  { prop: "status", label: "状态", slot: "status", align: "center" },
  { prop: "type", label: "类型", slot: "type", align: "center" },
  { prop: "cron_expr", label: "调度周期", align: "center" },
  { prop: "next_time", label: "下次运行时间", slot: "next_time", align: "center" }
]

// --- 格式化 & 语义化 ---
const formatTaskName = (name: string) => name.split("_")[0] || name

const STATUS_META: Record<TaskStatus, { label: string; type: StatusBadgeType }> = {
  [TaskStatus.COMPLETED]: { label: "已完成", type: "success" },
  [TaskStatus.ACTIVE]: { label: "等待调度", type: "primary" },
  [TaskStatus.INACTIVE]: { label: "停止执行", type: "info" },
  [TaskStatus.PREEMPTED]: { label: "已抢占", type: "warning" }
}

const getStatusType = (status: TaskStatus): StatusBadgeType => STATUS_META[status]?.type || "info"
const getStatusLabel = (status: TaskStatus) => STATUS_META[status]?.label || status

/** 操作按钮配置 */
const getOperateItems = (row: TaskItem) => {
  const isActive = row.status === TaskStatus.ACTIVE

  return [
    {
      name: isActive ? "停止" : "执行",
      code: isActive ? "stop" : "run",
      icon: isActive ? VideoPause : VideoPlay,
      type: isActive ? "warning" : "success",
      capability: isActive ? TASK_CAPABILITIES.Manager.Stop : TASK_CAPABILITIES.Manager.Start
    },
    { name: "记录", code: "logs", icon: Monitor, type: "info", capability: TASK_CAPABILITIES.Manager.Logs },
    { name: "编辑", code: "edit", icon: Edit, type: "primary", capability: TASK_CAPABILITIES.Manager.Edit },
    {
      name: "克隆",
      code: "clone",
      icon: CopyDocument,
      type: "primary",
      capability: TASK_CAPABILITIES.Manager.Add,
      disabled: !hasPermission(TASK_CAPABILITIES.Manager.Detail)
    },
    { name: "删除", code: "delete", icon: Delete, type: "danger", capability: TASK_CAPABILITIES.Manager.Delete }
  ]
}

type TaskActionCode = "edit" | "clone" | "logs" | "run" | "stop" | "delete"

const taskActionHandlers: Record<TaskActionCode, (row: TaskItem) => void> = {
  edit: handleEdit,
  clone: handleClone,
  logs: handleLogs,
  run: handleRunTask,
  stop: (row) => handleStopTask(row.id),
  delete: handleDelete
}

const handleAction = (row: TaskItem, code: string) => {
  taskActionHandlers[code as TaskActionCode]?.(row)
}
</script>

<style scoped lang="scss">
.search-command-inner {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 0 12px;
  flex: 1;
  max-width: 680px;
  height: 38px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }

  .command-input {
    width: 240px;
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      background: transparent;
      padding: 0;
    }
    .search-icon {
      color: #94a3b8;
      font-size: 16px;
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
    margin: 0 8px;
    flex-shrink: 0;
  }

  .command-select {
    width: 120px;
    :deep(.el-select__wrapper) {
      box-shadow: none !important;
      background: transparent;
      padding: 0 8px;

      .el-select__placeholder {
        color: #64748b;
        font-size: 13px;
      }
    }
  }
}

.minimal-name-info {
  display: flex;
  align-items: center;
  justify-content: center;
  .main-title {
    font-weight: 600;
    font-size: 14px;
    color: #0f172a;
  }
}

.task-type {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.task-type-dot {
  width: 7px;
  height: 7px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.task-type.is-recurring .task-type-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.next-time-text {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 600;
}
.code-font {
  font-family: var(--el-font-family-mono);
}
:deep(.el-table__row):hover {
  background: #f8fafc !important;
}
</style>
