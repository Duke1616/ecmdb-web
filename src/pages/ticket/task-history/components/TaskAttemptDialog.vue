<template>
  <FormDialog
    v-model="visible"
    title="自动化执行记录"
    :subtitle="`Task #${taskId} · 查看每次提交的运行日志与输入输出`"
    width="1180px"
    top="4vh"
    header-icon="Monitor"
    :show-footer="false"
    :full-height="true"
    @opened="initData"
    @closed="reset"
  >
    <div class="attempt-console">
      <aside class="attempt-sidebar" v-loading="loading">
        <header class="sidebar-header">
          <div>
            <span class="sidebar-title">执行尝试</span>
            <span class="sidebar-count">{{ attempts.length }}</span>
          </div>
          <el-button :icon="Refresh" link class="refresh-button" @click="refresh" />
        </header>

        <el-scrollbar class="attempt-scrollbar">
          <div v-if="attempts.length" class="attempt-list">
            <button
              v-for="attempt in attempts"
              :key="attempt.id"
              type="button"
              class="attempt-item"
              :class="[`is-${attempt.status.toLowerCase()}`, { 'is-active': currentAttempt?.id === attempt.id }]"
              @click="selectAttempt(attempt)"
            >
              <i class="status-rail" />
              <span class="attempt-content">
                <span class="attempt-heading">
                  <strong>v{{ attempt.attempt_no }}</strong>
                  <span class="duration">{{ formatDuration(attempt) }}</span>
                </span>
                <span class="attempt-meta">
                  <span class="attempt-status"><i />{{ attemptStatusText(attempt.status) }}</span>
                  <span class="runner">{{ runnerLabel(attempt) }}</span>
                </span>
                <span class="attempt-time">
                  <span>{{ formatDate(attempt.ctime) }}</span>
                  <span>{{ formatClock(attempt.ctime) }}</span>
                </span>
              </span>
            </button>
          </div>
          <el-empty v-else :image-size="56" description="暂无执行尝试" />
        </el-scrollbar>
      </aside>

      <main v-if="currentAttempt" class="attempt-main">
        <header class="main-header">
          <div class="attempt-summary">
            <span class="version-mark">v{{ currentAttempt.attempt_no }}</span>
            <span class="status-pill" :class="`is-${currentAttempt.status.toLowerCase()}`">
              <i />{{ attemptStatusText(currentAttempt.status) }}
            </span>
            <span class="identity"
              ><el-icon><Cpu /></el-icon>{{ runnerLabel(currentAttempt) }}</span
            >
            <span class="identity"
              ><el-icon><Monitor /></el-icon>Execution #{{ currentAttempt.execution_id || "-" }}</span
            >
          </div>
          <div class="console-actions">
            <label v-if="isRunning" class="auto-refresh">
              <span>自动刷新</span>
              <el-switch v-model="autoRefresh" size="small" />
            </label>
            <el-button :icon="Refresh" circle :loading="logLoading" @click="refresh" />
          </div>
        </header>

        <nav class="view-tabs">
          <button
            v-for="item in views"
            :key="item.value"
            type="button"
            :class="{ 'is-active': activeView === item.value }"
            @click="activeView = item.value"
          >
            <el-icon><component :is="item.icon" /></el-icon>{{ item.label }}
          </button>
        </nav>

        <section class="console-section">
          <div class="console-caption">
            <span>{{ currentViewTitle }}</span>
            <span v-if="activeView === 'logs' && lastSyncTime" class="sync-time">
              <el-icon><Clock /></el-icon>同步于 {{ lastSyncTime }}
            </span>
            <span v-else class="request-id">{{ currentAttempt.request_id }}</span>
          </div>
          <div v-loading="activeView === 'logs' && logLoading" class="terminal-view">
            <CodeEditor
              v-if="displayContent"
              :key="`${currentAttempt.id}-${activeView}`"
              :code="displayContent"
              :language="activeView === 'logs' ? 'text' : 'json'"
              :read-only="true"
              class="terminal-editor"
            />
            <el-empty v-else :description="emptyDescription" />
          </div>
        </section>
      </main>

      <div v-else class="empty-main">
        <el-icon><Pointer /></el-icon>
        <h3>请选择执行尝试</h3>
        <p>选择左侧版本后可查看完整运行信息</p>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Clock, Cpu, DataAnalysis, Document, Monitor, Pointer, Refresh } from "@element-plus/icons-vue"
import { FormDialog } from "@/common/components/Dialogs"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import { AutomationAttemptStatus, type AutomationAttempt } from "@/api/ticket/task/types/task"
import { useTaskAttemptConsole } from "../composables/useTaskAttemptConsole"

type ViewType = "logs" | "input" | "output"

const props = defineProps<{ modelValue: boolean; taskId: number }>()
const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>()
const activeView = ref<ViewType>("logs")

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const {
  attempts,
  currentAttempt,
  loading,
  logLoading,
  logs,
  lastSyncTime,
  autoRefresh,
  isRunning,
  initData: initialize,
  selectAttempt: select,
  refresh,
  reset
} = useTaskAttemptConsole(() => props.taskId)

const views = [
  { value: "logs" as const, label: "运行日志", icon: Monitor },
  { value: "input" as const, label: "执行输入", icon: Document },
  { value: "output" as const, label: "执行输出", icon: DataAnalysis }
]

const initData = async () => {
  activeView.value = "logs"
  await initialize()
}

const selectAttempt = async (attempt: AutomationAttempt) => {
  activeView.value = "logs"
  await select(attempt)
}

const prettyJSON = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const runnerLabel = (attempt: AutomationAttempt) =>
  attempt.runner_id > 0 ? `Runner #${attempt.runner_id}` : "历史执行"

const prettyOutput = (attempt: AutomationAttempt) => {
  const content = attempt.output || attempt.error
  if (!content) return ""
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

const displayContent = computed(() => {
  if (!currentAttempt.value) return ""
  if (activeView.value === "logs") return logs.value
  if (activeView.value === "input") return prettyJSON(currentAttempt.value.input)
  return prettyOutput(currentAttempt.value)
})

const currentViewTitle = computed(() => views.find((item) => item.value === activeView.value)?.label || "运行日志")
const emptyDescription = computed(() => {
  if (activeView.value === "logs" && !currentAttempt.value?.execution_id) return "尚未创建 etask Execution"
  if (activeView.value === "output" && isRunning.value) return "执行尚未结束"
  return "暂无内容"
})

const attemptStatusText = (status: AutomationAttemptStatus) =>
  ({
    [AutomationAttemptStatus.Submitting]: "提交中",
    [AutomationAttemptStatus.Running]: "运行中",
    [AutomationAttemptStatus.Success]: "成功",
    [AutomationAttemptStatus.Failed]: "失败"
  })[status]

const formatDate = (value: number) =>
  new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
const formatClock = (value: number) => new Date(value).toLocaleTimeString("zh-CN", { hour12: false })

const formatDuration = (attempt: AutomationAttempt) => {
  if (!attempt.completed_at) return attempt.status === AutomationAttemptStatus.Running ? "运行中" : "等待中"
  const start = attempt.submitted_at || attempt.ctime
  const seconds = Math.max(0, (attempt.completed_at - start) / 1000)
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${(seconds / 60).toFixed(1)}m`
}
</script>

<style scoped lang="scss">
.attempt-console {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.attempt-sidebar {
  display: flex;
  width: 300px;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid #e9eef5;
  background: #f8fafc;
}

.sidebar-header {
  display: flex;
  height: 52px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #edf1f6;
  background: #fff;
}

.sidebar-title {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.sidebar-count {
  margin-left: 7px;
  padding: 1px 7px;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
}

.refresh-button {
  color: #6366f1;
  font-size: 16px;
}

.attempt-scrollbar {
  flex: 1;
}

.attempt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.attempt-item {
  display: flex;
  min-height: 74px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #edf1f6;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgb(15 23 42 / 5%);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: #818cf8;
    box-shadow: 0 0 0 2px rgb(99 102 241 / 8%);
  }

  .status-rail {
    width: 4px;
    background: #94a3b8;
  }

  &.is-success .status-rail {
    background: #10b981;
  }
  &.is-failed .status-rail {
    background: #ef4444;
  }
  &.is-running .status-rail,
  &.is-submitting .status-rail {
    background: #6366f1;
  }
}

.attempt-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  padding: 6px 14px;
}

.attempt-heading,
.attempt-meta,
.attempt-status,
.attempt-time {
  display: flex;
  align-items: center;
}

.attempt-heading {
  justify-content: space-between;

  strong {
    color: #1e293b;
    font-size: 15px;
  }
  .duration {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
  }
}

.attempt-status {
  flex-shrink: 0;
  gap: 5px;
  color: #64748b;
  font-size: 11px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #94a3b8;
  }
}

.attempt-meta {
  min-width: 0;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;
}

.runner {
  flex-shrink: 0;
}

.attempt-time {
  justify-content: space-between;
  color: #a8b2c1;
  font-size: 11px;
  font-weight: 400;
}

.attempt-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.main-header {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  border-bottom: 1px solid #edf1f6;
}

.attempt-summary,
.console-actions,
.auto-refresh {
  display: flex;
  align-items: center;
}

.attempt-summary {
  gap: 10px;
}
.console-actions {
  gap: 14px;
}
.auto-refresh {
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.version-mark {
  color: #1e293b;
  font-size: 16px;
  font-weight: 800;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  &.is-success {
    background: #ecfdf5;
    color: #059669;
  }
  &.is-failed {
    background: #fef2f2;
    color: #dc2626;
  }
  &.is-running,
  &.is-submitting {
    background: #eef2ff;
    color: #4f46e5;
  }
}

.identity {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
}

.view-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 22px 0;

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;

    &:hover {
      background: #f8fafc;
      color: #334155;
    }
    &.is-active {
      background: #eef2ff;
      color: #4f46e5;
    }
  }
}

.console-section {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 22px 22px;
}

.console-caption {
  display: flex;
  height: 42px;
  align-items: center;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;

  .sync-time,
  .request-id {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    color: #a8b1c0;
    font-family: ui-monospace, monospace;
    font-weight: 500;
    letter-spacing: 0;
  }
}

.terminal-view {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #020617;
  box-shadow: inset 0 2px 14px rgb(0 0 0 / 35%);

  .terminal-editor {
    flex: 1;
    min-height: 0;
  }
  :deep(.cm-editor) {
    height: 100%;
    font-family: "Fira Code", ui-monospace, monospace;
    font-size: 13px;
  }
  :deep(.el-empty) {
    margin: auto;
  }
  :deep(.el-empty__description p) {
    color: #64748b;
  }
}

.empty-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;

  > .el-icon {
    font-size: 48px;
  }
  h3 {
    margin: 14px 0 4px;
    color: #64748b;
    font-size: 15px;
  }
  p {
    margin: 0;
    font-size: 12px;
  }
}
</style>
