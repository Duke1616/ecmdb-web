<template>
  <div class="task-list-container" v-loading="loading">
    <el-empty v-if="tasksData.length === 0" :image-size="160" description="暂无自动化任务" />
    <div v-else class="task-list">
      <article v-for="row in tasksData" :key="row.id" class="task-card" :class="`is-${statusTone(row.status)}`">
        <i class="task-card__rail" />
        <div class="task-card__body">
          <header class="task-card__head">
            <div class="task-card__identity">
              <span class="task-card__icon"
                ><el-icon><Operation /></el-icon
              ></span>
              <div class="task-card__identity-content">
                <div class="task-card__title">{{ row.node_name || `自动化任务 #${row.id}` }}</div>
                <div class="task-card__node" :title="row.node_id">
                  <span>Task #{{ row.id }}</span
                  >{{ row.node_id }}
                  <em>流程 v{{ row.process_version || "-" }}</em>
                </div>
              </div>
            </div>
            <TaskHistoryStatusBadge :status="row.status" :phase="row.phase" :scheduled-at="row.scheduled_at" />
          </header>
          <div class="task-card__meta">
            <span class="phase-chip"><i />{{ formatAutomationTaskPhase(row.phase) }}</span>
            <span
              ><el-icon><Calendar /></el-icon><b>计划执行</b>{{ formatTime(row.scheduled_at) }}</span
            >
            <span
              ><el-icon><Clock /></el-icon><b>最近更新</b>{{ formatTime(row.utime) }}</span
            >
          </div>
          <div v-if="row.last_error" class="task-card__error">
            <el-icon><WarningFilled /></el-icon><span>{{ row.last_error }}</span>
          </div>
          <footer class="task-card__actions">
            <AuthButton
              :capability="TICKET_CAPABILITIES.Task.ViewAttempts"
              type="primary"
              plain
              size="small"
              @click="openAttempts(row.id)"
            >
              查看执行详情
            </AuthButton>
            <AuthButton
              :capability="TICKET_CAPABILITIES.Task.Retry"
              size="small"
              plain
              type="warning"
              :disabled="row.status !== AutomationTaskStatus.Failed && row.status !== AutomationTaskStatus.Blocked"
              @click="openRetry(row.id)"
            >
              重新执行
            </AuthButton>
          </footer>
        </div>
      </article>
    </div>

    <TaskRetryDialog v-model="retryDialogVisible" :task-id="taskId" :loading="retryLoading" @confirm="confirmRetry" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import dayjs from "dayjs"
import { listTasksByInstanceIdApi, retryTaskApi } from "@/api/ticket/task"
import { AutomationTaskStatus, type AutomationTask } from "@/api/ticket/task/types/task"
import { Calendar, Clock, Operation, WarningFilled } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import TaskRetryDialog from "@/pages/ticket/task-history/components/TaskRetryDialog.vue"
import { formatAutomationTaskPhase } from "@/pages/ticket/task-history/config"
import TaskHistoryStatusBadge from "@/pages/ticket/task-history/components/TaskHistoryStatusBadge.vue"
import { useAutomationTaskPolling } from "@/pages/ticket/task-history/composables/useAutomationTaskPolling"

const props = defineProps<{ processInstId: number | undefined }>()
const emit = defineEmits<{ (event: "open-attempts", taskId: number): void }>()
const tasksData = ref<AutomationTask[]>([])
const loading = ref(false)
const taskId = ref(0)
const retryDialogVisible = ref(false)
const retryLoading = ref(false)

const statusTone = (status: AutomationTaskStatus) => {
  if (status === AutomationTaskStatus.Success) return "success"
  if (status === AutomationTaskStatus.Failed) return "failed"
  if ([AutomationTaskStatus.Running, AutomationTaskStatus.Submitting].includes(status)) return "running"
  if (status === AutomationTaskStatus.Blocked) return "blocked"
  return "waiting"
}

const loadTasks = async (silent = false) => {
  if (!props.processInstId) return
  if (!silent) loading.value = true
  try {
    const { data } = await listTasksByInstanceIdApi({
      instance_id: props.processInstId,
      offset: 0,
      limit: 1000
    })
    tasksData.value = data.tasks || []
  } catch (error) {
    console.error("获取工单自动化任务失败:", error)
  } finally {
    if (!silent) loading.value = false
    schedulePolling()
  }
}

const { schedule: schedulePolling } = useAutomationTaskPolling(
  () => tasksData.value,
  () => loadTasks(true)
)

const openAttempts = (id: number) => {
  emit("open-attempts", id)
}

const openRetry = (id: number) => {
  taskId.value = id
  retryDialogVisible.value = true
}

const confirmRetry = async () => {
  retryLoading.value = true
  try {
    await retryTaskApi(taskId.value)
    ElMessage.success("新的执行尝试已创建")
    retryDialogVisible.value = false
    await loadTasks()
  } catch {
    ElMessage.error("重试任务失败")
  } finally {
    retryLoading.value = false
  }
}

const formatTime = (value: number) => (value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-")
watch(
  () => props.processInstId,
  () => loadTasks(),
  { immediate: true }
)

defineExpose({ listTasksData: loadTasks })
</script>

<style scoped lang="scss">
.task-list-container {
  box-sizing: border-box;
  height: 100%;
  min-height: 180px;
  padding: 18px 20px 24px;
  overflow-y: auto;
  background: #f8fafc;
}

.task-list {
  display: grid;
  gap: 14px;
}

.task-card {
  position: relative;
  display: flex;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8edf4;
  border-radius: 10px;
  transition: 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 5px 16px rgb(15 23 42 / 6%);
    transform: translateY(-1px);
  }

  &.is-success .task-card__rail {
    background: #10b981;
  }
  &.is-failed .task-card__rail {
    background: #ef4444;
  }
  &.is-running .task-card__rail {
    background: #6366f1;
  }
  &.is-blocked .task-card__rail {
    background: #f59e0b;
  }
}

.task-card__rail {
  width: 4px;
  flex-shrink: 0;
  background: #94a3b8;
}

.task-card__body {
  min-width: 0;
  flex: 1;
  padding: 18px 20px 16px;
}

.task-card__head,
.task-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card__head :deep(.status-cell) {
  width: auto;
  flex-shrink: 0;
}

.task-card__identity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.task-card__icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eef5ff;
  color: #3b82f6;
  font-size: 17px;
}

.task-card__identity-content {
  min-width: 0;
}

.task-card__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.task-card__node {
  max-width: 430px;
  margin-top: 5px;
  overflow: hidden;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    margin-right: 7px;
    color: #64748b;
    font-family: inherit;
  }

  em {
    margin-left: 8px;
    color: #64748b;
    font-family: inherit;
    font-style: normal;
  }
}

.task-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 16px;
  padding: 10px 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .el-icon {
    color: #94a3b8;
  }

  b {
    color: #94a3b8;
    font-weight: 500;
  }

  .phase-chip {
    padding-right: 10px;
    border-right: 1px solid #e2e8f0;
    border-radius: 999px;
    color: #64748b;
    font-weight: 600;

    i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #64748b;
    }
  }
}

.task-card__error {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 12px;
  padding: 8px 10px;
  color: #b91c1c;
  background: #fef2f2;
  border-radius: 4px;
  font-size: 12px;

  .el-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }
}

.task-card__actions {
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}
</style>
