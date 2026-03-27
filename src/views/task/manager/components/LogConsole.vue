<script setup lang="ts">
import { ref, watch, onUnmounted, computed, nextTick } from "vue"
import { Refresh, Coordinate, Monitor, Clock, Pointer } from "@element-plus/icons-vue"
import { getTaskLogsApi } from "@/api/etask/manager"
import type { TaskExecutionVO } from "@/api/etask/manager/type"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"

/**
 * NOTE: 任务执行控制台 (LogConsole)
 * 职责：实时/增量拉取任务执行日志、展示节点状态、查看运行结果
 * 核心特性：
 * 1. 增量拉取 (Incremental Polling): 记录 lastLogId 减少数据传输量
 * 2. 状态驱动: 自动根据 Execution 状态决定轮询生命周期
 */
interface Props {
  execution: TaskExecutionVO | null
}

const props = defineProps<Props>()

const editorRef = ref<InstanceType<typeof CodeEditor>>()

// 状态语义化映射
const STATUS_MAP: Record<string, TagInfo> = {
  RUNNING: { type: "primary", text: "进行中" },
  SUCCESS: { type: "success", text: "成功" },
  FAILED: { type: "danger", text: "失败" },
  TERMINATED: { type: "info", text: "停止" },
  PREEMPTED: { type: "warning", text: "已抢占" }
}

// 内部状态
const loading = ref(false)
const fullLogs = ref("")
const lastLogId = ref(0)
const lastRefreshTime = ref("")
const autoRefresh = ref(true)
const viewResultVisible = ref(false)

let timer: any = null

// 核心：增量抓取日志函数
const fetchIncrementalLogs = async (silent = false) => {
  if (!props.execution?.id) return
  if (!silent) loading.value = true

  try {
    const res = await getTaskLogsApi({
      execution_id: props.execution.id,
      min_id: lastLogId.value, // 关键：传当前最大 ID
      limit: 1000
    })

    const newLogs = res.data.logs || []
    if (newLogs.length > 0) {
      // 1. 拼接内容
      const contentBatch = newLogs.map((l) => l.content).join("\n")
      fullLogs.value = fullLogs.value ? `${fullLogs.value}\n${contentBatch}` : contentBatch

      // 2. 更新最后 ID 位，用于下次增量抓取
      lastLogId.value = Math.max(...newLogs.map((l) => l.id))

      // 3. 自动滚屏逻辑
      if (autoRefresh.value) {
        nextTick(() => {
          editorRef.value?.scrollToBottom()
        })
      }
    }
    lastRefreshTime.value = new Date().toLocaleTimeString()
  } catch (e) {
    console.error("Incremental log fetch failed", e)
  } finally {
    if (!silent) loading.value = false
  }
}

// 初始化/重置组件
const resetAndFetchFull = async () => {
  fullLogs.value = ""
  lastLogId.value = 0
  await fetchIncrementalLogs()
}

// 监控 Execution 切换
watch(
  () => props.execution?.id,
  (newId) => {
    if (newId) {
      resetAndFetchFull()
    } else {
      fullLogs.value = ""
      lastLogId.value = 0
    }
  },
  { immediate: true }
)

// 监控自动刷新开关与 Execution 状态决定轮询
const isStillRunning = computed(() => {
  const status = props.execution?.status || ""
  return ["RUNNING", "PREEMPTED"].includes(status)
})

watch(
  [autoRefresh, isStillRunning],
  ([active, running]) => {
    if (active && running) {
      if (!timer) {
        timer = setInterval(() => fetchIncrementalLogs(true), 4000)
      }
    } else {
      clearInterval(timer)
      timer = null
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  clearInterval(timer)
})

defineExpose({ refresh: () => resetAndFetchFull() })
</script>

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
          <div class="control-unit" v-if="isStillRunning">
            <span class="label">自动跟踪</span>
            <el-switch v-model="autoRefresh" size="small" />
          </div>
          <div class="action-divider" v-if="isStillRunning" />
          <div class="btn-cluster">
            <el-tooltip content="刷新日志" placement="top">
              <el-button :icon="Refresh" circle size="default" :disabled="loading" @click="resetAndFetchFull" />
            </el-tooltip>
            <el-tooltip v-if="execution.task_result" content="运行结果" placement="top">
              <el-button :icon="Monitor" type="info" circle plain size="default" @click="viewResultVisible = true" />
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="console-body">
        <div class="console-title-bar">
          <span class="prefix">控制台输出 (INCREMENTAL)</span>
          <div class="spacer" />
          <span class="sync-time" v-if="lastRefreshTime">
            <el-icon><Clock /></el-icon>
            同步于 {{ lastRefreshTime }}
          </span>
        </div>
        <div class="terminal-view">
          <CodeEditor
            v-if="fullLogs"
            ref="editorRef"
            :code="fullLogs"
            language="text"
            :read-only="true"
            class="terminal-editor"
          />
          <el-empty v-else description="该实例暂无控制台日志流" />
        </div>
      </div>
    </template>
    <div v-else class="empty-view">
      <el-icon class="icon"><Pointer /></el-icon>
      <h3>请选择监控实例以查看日志</h3>
    </div>

    <!-- 结果细节查看 -->
    <el-dialog
      v-model="viewResultVisible"
      title="运行结果 (Payload Return)"
      width="900px"
      append-to-body
      center
      top="10vh"
      custom-class="result-detail-dialog"
    >
      <div class="result-viewer">
        <CodeEditor :code="execution?.task_result || ''" language="json" :read-only="true" height="500px" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.log-console-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  min-height: 0;
  min-width: 0;
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
    .btn-cluster {
      display: flex;
      gap: 10px;
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
    min-height: 0;

    .terminal-editor {
      flex: 1;
      height: 100%;
      min-height: 0;
      :deep(.cm-editor) {
        height: 100%;
        font-family: "Fira Code", monospace;
        font-size: 13px;
        line-height: 1.6;
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
