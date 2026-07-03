<template>
  <div class="task-list-container" v-loading="loading">
    <el-empty v-if="tasksData.length === 0" :image-size="200" description="暂无自动化任务" />

    <div class="task-list" v-else>
      <div v-for="row in tasksData" :key="row.id" class="task-item-card">
        <div class="task-main">
          <div class="task-heading">
            <div class="task-title">
              <span class="task-icon">
                <el-icon><Monitor /></el-icon>
              </span>
              <div class="task-name-group">
                <div class="task-name">{{ row.codebook_id || "未命名任务" }}</div>
                <div class="task-subtitle">
                  <span>{{ row.kind === Kind.KAFKA ? "消息推送" : "分布式调度" }}</span>
                  <span class="separator">/</span>
                  <span>{{ row.handler || "-" }}</span>
                </div>
              </div>
            </div>

            <div class="task-status">
              <span v-if="row.retry_count > 0" class="retry-count">
                <el-icon><Refresh /></el-icon>{{ row.retry_count }}
              </span>
              <EnumTag :value="row.status" :map="statusMap" size="small" />
            </div>
          </div>

          <div class="task-meta">
            <div class="meta-item">
              <span class="meta-label">目标</span>
              <span class="meta-value">{{ row.target || "-" }}</span>
            </div>
            <div class="meta-item" v-if="row.ctime">
              <span class="meta-label">创建</span>
              <span class="meta-value">{{ formatTaskTime(row.ctime) }}</span>
            </div>
            <div class="meta-item" v-if="row.trigger_position">
              <span class="meta-label">触发</span>
              <span class="meta-value">{{ row.trigger_position }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">计划</span>
              <span class="meta-value">{{ row.is_timing ? row.scheduled_time || "-" : "立即执行" }}</span>
            </div>
            <div class="meta-item meta-item--time" v-if="row.start_time || row.end_time">
              <span class="meta-label">时间</span>
              <span class="meta-value time-range-value">
                <span>{{ row.start_time ? formatTaskTime(row.start_time) : "--" }}</span>
                <span class="time-arrow">-></span>
                <span>{{ row.end_time ? formatTaskTime(row.end_time) : row.start_time ? "RUNNING" : "--" }}</span>
                <span class="duration-value" v-if="row.start_time && row.end_time">
                  ({{ calculateDuration(row.start_time, row.end_time) }})
                </span>
              </span>
            </div>
          </div>

          <div class="task-actions">
            <div class="action-links">
              <el-button link class="btn-action" @click="operateEvent(row, 'input')">
                <el-icon><Document /></el-icon>指令详情
              </el-button>
              <el-button link class="btn-action" @click="operateEvent(row, 'output')">
                <el-icon><DataLine /></el-icon>查看日志
              </el-button>
            </div>

            <div class="action-tools">
              <div class="config-group">
                <el-tooltip content="编辑参数" placement="top">
                  <button class="config-item" @click="operateEvent(row, 'args')">
                    <el-icon><Setting /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip content="运行变量" placement="top">
                  <button class="config-item" @click="operateEvent(row, 'variables')">
                    <el-icon><Box /></el-icon>
                  </button>
                </el-tooltip>
              </div>

              <AuthButton
                :capability="TICKET_CAPABILITIES.Task.Retry"
                size="small"
                plain
                type="warning"
                class="retry-button"
                @click="operateEvent(row, 'retry')"
              >
                <el-icon><Refresh /></el-icon>重新执行
              </AuthButton>
            </div>
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
import { ref, shallowRef, watch } from "vue"
import { ElMessage } from "element-plus"
import { Refresh, Monitor, Document, DataLine, Setting, Box } from "@element-plus/icons-vue"
import { task, Kind } from "@/api/ticket/task/types/task"
import {
  listTasksByInstanceIdApi,
  retryTaskApi,
  updateTaskArgsApi,
  updateTaskVariablesApi,
  getTaskLogsApi
} from "@/api/ticket/task"
import EnumTag from "@/common/components/EnumTag/index.vue"
import type { TagInfo } from "@/common/components/EnumTag/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import TaskResultDialog from "@/pages/ticket/task-history/components/TaskResultDialog.vue"
import TaskRetryDialog from "@/pages/ticket/task-history/components/TaskRetryDialog.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import dayjs from "dayjs"
import type { JsonValue, TaskDialogType } from "./types"
import { isTaskDialogType } from "./types"

interface Props {
  processInstId: number | undefined
}
const props = defineProps<Props>()
const { hasPermission } = usePermission()

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

const formatTaskTime = (value?: string | number) => {
  if (!value) return "--"
  const normalized = typeof value === "number" && value < 10000000000 ? value * 1000 : value
  const parsed = dayjs(normalized)
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : String(value)
}

type TaskOperation = TaskDialogType | "retry"

const currentDialogType = ref<TaskDialogType>("input")
const retryDialogVisible = ref<boolean>(false)
const retryLoading = ref<boolean>(false)

const taskId = ref<number>(0)
const result = shallowRef<JsonValue>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)

const parseTaskJson = (value: string): JsonValue => {
  if (!value) return {}

  try {
    return JSON.parse(value) as JsonValue
  } catch {
    ElMessage.warning("任务 JSON 内容格式异常，已使用空对象展示")
    return {}
  }
}

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
const operateEvent = async (data: task, name: TaskOperation) => {
  taskId.value = data.id

  switch (name) {
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
      } catch {
        ElMessage.error("获取任务日志失败")
      }
      break
    case "args":
      result.value = parseTaskJson(data.args)
      currentDialogType.value = "args"
      language.value = "json"
      resultVisible.value = true
      break
    case "variables":
      result.value = parseTaskJson(data.variables)
      currentDialogType.value = "variables"
      language.value = "json"
      resultVisible.value = true
      break
    case "retry":
      if (!hasPermission(TICKET_CAPABILITIES.Task.Retry)) {
        ElMessage.warning("暂无重试任务权限")
        return
      }
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

const toJsonValue = (value: unknown): JsonValue => {
  if (value === null) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map((item) => toJsonValue(item))
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]))
  }
  return String(value)
}

const handleSaveResult = async (data: { taskId: number; result: unknown; type: string }) => {
  if (!isTaskDialogType(data.type)) return

  try {
    switch (data.type) {
      case "args":
        await updateTaskArgsApi({ id: data.taskId, args: toJsonValue(data.result) })
        listTasksData()
        ElMessage.success("修改传递参数成功")
        break
      case "variables":
        await updateTaskVariablesApi({ id: data.taskId, variables: JSON.stringify(toJsonValue(data.result)) })
        listTasksData()
        ElMessage.success("修改传递变量成功")
        break
    }
  } catch (error) {
    console.error("保存任务数据失败:", error)
  }
}

const handleRetryConfirm = async () => {
  if (!hasPermission(TICKET_CAPABILITIES.Task.Retry)) {
    ElMessage.warning("暂无重试任务权限")
    retryDialogVisible.value = false
    return
  }

  retryLoading.value = true

  try {
    await retryTaskApi(taskId.value)
    ElMessage.success("重试已提交，请稍后查看结果")
    retryDialogVisible.value = false
    listTasksData()
  } catch (error) {
    console.log("任务重试失败", error)
  } finally {
    retryLoading.value = false
  }
}

defineExpose({
  listTasksData
})
</script>

<style scoped lang="scss">
.task-list-container {
  height: 100%;
  overflow-y: auto;
  background: #fff;
  padding: 16px 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item-card {
  border: 1px solid #e5eaf3;
  border-left: 3px solid #409eff;
  border-radius: 6px;
  background: #fbfdff;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bdd7f5;
  }
}

.task-main {
  padding: 14px 16px;
}

.task-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.task-title {
  display: flex;
  gap: 10px;
  min-width: 0;
}

.task-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 6px;
}

.task-name-group {
  min-width: 0;
}

.task-name {
  color: #1f2937;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.task-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  color: #7b8494;
  font-size: 12px;

  .separator {
    color: #c0c4cc;
  }
}

.task-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.retry-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #e6a23c;
  font-size: 12px;
  font-weight: 600;
}

.task-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 18px;
  margin: 14px 0 12px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
}

.meta-item--time {
  grid-column: 1 / -1;
}

.meta-label {
  flex-shrink: 0;
  width: 36px;
  color: #909399;
}

.meta-value {
  color: #374151;
  min-width: 0;
  word-break: break-all;
}

.time-arrow {
  color: #b8c2d1;
}

.time-range-value {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 8px;
  word-break: normal;
}

.duration-value {
  color: #409eff;
  font-weight: 700;
}

.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.action-links,
.action-tools,
.config-group {
  display: flex;
  align-items: center;
}

.action-links {
  gap: 14px;
}

.action-tools {
  gap: 10px;
}

.btn-action {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    color: #409eff;
  }
}

.config-group {
  gap: 4px;
  padding: 2px;
  border-radius: 6px;
  background: #f3f6fa;
}

.config-item {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    color: #409eff;
    background: #ffffff;
  }
}

.retry-button {
  font-weight: 600;
}
</style>
