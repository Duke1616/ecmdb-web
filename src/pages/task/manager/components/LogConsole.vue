<template>
  <div class="log-console-container" v-loading="loading">
    <template v-if="execution">
      <div class="main-header">
        <div class="status-summary">
          <EnumTag :value="execution.status" :map="STATUS_MAP" />
          <div class="node-badge">
            <el-icon><Coordinate /></el-icon>
            <span>{{ execution.executor_node_id || "未知节点" }}</span>
          </div>
        </div>
        <div class="flex-spacer" />
        <div class="header-actions">
          <div class="control-unit" v-if="isRunning">
            <span class="label">自动跟踪</span>
            <el-switch v-model="autoRefresh" size="small" />
          </div>
          <div class="action-divider" v-if="isRunning" />
          <div class="btn-cluster">
            <el-tooltip v-if="isRunning && canTerminate" content="停止当前批次" placement="bottom">
              <el-button
                :icon="VideoPause"
                type="danger"
                circle
                plain
                :loading="terminating"
                :disabled="loading"
                @click="handleTerminate"
              />
            </el-tooltip>
            <el-button
              v-if="canViewParameters"
              :icon="Operation"
              circle
              size="default"
              :disabled="loading"
              title="查看执行参数"
              @click="parametersVisible = true"
            />
            <el-button
              :icon="Refresh"
              circle
              size="default"
              :disabled="loading"
              title="刷新日志"
              @click="resetAndFetch"
            />
            <el-tooltip v-if="execution.task_result" content="切换至结构化输出 (FD3)" placement="bottom">
              <el-button
                :icon="Monitor"
                :type="activeTab === 'result' ? 'primary' : 'info'"
                circle
                :plain="activeTab !== 'result'"
                @click="activeTab = 'result'"
              />
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="console-body">
        <div class="console-title-bar">
          <div class="tab-nav">
            <button
              type="button"
              class="tab-item"
              :class="{ 'is-active': activeTab === 'stdout' }"
              @click="activeTab = 'stdout'"
            >
              <el-icon><Document /></el-icon>
              <span>控制台输出 (STDOUT)</span>
            </button>
            <button
              type="button"
              class="tab-item"
              :class="{ 'is-active': activeTab === 'result' }"
              @click="activeTab = 'result'"
            >
              <el-icon><DataAnalysis /></el-icon>
              <span>结构化输出 (FD3)</span>
              <span v-if="parsedResult" class="tab-badge">JSON</span>
            </button>
          </div>
          <div class="spacer" />
          <span class="sync-time" v-if="activeTab === 'stdout' && lastRefreshTime">
            <el-icon><Clock /></el-icon>同步于 {{ lastRefreshTime }}
          </span>
          <div class="tab-actions" v-if="activeTab === 'result' && parsedResult">
            <el-button size="small" type="primary" link :icon="CopyDocument" @click="handleCopyResult">
              复制结果
            </el-button>
          </div>
        </div>

        <div class="terminal-view">
          <template v-if="activeTab === 'stdout'">
            <CodeEditor
              v-if="fullLogs"
              ref="editorRef"
              :code="fullLogs"
              language="text"
              :read-only="true"
              :ansi="true"
              class="terminal-editor"
            />
            <el-empty v-else description="该实例暂无日志流" />
          </template>

          <template v-else-if="activeTab === 'result'">
            <div v-if="parsedResult" class="result-container">
              <div v-if="parsedResult.summary" class="result-summary-bar">
                <el-icon class="summary-icon"><InfoFilled /></el-icon>
                <span class="summary-text">{{ parsedResult.summary }}</span>
              </div>
              <CodeEditor
                :code="parsedResult.formatted"
                :language="parsedResult.isJson ? 'json' : 'text'"
                :read-only="true"
                class="terminal-editor"
              />
            </div>
            <el-empty v-else description="该实例暂无结构化输出 (FD3 未回传数据)" />
          </template>
        </div>
      </div>
    </template>
    <div v-else class="empty-view">
      <el-icon class="icon"><Pointer /></el-icon>
      <h3>请选择监控实例以查看日志</h3>
    </div>

    <ExecutionParametersDialog
      v-model="parametersVisible"
      :execution-id="execution?.id || null"
      :task-id="execution?.task_id || null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import {
  Refresh,
  Coordinate,
  Monitor,
  Clock,
  Pointer,
  VideoPause,
  Operation,
  Document,
  DataAnalysis,
  CopyDocument,
  InfoFilled
} from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { TaskExecutionVO } from "@/api/task/manager/type"
import { terminateExecutionApi } from "@/api/task/manager"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useLogConsoleStream } from "../composables/useLogConsoleStream"
import ExecutionParametersDialog from "./ExecutionParametersDialog.vue"

/**
 * 任务执行控制台 (LogConsole)
 * 职责：实时/增量拉取任务执行日志、展示节点状态、双 Tab 呈现 STDOUT 日志与 FD3 结构化产物
 */
interface Props {
  execution: TaskExecutionVO | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ terminated: [] }>()
const editorRef = ref<InstanceType<typeof CodeEditor>>()
const terminating = ref(false)
const parametersVisible = ref(false)
const activeTab = ref<"stdout" | "result">("stdout")

const { hasPermission } = usePermission()
const canTerminate = computed(() => hasPermission(TASK_CAPABILITIES.Manager.Stop))
const canViewParameters = computed(
  () =>
    hasPermission(TASK_CAPABILITIES.Manager.ExecutionParameters) && hasPermission(TASK_CAPABILITIES.Manager.Executions)
)

const STATUS_MAP: Record<string, TagInfo> = {
  WAITING_PULL: { type: "warning", text: "等待执行" },
  PREPARE: { type: "warning", text: "准备中" },
  RUNNING: { type: "primary", text: "进行中" },
  SUCCESS: { type: "success", text: "成功" },
  FAILED: { type: "danger", text: "失败" },
  FAILED_RETRYABLE: { type: "warning", text: "等待重试" },
  FAILED_RESCHEDULED: { type: "warning", text: "等待重调度" },
  CANCELLED: { type: "info", text: "已停止" },
  TERMINATED: { type: "info", text: "已停止" },
  PREEMPTED: { type: "warning", text: "已抢占" }
}

const { fullLogs, loading, lastRefreshTime, autoRefresh, isRunning, resetAndFetch } = useLogConsoleStream(
  () => props.execution,
  () => editorRef.value?.scrollToBottom()
)

/**
 * 解析并格式化 FD3 回传的结构化任务结果
 */
const parsedResult = computed(() => {
  const raw = props.execution?.task_result?.trim()
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    return {
      isJson: true,
      formatted: JSON.stringify(data, null, 2),
      summary: typeof data === "object" && data !== null && "summary" in data ? String(data.summary) : null,
      raw
    }
  } catch {
    return {
      isJson: false,
      formatted: raw,
      summary: null,
      raw
    }
  }
})

/**
 * 复制结构化结果内容至剪贴板
 */
const handleCopyResult = async () => {
  if (!parsedResult.value?.formatted) return
  try {
    await navigator.clipboard.writeText(parsedResult.value.formatted)
    ElMessage.success("结果已复制到剪贴板")
  } catch {
    const textarea = document.createElement("textarea")
    textarea.value = parsedResult.value.formatted
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
    ElMessage.success("结果已复制到剪贴板")
  }
}

const handleTerminate = async () => {
  if (!props.execution || terminating.value) return
  try {
    const { value } = await ElMessageBox.prompt("停止后无法恢复，请填写终止原因。", "停止当前批次", {
      confirmButtonText: "停止执行",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
      inputPlaceholder: "例如：参数配置错误，需要重新执行",
      inputValue: "管理员手动终止",
      inputValidator: (value) => {
        const reason = value.trim()
        if (!reason) return "请输入终止原因"
        if ([...reason].length > 500) return "终止原因不能超过 500 字"
        return true
      },
      type: "warning",
      draggable: true
    })
    terminating.value = true
    await terminateExecutionApi(props.execution.id, value.trim())
    ElMessage.success("已提交停止请求")
    emit("terminated")
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      const message = error instanceof Error ? error.message : "停止执行失败"
      ElMessage.error(message || "停止执行失败")
    }
  } finally {
    terminating.value = false
  }
}
</script>

<style scoped lang="scss">
.log-console-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-height: 0;
  overflow: hidden;
}
.main-header {
  padding: 10px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  background: #fdfdfd;
  .status-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    .node-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #64748b;
      padding: 4px 12px;
      background: #f3f4f6;
      border-radius: 6px;
      font-weight: 600;
    }
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    .control-unit {
      display: flex;
      align-items: center;
      gap: 10px;
      .label {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 800;
        text-transform: uppercase;
      }
    }
  }
}
.console-body {
  flex: 1;
  min-width: 0;
  padding: 0 24px 24px 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  .console-title-bar {
    display: flex;
    align-items: center;
    padding: 10px 0;
    gap: 12px;

    .tab-nav {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;

      .tab-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #1e293b;
        }

        &.is-active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .tab-badge {
          font-size: 10px;
          line-height: 1;
          padding: 2px 5px;
          border-radius: 10px;
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 700;
        }
      }
    }

    .sync-time {
      margin-left: auto;
      font-size: 11px;
      color: #94a3b8;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
    }
  }
  .terminal-view {
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: #020617;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #1e293b;
    box-shadow: inset 0 2px 14px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;

    .result-container {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      height: 100%;

      .result-summary-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(16, 185, 129, 0.12);
        border-bottom: 1px solid rgba(16, 185, 129, 0.2);
        color: #34d399;
        font-size: 12px;
        line-height: 1.5;

        .summary-icon {
          font-size: 15px;
          flex-shrink: 0;
        }

        .summary-text {
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          word-break: break-all;
        }
      }
    }

    .terminal-editor {
      flex: 1;
      min-width: 0;
      min-height: 0;
      height: 100%;
      :deep(.cm-editor) {
        height: 100%;
        font-family: "Fira Code", monospace;
        font-size: 13px;
      }
    }
    :deep(.el-empty) {
      margin: auto;
      .el-empty__description p {
        color: #64748b;
      }
    }
  }
}
.empty-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .icon {
    font-size: 48px;
    color: #f1f5f9;
    margin-bottom: 16px;
  }
  h3 {
    color: #94a3b8;
    font-size: 15px;
    font-weight: 600;
  }
}
.flex-spacer {
  flex: 1;
}
.action-divider {
  width: 1px;
  height: 16px;
  background: #e2e8f0;
}
</style>
