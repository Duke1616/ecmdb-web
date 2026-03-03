<template>
  <div class="task-list-container" v-loading="loading">
    <el-empty v-if="tasksData.length === 0" :image-size="200" description="暂无自动化任务" />

    <div class="task-list" v-else>
      <div v-for="row in tasksData" :key="row.id" class="task-item-card">
        <!-- 头部区域：超紧凑型 -->
        <div class="card-header-slim">
          <div class="title-section">
            <span class="type-icon-mini"
              ><el-icon><Monitor /></el-icon
            ></span>
            <span class="node-name-mini">{{ row.codebook_name || "未命名任务" }}</span>
            <div class="meta-tags-slim">
              <span class="meta-pill">{{ row.kind === Kind.KAFKA ? "立即执行" : "调度执行" }}</span>
              <span v-if="row.is_timing" class="meta-pill timing">{{ row.scheduled_time }}</span>
            </div>
          </div>
          <div class="status-section-slim">
            <div v-if="row.retry_count > 0" class="retry-badge-mini" title="已重试次数">
              <el-icon><Refresh /></el-icon>{{ row.retry_count }}
            </div>
            <EnumTag :value="row.status" :map="statusMap" size="small" class="tag-compact" />
          </div>
        </div>

        <!-- 内容区域：极致精简布局 -->
        <div class="card-body-slim">
          <!-- 核心详情行 -->
          <div class="info-line-slim">
            <div class="target-group-slim">
              <span v-if="row.kind === Kind.KAFKA" class="target-badge kafka">@KAFKA</span>
              <span v-else-if="row.kind === Kind.GRPC" class="target-badge grpc">@EXECUTOR</span>

              <div class="target-text-minimal">
                <span class="target-main">{{ row.target }}</span>
                <span class="target-sep">/</span>
                <span class="target-handler">{{ row.handler }}</span>
              </div>
            </div>

            <template v-if="row.trigger_position">
              <el-divider direction="vertical" />
              <el-icon><ChatDotRound /></el-icon>
              <span class="info-content truncate-slim">{{ row.trigger_position }}</span>
            </template>
          </div>

          <!-- 时间轴行 -->
          <div class="time-strip-slim">
            <div class="time-blocks-mini">
              <span class="time-nano">{{
                row.start_time ? dayjs(row.start_time).format("YYYY-MM-DD HH:mm:ss") : "--"
              }}</span>
              <el-icon class="connector-mini"><Right /></el-icon>
              <span class="time-nano">{{
                row.end_time ? dayjs(row.end_time).format("YYYY-MM-DD HH:mm:ss") : row.start_time ? "RUNNING" : "--"
              }}</span>
            </div>
            <div class="duration-nano" v-if="row.start_time && row.end_time">
              {{ calculateDuration(row.start_time, row.end_time) }}
            </div>
          </div>
        </div>

        <!-- 底部区域：精致功能区 -->
        <div class="card-footer-refined">
          <div class="footer-left">
            <el-button link class="btn-action" @click="operateEvent(row, 'input')">
              <el-icon><Document /></el-icon>指令详情
            </el-button>
            <el-button link class="btn-action" @click="operateEvent(row, 'output')">
              <el-icon><DataLine /></el-icon>查看日志
            </el-button>
          </div>

          <div class="footer-right">
            <div class="config-group">
              <el-tooltip content="编辑参数" placement="top">
                <div class="config-item" @click="operateEvent(row, 'args')">
                  <el-icon><Setting /></el-icon>
                </div>
              </el-tooltip>
              <el-tooltip content="运行变量" placement="top">
                <div class="config-item" @click="operateEvent(row, 'variables')">
                  <el-icon><Box /></el-icon>
                </div>
              </el-tooltip>
            </div>

            <el-button type="warning" size="small" class="btn-retry-modern" @click="operateEvent(row, 'retry')">
              <el-icon><Refresh /></el-icon>重新执行
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务结果查看对话框 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Refresh, Monitor, ChatDotRound, Right, Document, DataLine, Setting, Box } from "@element-plus/icons-vue"
import { task, Kind } from "@/api/task/types/task"
import {
  listTasksByInstanceIdApi,
  retryTaskApi,
  updateTaskArgsApi,
  updateTaskVariablesApi,
  getTaskLogsApi
} from "@/api/task"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"
import TaskResultDialog from "@/views/task/history/components/TaskResultDialog.vue"
import TaskRetryDialog from "@/views/task/history/components/TaskRetryDialog.vue"
import dayjs from "dayjs"

interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()

const tasksData = ref<task[]>([])
const loading = ref<boolean>(false)

// 任务状态映射 (基于最新后端定义)
const statusMap: Record<number, TagInfo> = {
  1: { type: "success", text: "成功" },
  2: { type: "danger", text: "失败" },
  3: { type: "primary", text: "运行中" },
  4: { type: "info", text: "等待中" }, // WAITING 等待/初始化
  5: { type: "warning", text: "挂起/阻塞" }, // BLOCKED 挂起/阻塞
  6: { type: "primary", text: "已就绪" } // SCHEDULED 已分配/已就绪
}

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return "-"
  const diff = dayjs(end).diff(dayjs(start), "second")
  if (diff < 60) return `${diff}s`
  const minutes = Math.floor(diff / 60)
  const seconds = diff % 60
  return `${minutes}m ${seconds}s`
}

const currentDialogType = ref<"input" | "output" | "args" | "variables">("input")
const retryDialogVisible = ref<boolean>(false)
const retryLoading = ref<boolean>(false)

const taskId = ref<number>(0)
const result = ref<any>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)

/** 查询任务列表 */
const listTasksData = async () => {
  if (!props.processInstId) return

  loading.value = true
  try {
    const { data } = await listTasksByInstanceIdApi({
      offset: 0,
      limit: 1000,
      instance_id: props.processInstId
    })

    tasksData.value = data.tasks || []
  } catch (error) {
    tasksData.value = []
  } finally {
    loading.value = false
  }
}

/** 监听分页参数的变化 */
watch(() => props.processInstId, listTasksData, { immediate: true })

// 操作相关
const operateEvent = (data: task, name: string) => {
  taskId.value = data.id

  switch (name) {
    case "input":
      result.value = data.code
      language.value = data.language
      currentDialogType.value = "input"
      resultVisible.value = true
      break
    case "output":
      getTaskLogsApi(data.id).then(({ data: logs }) => {
        result.value = logs
        language.value = "text"
        currentDialogType.value = "output"
        resultVisible.value = true
      })
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

const handleSaveResult = async (data: { taskId: number; result: any; type: string }) => {
  try {
    switch (data.type) {
      case "args":
        await updateTaskArgsApi({ id: data.taskId, args: data.result })
        listTasksData()
        ElMessage.success("修改传递参数成功")
        break
      case "variables":
        await updateTaskVariablesApi({ id: data.taskId, variables: JSON.stringify(data.result) })
        listTasksData()
        ElMessage.success("修改传递变量成功")
        break
    }
  } catch (error) {
    console.error("保存失败:", error)
  }
}

const handleRetryConfirm = () => {
  retryLoading.value = true
  retryTaskApi(taskId.value)
    .then(() => {
      ElMessage.success("重试已提交，请稍后查看结果")
      retryDialogVisible.value = false
      listTasksData()
    })
    .catch((error) => {
      console.error("重试任务失败:", error)
      ElMessage.error("重试任务失败")
    })
    .finally(() => {
      retryLoading.value = false
    })
}

defineExpose({
  listTasksData
})
</script>

<style scoped lang="scss">
.task-list-container {
  background-color: #f8fafc;
  padding: 4px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item-card {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #e2e8f0;
  }
}

/* Slim Header */
.card-header-slim {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 10px;

    .type-icon-mini {
      width: 28px;
      height: 28px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .node-name-mini {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .meta-tags-slim {
      display: flex;
      gap: 6px;
      margin-left: 8px;

      .meta-pill {
        font-size: 11px;
        padding: 1px 6px;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 4px;
        font-weight: 600;

        &.timing {
          background: #fff7ed;
          color: #c2410c;
          font-family: monospace;
        }
      }
    }
  }

  .status-section-slim {
    display: flex;
    align-items: center;
    gap: 10px;

    .retry-badge-mini {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #ea580c;
      background: #fff7ed;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
      .el-icon {
        font-size: 12px;
      }
    }
  }
}

/* Slim Body */
.card-body-slim {
  margin-bottom: 12px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;

  .info-line-slim {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #475569;
    font-size: 13px;
    margin-bottom: 6px;

    .el-icon {
      color: #94a3b8;
      font-size: 14px;
    }

    .target-group-slim {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .target-badge {
      font-size: 9px;
      font-weight: bold;
      padding: 1px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      text-transform: uppercase;

      &.kafka {
        background: #3b82f6;
        color: white;
      }

      &.grpc {
        background: #64748b;
        color: white;
      }
    }

    .target-text-minimal {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      min-width: 0;
      overflow: hidden;

      .target-main {
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }

      .target-sep {
        color: #e2e8f0;
        font-weight: bold;
      }

      .target-handler {
        font-weight: 700;
        color: #1e293b;
        font-family: "JetBrains Mono", monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .truncate-slim {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .time-strip-slim {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .time-blocks-mini {
      display: flex;
      align-items: center;
      gap: 8px;

      .time-nano {
        font-size: 12px;
        color: #64748b;
        font-family: tabular-nums;
        font-weight: 600;
      }

      .connector-mini {
        font-size: 12px;
        color: #cbd5e1;
      }
    }

    .duration-nano {
      font-size: 11px;
      font-weight: 800;
      color: #3b82f6;
      background: #eff6ff;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }
}

/* Refined Footer */
.card-footer-refined {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-left {
    display: flex;
    gap: 16px;

    .btn-action {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0;
      transition: all 0.2s;

      &:hover {
        color: #2563eb;
        transform: translateX(2px);
      }

      .el-icon {
        font-size: 16px;
        color: #94a3b8;
      }
    }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 14px;

    .config-group {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;

      .config-item {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        background: transparent;
        border-radius: 6px;
        transition: all 0.2s;
        font-size: 14px;

        &:hover {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      }
    }

    .btn-retry-modern {
      height: 32px;
      padding: 0 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.02em;
      border: none;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
        filter: brightness(1.1);
      }

      &:active {
        transform: translateY(0);
      }

      .el-icon {
        margin-right: 4px;
        font-size: 14px;
      }
    }
  }
}
</style>
