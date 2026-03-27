<template>
  <FormDialog
    v-model="visible"
    :title="`正在实时运行: ${taskName || ''}`"
    subtitle="监控实例状态并实时同步执行日志"
    width="1220px"
    top="4vh"
    header-icon="Monitor"
    :show-footer="false"
    :full-height="true"
    class="task-execution-console"
    @opened="initData"
    @closed="handleDialogClosed"
  >
    <div class="execution-manager-layout">
      <!-- 左侧栏: 执行实例列表 (审计卡片风格) -->
      <div class="execution-sidebar" v-loading="execLoading">
        <div class="sidebar-header">
          <span class="count">共 {{ totalCount }} 条记录</span>
          <el-button :icon="Refresh" link @click="() => fetchExecutionList()" class="resync-btn" />
        </div>

        <el-scrollbar class="list-scrollbar">
          <div v-if="executions.length > 0" class="execution-list">
            <div
              v-for="item in executions"
              :key="item.id"
              class="execution-item"
              :class="{
                'is-active': currentExecution?.id === item.id,
                'status-success': item.status === 'SUCCESS',
                'status-failed': item.status === 'FAILED',
                'status-running': item.status === 'RUNNING' || item.status === 'PREEMPTED'
              }"
              @click="handleSelectExecution(item)"
            >
              <div class="status-bar" />
              <div class="item-content">
                <div class="header-row">
                  <span class="id-tag">批次 #{{ item.id }}</span>
                  <div class="runtime-badge" v-if="item.end_time > 0">
                    <el-icon><Timer /></el-icon>
                    <span>{{ calculateDuration(item.start_time, item.end_time) }}</span>
                  </div>
                  <div class="runtime-badge running" v-else>
                    <el-icon class="loading-spin"><Loading /></el-icon>
                    <span>运行中</span>
                  </div>
                </div>
                <div class="meta-row">
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>{{ formatTimestamp(item.start_time).split(" ")[0] }}
                  </div>
                  <div class="meta-item" v-if="item.executor_node_id">
                    <el-icon><Coordinate /></el-icon>{{ item.executor_node_id }}
                  </div>
                </div>
                <div class="time-track">
                  <span class="t-val">{{ formatTimestamp(item.start_time).split(" ")[1] }}</span>
                  <div class="t-sep"><div class="line" /></div>
                  <span class="t-val" v-if="item.end_time > 0">{{ formatTimestamp(item.end_time).split(" ")[1] }}</span>
                  <span class="t-val waiting" v-else>...</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else :image-size="40" description="暂无实例数据数据" />
        </el-scrollbar>

        <!-- 分页器：固定在侧边栏底部 -->
        <div class="sidebar-pagination" v-if="totalCount > 0">
          <el-pagination
            v-model:current-page="pagination.page"
            :page-size="pagination.size"
            :total="totalCount"
            layout="prev, pager, next"
            small
            background
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 右侧栏: 日志看板 (抽离为独立组件，支持增量刷新) -->
      <LogConsole :execution="currentExecution" />
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onUnmounted } from "vue"
import { Refresh, Coordinate, Calendar, Timer, Loading } from "@element-plus/icons-vue"
import { listExecutionsApi } from "@/api/etask/manager"
import type { TaskExecutionVO } from "@/api/etask/manager/type"
import { FormDialog } from "@/common/components/Dialogs"
import { formatTimestamp } from "@@/utils/day"
import LogConsole from "./LogConsole.vue"

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
  taskName?: string
}>()

const emit = defineEmits(["update:modelValue"])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const execLoading = ref(false)
const executions = ref<TaskExecutionVO[]>([])
const currentExecution = ref<TaskExecutionVO | null>(null)

const totalCount = ref(0)
const pagination = reactive({
  page: 1,
  size: 10
})

// 列表级静默刷新 (探测新实例)
let timer: any = null
const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (props.taskId) fetchExecutionList(true)
  }, 10000)
}

const initData = async () => {
  if (!props.taskId) return
  pagination.page = 1
  currentExecution.value = null
  startTimer()
  await fetchExecutionList()
}

const fetchExecutionList = async (silent = false) => {
  if (!props.taskId) return
  if (!silent) execLoading.value = true
  try {
    const res = await listExecutionsApi({
      task_id: props.taskId,
      offset: (pagination.page - 1) * pagination.size,
      limit: pagination.size
    })
    executions.value = res.data.executions
    totalCount.value = res.data.total

    // 如果当前选中的实例在刷新后的列表中，同步最新的状态
    if (currentExecution.value) {
      const updated = executions.value.find((e) => e.id === currentExecution.value?.id)
      if (updated) {
        currentExecution.value = updated
      }
    } else if (executions.value.length > 0) {
      handleSelectExecution(executions.value[0])
    }
  } finally {
    if (!silent) execLoading.value = false
  }
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await fetchExecutionList()
}

const handleSelectExecution = (item: TaskExecutionVO) => {
  currentExecution.value = item
}

const calculateDuration = (start: number, end: number) => {
  if (!end || end <= 0) return "计算中..."
  const diff = (end - start) / 1000
  if (diff < 60) return `${diff.toFixed(1)}s`
  return `${(diff / 60).toFixed(1)}m`
}

const handleDialogClosed = () => {
  executions.value = []
  currentExecution.value = null
  totalCount.value = 0
}

onUnmounted(() => clearInterval(timer))

defineExpose({ initData })
</script>

<style scoped lang="scss">
.execution-manager-layout {
  display: flex;
  height: 100%;
  min-height: 580px;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
  overflow: hidden;

  .execution-sidebar {
    width: 320px;
    border-right: 1px solid #f1f5f9;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    .sidebar-header {
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      .count {
        font-size: 11px;
        font-weight: 800;
        color: #94a3b8;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }
      .resync-btn {
        font-size: 16px;
        color: #6366f1;
        transition: transform 0.3s;
        &:hover {
          transform: rotate(180deg);
        }
      }
    }
    .list-scrollbar {
      flex: 1;
    }
    .execution-list {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      .execution-item {
        background: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 10px;
        display: flex;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        &.is-active {
          border-color: #6366f1;
          .status-bar {
            width: 6px;
          }
          .id-tag {
            color: #4f46e5;
          }
        }
        .status-bar {
          width: 4px;
          transition: width 0.2s;
          background: #94a3b8;
        }
        &.status-success {
          .status-bar {
            background: #10b981;
          }
        }
        &.status-failed {
          .status-bar {
            background: #ef4444;
          }
        }
        &.status-running {
          .status-bar {
            background: #6366f1;
          }
          .runtime-badge.running {
            animation: pulse-opacity 2s infinite;
          }
        }
        .item-content {
          flex: 1;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .id-tag {
              font-weight: 800;
              font-size: 14px;
              color: #1e293b;
            }
            .runtime-badge {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              background: #f1f5f9;
              padding: 2px 8px;
              border-radius: 4px;
              &.running {
                background: #eef2ff;
                color: #6366f1;
              }
            }
          }
          .meta-row {
            display: flex;
            gap: 12px;
            .meta-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              color: #94a3b8;
              font-weight: 500;
            }
          }
          .time-track {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 2px;
            .t-val {
              font-family: var(--el-font-family-mono);
              font-size: 12px;
              color: #475569;
              font-weight: 700;
            }
            .t-sep {
              flex: 1;
              height: 1px;
              background: repeating-linear-gradient(90deg, #cbd5e1, #cbd5e1 2px, transparent 2px, transparent 4px);
            }
            .waiting {
              color: #cbd5e1;
              letter-spacing: 1px;
            }
          }
        }
      }
    }

    .sidebar-pagination {
      padding: 10px;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: center;
      flex-shrink: 0;
    }
  }

  .execution-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    min-height: 0;
    min-width: 0;
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
          .el-button.is-loading {
            animation: spin 1s linear infinite;
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
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #1e293b;
        box-shadow: inset 0 2px 14px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        min-height: 0;
        :deep(.el-empty) {
          margin: auto;
          .el-empty__description p {
            color: #64748b;
          }
        }
        .terminal-editor {
          flex: 1;
          height: 100%;
          min-height: 0;
          :deep(.cm-editor) {
            height: 100%;
            font-family: "Fira Code", monospace;
            font-size: 14px;
            line-height: 1.7;
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
        font-size: 64px;
        color: #f1f5f9;
        margin-bottom: 20px;
      }
      h3 {
        color: #64748b;
        font-size: 18px;
        font-weight: 800;
      }
    }
  }
}

@keyframes pulse-opacity {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
