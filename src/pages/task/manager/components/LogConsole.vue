<template>
  <div class="log-console-container" v-loading="state.loading">
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
            <el-switch v-model="state.autoRefresh" size="small" />
          </div>
          <div class="action-divider" v-if="isRunning" />
          <div class="btn-cluster">
            <el-button :icon="Refresh" circle size="default" :disabled="state.loading" @click="resetAndFetch" />
            <el-button
              v-if="execution.task_result"
              :icon="Monitor"
              type="info"
              circle
              plain
              @click="state.viewResultVisible = true"
            />
          </div>
        </div>
      </div>

      <div class="console-body">
        <div class="console-title-bar">
          <span class="prefix">控制台输出 (STDOUT)</span>
          <div class="spacer" />
          <span class="sync-time" v-if="state.lastRefreshTime">
            <el-icon><Clock /></el-icon>同步于 {{ state.lastRefreshTime }}
          </span>
        </div>
        <div class="terminal-view">
          <CodeEditor
            v-if="state.fullLogs"
            ref="editorRef"
            :code="state.fullLogs"
            language="text"
            :read-only="true"
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

    <el-dialog v-model="state.viewResultVisible" title="运行结果" width="800px" append-to-body center>
      <CodeEditor :code="execution?.task_result || ''" language="json" :read-only="true" height="500px" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Refresh, Coordinate, Monitor, Clock, Pointer } from "@element-plus/icons-vue"
import type { TaskExecutionVO } from "@/api/task/manager/type"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"
import { useLogConsoleStream } from "../composables/useLogConsoleStream"

/**
 * 任务执行控制台 (LogConsole)
 * 职责：实时/增量拉取任务执行日志、展示节点状态
 */
interface Props {
  execution: TaskExecutionVO | null
}

const props = defineProps<Props>()
const editorRef = ref<InstanceType<typeof CodeEditor>>()

const STATUS_MAP: Record<string, TagInfo> = {
  RUNNING: { type: "primary", text: "进行中" },
  SUCCESS: { type: "success", text: "成功" },
  FAILED: { type: "danger", text: "失败" },
  TERMINATED: { type: "info", text: "停止" },
  PREEMPTED: { type: "warning", text: "已抢占" }
}

// 托管日志轮询逻辑与聚合状态机，消除零散状态声明，实现逻辑与视图解耦
const { state, isRunning, resetAndFetch } = useLogConsoleStream(
  () => props.execution,
  () => editorRef.value?.scrollToBottom()
)
</script>

<style scoped lang="scss">
.log-console-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-height: 0;
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
    background: #020617;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #1e293b;
    box-shadow: inset 0 2px 14px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    .terminal-editor {
      flex: 1;
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
