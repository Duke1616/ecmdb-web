<template>
  <PageContainer>
    <!-- 头部区域，加入搜索功能 -->
    <ManagerHeader
      title="任务历史"
      subtitle="查看任务执行历史和状态"
      :show-add-button="false"
      v-model="searchQuery"
      show-search
      placeholder="搜索工单码或任务名称"
      @refresh="fetchTasksData"
    />

    <!-- 主内容区域 -->
    <DataTable
      v-loading="loading"
      :data="tasksData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 执行目标插槽：区分 KAFKA 和 GRPC 模式 -->
      <!-- 模式列插槽：独立展示 @EXECUTOR / @KAFKA -->
      <template #kind="{ row }">
        <div class="kind-cell">
          <span v-if="row.kind === Kind.KAFKA" class="target-badge kafka">@KAFKA</span>
          <span v-else-if="row.kind === Kind.GRPC" class="target-badge grpc">@EXECUTOR</span>
          <span v-else class="target-empty">--</span>
        </div>
      </template>

      <!-- 执行目标插槽：展示目标与逻辑 -->
      <template #execute_target="{ row }">
        <div class="execute-target-cell">
          <div class="target-text-group">
            <el-tooltip :content="row.target" placement="top" :show-after="500">
              <span class="target-main">{{ row.target }}</span>
            </el-tooltip>
            <span class="target-sep">/</span>
            <el-tooltip :content="row.handler" placement="top" :show-after="500">
              <span class="target-handler">{{ row.handler }}</span>
            </el-tooltip>
          </div>
        </div>
      </template>

      <!-- 状态列插槽：优化展示效果 -->
      <template #status="{ row }">
        <div class="status-cell">
          <EnumTag :value="row.status" :map="STATUS_MAP" effect="light" round />
        </div>
      </template>

      <!-- 定时任务列插槽 -->
      <template #is_timing="{ row }">
        <el-tag :type="row.is_timing ? 'primary' : 'info'" size="small" effect="plain" class="type-tag">
          {{ row.is_timing ? "定时任务" : "即时任务" }}
        </el-tag>
      </template>

      <!-- 执行时间列插槽 -->
      <template #run_time="{ row }">
        <div v-if="row.is_timing" class="time-info">
          <div v-if="row.scheduled_time" class="time-item plan">
            <span class="label">计:</span> {{ row.scheduled_time }}
          </div>
          <div v-if="row.start_time" class="time-item start"><span class="label">始:</span> {{ row.start_time }}</div>
        </div>
        <span v-else class="time-text">{{ row.start_time || "--" }}</span>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="OPERATE_BUTTONS" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 抽取的任务结果查看对话框 -->
    <TaskResultDialog
      v-model="resultVisible"
      :result="result"
      :language="language"
      :type="currentDialogType"
      :task-id="taskId"
      @closed="onResultDialogClosed"
      @save="handleSaveResult"
    />

    <!-- 任务重试确认对话框 -->
    <TaskRetryDialog
      v-model="retryDialogVisible"
      :task-id="taskId"
      width="400px"
      :loading="retryLoading"
      @confirm="handleRetryConfirm"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { task, Kind } from "@/api/task/types/task"
import { retryTaskApi, updateTaskArgsApi, updateTaskVariablesApi, getTaskLogsApi } from "@/api/task"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { ElMessage } from "element-plus"
import EnumTag from "@/common/components/EnumTag/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import TaskResultDialog from "./components/TaskResultDialog.vue"
import TaskRetryDialog from "./components/TaskRetryDialog.vue"
import { useTaskHistory } from "./composables/useTaskHistory"
import type { Column } from "@@/components/DataTable/types"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"

// 定义映射信息 (与 task.vue 保持同步，优化色彩)
const STATUS_MAP: Record<number, TagInfo> = {
  0: { type: "info", text: "未知" },
  1: { type: "success", text: "成功", color: "#10b981" },
  2: { type: "danger", text: "失败", color: "#ef4444" },
  3: { type: "primary", text: "运行中", color: "#3b82f6" },
  4: { type: "info", text: "等待中", color: "#64748b" },
  5: { type: "warning", text: "已挂起", color: "#f59e0b" },
  6: { type: "primary", text: "就绪中", color: "#8b5cf6" },
  7: { type: "warning", text: "重试中", color: "#f97316" }
}

const OPERATE_BUTTONS = [
  { name: "输入", code: "input", icon: "Document", type: "info" },
  { name: "输出", code: "output", icon: "Monitor", type: "success" },
  { name: "参数", code: "args", icon: "Setting", type: "primary" },
  { name: "变量", code: "variables", icon: "CollectionTag", type: "warning" },
  { name: "重试", code: "retry", icon: "Refresh", type: "danger" }
]

const { tasksData, loading, searchQuery, paginationData, fetchTasksData, handleCurrentChange, handleSizeChange } =
  useTaskHistory()

// 表格配置
const tableColumns: Column[] = [
  { prop: "order_id", label: "工单号", width: 100, align: "center" },
  { prop: "codebook_name", label: "任务模板", minWidth: 150 },
  { prop: "kind", label: "模式", slot: "kind", width: 110, align: "center" },
  { prop: "execute_target", label: "执行目标", slot: "execute_target", minWidth: 180, align: "center" },
  { prop: "status", label: "状态", slot: "status", minWidth: 120, align: "center" },
  { prop: "is_timing", label: "类型", slot: "is_timing", minWidth: 100, align: "center" },
  { prop: "run_time", label: "时间线", slot: "run_time", minWidth: 180, align: "center" }
]

// 交互逻辑
const selectedRows = ref<task[]>([])
const handleSelectionChange = (selection: task[]) => {
  selectedRows.value = selection
}

const taskId = ref<number>(0)
const result = ref<any>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)
const currentDialogType = ref<"input" | "output" | "args" | "variables">("input")
const retryDialogVisible = ref<boolean>(false)
const retryLoading = ref<boolean>(false)

/**
 * 处理操作按钮事件
 */
const handleOperateEvent = async (data: task, code: string) => {
  taskId.value = data.id

  switch (code) {
    case "input":
      result.value = data.code
      language.value = data.language
      currentDialogType.value = "input"
      resultVisible.value = true
      break
    case "output":
      try {
        const { data: logs } = await getTaskLogsApi(data.id)
        result.value = logs
        language.value = "text"
        currentDialogType.value = "output"
        resultVisible.value = true
      } catch (e) {
        ElMessage.error("日志拉取失败")
      }
      break
    case "args":
      result.value = data.args ? JSON.parse(data.args) : {}
      currentDialogType.value = "args"
      language.value = "json"
      resultVisible.value = true
      break
    case "variables":
      result.value = data.variables ? JSON.parse(data.variables) : {}
      currentDialogType.value = "variables"
      language.value = "json"
      resultVisible.value = true
      break
    case "retry":
      retryDialogVisible.value = true
      break
  }
}

const onResultDialogClosed = () => {
  result.value = ""
  language.value = ""
  resultVisible.value = false
  taskId.value = 0
}

const handleSaveResult = async (payload: { taskId: number; result: any; type: string }) => {
  try {
    if (payload.type === "args") {
      await updateTaskArgsApi({ id: payload.taskId, args: payload.result })
    } else {
      await updateTaskVariablesApi({ id: payload.taskId, variables: JSON.stringify(payload.result) })
    }
    ElMessage.success("修改成功")
    fetchTasksData()
  } catch (error) {
    ElMessage.error("保存失败")
  }
}

const handleRetryConfirm = async () => {
  retryLoading.value = true
  try {
    await retryTaskApi(taskId.value)
    ElMessage.success("重试已提交，请稍后查看结果")
    retryDialogVisible.value = false
    fetchTasksData()
  } catch (error: any) {
    ElMessage.error(error.msg || "重试任务失败")
  } finally {
    retryLoading.value = false
  }
}
</script>

<style scoped lang="scss">
// 任务历史页面样式优化
.task-history-container {
  .el-table {
    .el-table__header {
      th {
        background: #f8fafc;
        color: #374151;
        font-weight: 600;
      }
    }

    .el-table__row {
      &:hover {
        background: #f8fafc;
      }

      td {
        height: auto !important;
        min-height: calc(2.6rem + 0.4vw);
      }
    }
  }
}

// 操作按钮样式优化
.operate-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .el-button {
    font-size: 12px;
    padding: 4px 8px;
    height: auto;
    min-height: 28px;
  }
}

// 状态标签样式优化
.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

// 时间显示样式优化
.time-display {
  font-family: "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: #6b7280;
}

.kind-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.target-badge {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &.kafka {
    background: #3b82f6;
    color: white;
  }

  &.grpc {
    background: #64748b;
    color: white;
  }
}

.execute-target-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 0;

  .target-text-group {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;

    .target-main {
      font-weight: 500;
      color: #94a3b8;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .target-sep {
      color: #e2e8f0;
      font-weight: bold;
      margin: 0 2px;
    }

    .target-handler {
      font-weight: 700;
      color: #1e293b;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .target-empty {
    color: #cbd5e1;
  }
}

.status-cell {
  display: flex;
  justify-content: center;
  width: 100%;
}

.type-tag {
  letter-spacing: 1px;
}

.time-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;

  .time-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    border-radius: 4px;

    &.plan {
      background: #f0f9ff;
      color: #0369a1;
    }

    &.start {
      background: #fdf2f8;
      color: #be185d;
    }

    .label {
      opacity: 0.6;
      font-weight: bold;
    }
  }
}

.time-text {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: #4b5563;
}

:deep(.el-tag--light) {
  border-width: 0;
  font-weight: 600;
}
</style>
