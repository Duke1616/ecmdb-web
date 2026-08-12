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
            <el-button :icon="Refresh" circle size="default" :disabled="loading" @click="resetAndFetch" />
            <el-button
              v-if="execution.task_result"
              :icon="Monitor"
              type="info"
              circle
              plain
              @click="viewResultVisible = true"
            />
          </div>
        </div>
      </div>

      <div class="console-body">
        <div class="console-title-bar">
          <span class="prefix">控制台输出 (STDOUT)</span>
          <div class="spacer" />
          <span class="sync-time" v-if="lastRefreshTime">
            <el-icon><Clock /></el-icon>同步于 {{ lastRefreshTime }}
          </span>
        </div>
        <div class="terminal-view">
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
        </div>
      </div>
    </template>
    <div v-else class="empty-view">
      <el-icon class="icon"><Pointer /></el-icon>
      <h3>请选择监控实例以查看日志</h3>
    </div>

    <el-dialog v-model="viewResultVisible" title="运行结果" width="800px" append-to-body center>
      <CodeEditor :code="execution?.task_result || ''" language="json" :read-only="true" height="500px" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Refresh, Coordinate, Monitor, Clock, Pointer, VideoPause } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { TaskExecutionVO } from "@/api/task/manager/type"
import { terminateExecutionApi } from "@/api/task/manager"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useLogConsoleStream } from "../composables/useLogConsoleStream"

/**
 * 任务执行控制台 (LogConsole)
 * 职责：实时/增量拉取任务执行日志、展示节点状态
 */
interface Props {
  execution: TaskExecutionVO | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ terminated: [] }>()
const editorRef = ref<InstanceType<typeof CodeEditor>>()
const terminating = ref(false)
const { hasPermission } = usePermission()
const canTerminate = computed(() => hasPermission(TASK_CAPABILITIES.Manager.Stop))

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

const { fullLogs, loading, lastRefreshTime, autoRefresh, viewResultVisible, isRunning, resetAndFetch } =
  useLogConsoleStream(
    () => props.execution,
    () => editorRef.value?.scrollToBottom()
  )

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
    padding: 12px 0;
    .prefix {
      font-size: 11px;
      font-weight: 900;
      color: #94a3b8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .sync-time {
      margin-left: auto;
      font-size: 11px;
      color: #cbd5e1;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 6px;
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
