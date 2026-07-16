<template>
  <Drawer
    v-model="visible"
    title="脚本试运行"
    :subtitle="currentCodebook ? `使用当前编辑内容运行【${currentCodebook.name}】` : '验证脚本与制品依赖的执行效果'"
    :header-icon="VideoPlay"
    size="min(920px, 100%)"
    :show-footer="true"
    :close-on-click-modal="false"
    class="codebook-run-drawer"
    @closed="reset"
  >
    <template #header-actions>
      <div v-if="execution" class="header-status">
        <span class="status-dot" :class="statusClass" />
        <span>{{ statusText }}</span>
      </div>
    </template>

    <div class="run-content" v-loading="loadingRunners">
      <button
        v-if="execution"
        type="button"
        class="config-summary"
        :class="{ 'is-expanded': configExpanded }"
        @click="configExpanded = !configExpanded"
      >
        <span class="summary-title">运行配置</span>
        <span class="summary-value">{{ selectedRunner?.name || "未选择执行单元" }}</span>
        <span class="summary-separator">·</span>
        <span class="summary-value">{{ form.max_execution_seconds }} 秒</span>
        <el-icon class="summary-arrow"><ArrowDown /></el-icon>
      </button>

      <el-collapse-transition>
        <section v-show="!execution || configExpanded" class="config-panel">
          <div class="section-heading">
            <div>
              <h4>运行配置</h4>
              <p>参数仅用于本次运行，不会保存到脚本或执行单元。</p>
            </div>
            <span class="snapshot-badge">临时快照</span>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="run-form">
            <div class="form-grid">
              <el-form-item label="执行单元" prop="runner_id" class="runner-field">
                <el-select
                  v-model="form.runner_id"
                  placeholder="选择当前脚本绑定的执行单元"
                  filterable
                  :disabled="isRunning"
                >
                  <el-option
                    v-for="runner in supportedRunners"
                    :key="runner.id"
                    :label="runner.name"
                    :value="runner.id"
                  >
                    <div class="runner-option">
                      <span>
                        {{ runner.name }}
                        <el-tag size="small" effect="plain" :type="runner.kind === Kind.KAFKA ? 'warning' : 'success'">
                          {{ runner.kind === Kind.KAFKA ? "Agent" : "Executor" }}
                        </el-tag>
                      </span>
                      <small>{{ runner.target }} / {{ runner.handler }}</small>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="超时时间" prop="max_execution_seconds" class="timeout-field">
                <el-input-number
                  v-model="form.max_execution_seconds"
                  :min="1"
                  :max="3600"
                  :step="30"
                  controls-position="right"
                  :disabled="isRunning"
                />
                <span class="input-suffix">秒</span>
              </el-form-item>
            </div>

            <el-alert
              v-if="!loadingRunners && supportedRunners.length === 0"
              title="当前脚本没有可试运行的执行单元"
              description="请先绑定 Python 或 Shell 类型的执行单元。"
              type="warning"
              :closable="false"
              show-icon
              class="runner-alert"
            />

            <el-form-item prop="args">
              <template #label>
                <div class="json-input-header">
                  <span>运行参数（JSON）</span>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    class="format-btn"
                    :disabled="isRunning"
                    @click="formatJSON"
                  >
                    格式化 JSON
                  </el-button>
                </div>
              </template>
              <el-input
                v-model="form.args"
                type="textarea"
                :rows="5"
                resize="none"
                spellcheck="false"
                placeholder='例如：{"name":"demo"}'
                class="json-input"
                :disabled="isRunning"
              />
            </el-form-item>

            <el-form-item label="临时变量" class="variables-field">
              <KVEditor
                v-model="form.variables"
                value-type="array"
                title-key="变量名"
                title-value="临时值"
                add-text="添加临时变量"
                empty-text="未配置临时变量，将使用执行单元默认变量"
                :show-secret="true"
              />
            </el-form-item>
          </el-form>
        </section>
      </el-collapse-transition>

      <section v-if="execution" class="execution-panel">
        <div class="execution-overview">
          <div class="overview-main">
            <span class="execution-status" :class="statusClass">{{ statusText }}</span>
            <span class="execution-id">#{{ execution.id }}</span>
          </div>
          <div class="overview-meta">
            <span
              ><el-icon><Connection /></el-icon>{{ execution.executor_node_id || "等待分配执行节点" }}</span
            >
            <span
              ><el-icon><Timer /></el-icon>{{ elapsedText }}</span
            >
          </div>
        </div>

        <el-tabs v-model="outputTab" class="output-tabs">
          <el-tab-pane label="运行日志" name="logs">
            <div class="terminal">
              <div class="terminal-bar">
                <span class="terminal-lights"><i /><i /><i /></span>
                <span>STDOUT</span>
                <el-button :icon="RefreshRight" text circle :loading="logsLoading" @click="fetchLogs()" />
              </div>
              <div ref="logViewportRef" class="terminal-body">
                <pre v-if="fullLogs">{{ fullLogs }}</pre>
                <div v-else class="terminal-empty">
                  <span v-if="isRunning" class="terminal-cursor" />
                  {{ isRunning ? "等待执行节点输出日志…" : "本次运行没有输出日志" }}
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane name="result">
            <template #label>
              <span class="result-tab-label">返回结果<i v-if="execution.task_result" /></span>
            </template>
            <div class="result-view">
              <pre v-if="execution.task_result">{{ formattedResult }}</pre>
              <el-empty v-else description="执行节点暂未返回结果" :image-size="72" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <template #footer>
      <div class="drawer-footer-actions">
        <span class="footer-hint">试运行不会创建正式任务，也不会进入调度列表</span>
        <el-button @click="visible = false">关闭</el-button>
        <el-button
          type="primary"
          :icon="VideoPlay"
          :loading="starting"
          :disabled="isRunning || supportedRunners.length === 0"
          @click="run"
        >
          {{ execution ? "重新运行" : "开始试运行" }}
        </el-button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from "vue"
import { ArrowDown, Connection, RefreshRight, Timer, VideoPlay } from "@element-plus/icons-vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Drawer } from "@/common/components/Dialogs"
import KVEditor from "@/pages/task/manager/components/KVEditor.vue"
import { listRunnerByCodebookIdApi } from "@/api/task/runner"
import { Kind, type runner } from "@/api/task/runner/types/runner"
import { getCodebookPreviewLogsApi, getCodebookPreviewStatusApi, runCodebookPreviewApi } from "@/api/task/codebook"
import type { codebook } from "@/api/task/codebook/types/codebook"
import type { PreviewExecution, PreviewVariable } from "@/api/task/codebook/types/preview"
import { useExecutionLogsSSE } from "@/sse/etask/manager"

interface RunForm {
  runner_id?: number
  args: string
  variables: PreviewVariable[]
  max_execution_seconds: number
}

const visible = ref(false)
const currentCodebook = ref<codebook>()
const runners = ref<runner[]>([])
const loadingRunners = ref(false)
const starting = ref(false)
const logsLoading = ref(false)
const execution = ref<PreviewExecution>()
const formRef = ref<FormInstance>()
const configExpanded = ref(true)
const outputTab = ref("logs")
const fullLogs = ref("")
const lastLogID = ref(0)
const logViewportRef = ref<HTMLElement>()
const elapsedNow = ref(Date.now())
let pollTimer: number | undefined

const form = reactive<RunForm>({
  runner_id: undefined,
  args: "{}",
  variables: [],
  max_execution_seconds: 300
})

const rules: FormRules<RunForm> = {
  runner_id: [{ required: true, message: "请选择执行单元", trigger: "submit" }],
  args: [
    {
      trigger: "submit",
      validator: (_rule, value: string, callback) => {
        try {
          JSON.parse(value || "{}")
          callback()
        } catch {
          callback(new Error("请输入合法的 JSON 参数"))
        }
      }
    }
  ],
  max_execution_seconds: [
    { required: true, type: "number", min: 1, max: 3600, message: "超时时间应为 1 到 3600 秒", trigger: "submit" }
  ]
}

const formatJSON = () => {
  try {
    const rawVal = form.args.trim()
    const parsed = JSON.parse(rawVal || "{}")
    form.args = JSON.stringify(parsed, null, 2)
  } catch {
    ElMessage.warning("JSON 格式不正确，无法格式化")
  }
}

const supportedRunners = computed(() =>
  runners.value.filter(
    (item) =>
      [Kind.GRPC, Kind.KAFKA].includes(item.kind) && ["python", "shell"].includes(item.handler?.toLowerCase() || "")
  )
)
const selectedRunner = computed(() => supportedRunners.value.find((item) => item.id === form.runner_id))
const isRunning = computed(() => ["WAITING_PULL", "PREPARE", "RUNNING"].includes(execution.value?.status || ""))
const statusText = computed(() => {
  const labels: Record<string, string> = {
    WAITING_PULL: "等待节点拉取",
    PREPARE: "准备中",
    RUNNING: "运行中",
    SUCCESS: "运行成功",
    FAILED: "运行失败"
  }
  return labels[execution.value?.status || ""] || "等待运行"
})
const statusClass = computed(() => `is-${(execution.value?.status || "prepare").toLowerCase().replaceAll("_", "-")}`)
const elapsedText = computed(() => {
  if (!execution.value) return "-"
  const start = execution.value.start_time || execution.value.ctime
  const end = execution.value.end_time || elapsedNow.value
  if (!start) return "-"
  const milliseconds = Math.max(end - start, 0)
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`
})
const formattedResult = computed(() => {
  const result = execution.value?.task_result || ""
  try {
    return JSON.stringify(JSON.parse(result), null, 2)
  } catch {
    return result
  }
})

useExecutionLogsSSE({
  executionId: () => execution.value?.id,
  enabled: () => visible.value && Boolean(execution.value?.id) && isRunning.value,
  onMessage: (event) => {
    if (event.id <= lastLogID.value) return
    appendLogs(event.content)
    lastLogID.value = event.id
  }
})

/** 打开试运行抽屉，并加载当前脚本绑定的执行单元。 */
async function open(row: codebook) {
  stopPolling()
  currentCodebook.value = { ...row }
  execution.value = undefined
  fullLogs.value = ""
  lastLogID.value = 0
  outputTab.value = "logs"
  configExpanded.value = true
  form.runner_id = undefined
  form.args = "{}"
  form.variables = []
  form.max_execution_seconds = 300
  visible.value = true

  loadingRunners.value = true
  try {
    const { data } = await listRunnerByCodebookIdApi(row.id)
    runners.value = data.runners || []
    if (supportedRunners.value.length === 1) {
      form.runner_id = supportedRunners.value[0].id
    }
  } finally {
    loadingRunners.value = false
  }
}

/** 使用当前编辑器代码创建一次临时执行。 */
async function run() {
  if (!currentCodebook.value || isRunning.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !form.runner_id) return

  starting.value = true
  stopPolling()
  fullLogs.value = ""
  lastLogID.value = 0
  outputTab.value = "logs"
  try {
    const { data } = await runCodebookPreviewApi({
      codebook_id: currentCodebook.value.id,
      runner_id: form.runner_id,
      code: currentCodebook.value.code || "",
      args: form.args || "{}",
      variables: form.variables,
      max_execution_seconds: form.max_execution_seconds
    })
    execution.value = data
    elapsedNow.value = Date.now()
    configExpanded.value = false
    schedulePoll(0)
  } catch {
    ElMessage.error("启动试运行失败")
  } finally {
    starting.value = false
  }
}

/** 查询执行状态，并在终态前持续轮询。 */
async function pollStatus() {
  if (!visible.value || !execution.value?.id) return
  try {
    const { data } = await getCodebookPreviewStatusApi({ execution_id: execution.value.id })
    execution.value = data
    elapsedNow.value = Date.now()
    await fetchLogs(true)
  } finally {
    if (visible.value && isRunning.value) schedulePoll(1000)
  }
}

/** 增量读取日志，SSE 中断时轮询仍可补齐日志。 */
async function fetchLogs(silent = false) {
  if (!execution.value?.id) return
  if (!silent) logsLoading.value = true
  try {
    const { data } = await getCodebookPreviewLogsApi({
      execution_id: execution.value.id,
      min_id: lastLogID.value,
      limit: 1000
    })
    const logs = data.logs || []
    for (const log of logs) {
      if (log.id <= lastLogID.value) continue
      appendLogs(log.content)
      lastLogID.value = log.id
    }
  } finally {
    if (!silent) logsLoading.value = false
  }
}

function appendLogs(content: string) {
  if (!content) return
  fullLogs.value = fullLogs.value ? `${fullLogs.value}\n${content}` : content
  nextTick(() => {
    if (logViewportRef.value) logViewportRef.value.scrollTop = logViewportRef.value.scrollHeight
  })
}

function schedulePoll(delay: number) {
  stopPolling()
  pollTimer = window.setTimeout(pollStatus, delay)
}

function stopPolling() {
  if (pollTimer !== undefined) {
    window.clearTimeout(pollTimer)
    pollTimer = undefined
  }
}

function reset() {
  stopPolling()
  currentCodebook.value = undefined
  execution.value = undefined
  runners.value = []
  fullLogs.value = ""
  lastLogID.value = 0
}

onBeforeUnmount(stopPolling)
defineExpose({ open })
</script>

<style lang="scss" scoped>
.run-content {
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: #f8fafc;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  border-radius: 999px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #94a3b8;
  border-radius: 50%;

  &.is-running,
  &.is-waiting-pull,
  &.is-prepare {
    background: #3b82f6;
    animation: heartbeat 1.5s infinite ease-in-out;
  }

  &.is-success {
    background: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  }

  &.is-failed {
    background: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
  }
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.config-panel,
.execution-panel {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
  padding-top: 3px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #6366f1);
  }
}

.config-panel {
  padding: 20px 22px 8px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;

  h4 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 600;
  }

  p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.snapshot-badge {
  padding: 3px 8px;
  color: #6366f1;
  font-size: 11px;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 999px;
}

.json-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .format-btn {
    font-weight: 500;
    font-size: 12px;
    padding: 0;
    color: #3b82f6;

    &:hover {
      color: #2563eb;
    }
  }
}

.variables-field :deep(.add-trigger) {
  border-color: #dbeafe;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;

  &:hover {
    background: #dbeafe;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
}

.run-form {
  :deep(.el-form-item__label) {
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }

  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }
}

.timeout-field {
  position: relative;

  :deep(.el-input-number .el-input__inner) {
    padding-right: 48px;
    text-align: left;
  }
}

.input-suffix {
  position: absolute;
  z-index: 2;
  right: 34px;
  bottom: 9px;
  color: #94a3b8;
  font-size: 12px;
  pointer-events: none;
}

.runner-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  small {
    color: #94a3b8;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
}

.runner-alert {
  margin: -2px 0 16px;
}

.json-input {
  :deep(textarea) {
    color: #1e293b;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    background: #f8fafc;
    border-color: #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:focus {
      background: #fff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }
  }
}

.variables-field :deep(.el-form-item__content) {
  display: block;
}

.config-summary {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 0 14px;
  padding: 12px 16px;
  color: #475569;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .summary-title {
    margin-right: 16px;
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
  }

  .summary-value,
  .summary-separator {
    font-size: 12px;
  }

  .summary-separator {
    margin: 0 8px;
    color: #cbd5e1;
  }

  .summary-arrow {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  &.is-expanded .summary-arrow {
    transform: rotate(180deg);
  }
}

.execution-panel {
  margin-top: 14px;
}

.execution-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 18px;
  border-bottom: 1px solid #eef2f7;
}

.overview-main,
.overview-meta,
.overview-meta span {
  display: flex;
  align-items: center;
}

.overview-main {
  gap: 10px;
}

.execution-status {
  padding: 4px 9px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  background: #eff6ff;
  border-radius: 6px;

  &.is-success {
    color: #047857;
    background: #ecfdf5;
  }

  &.is-failed {
    color: #b91c1c;
    background: #fef2f2;
  }
}

.execution-id {
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.overview-meta {
  gap: 18px;
  color: #64748b;
  font-size: 11px;

  span {
    gap: 6px;
  }
}

.output-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 18px;
  }

  :deep(.el-tabs__content) {
    padding: 14px 18px 18px;
  }
}

.result-tab-label {
  position: relative;

  i {
    position: absolute;
    top: -2px;
    right: -8px;
    width: 5px;
    height: 5px;
    background: #3b82f6;
    border-radius: 50%;
  }
}

.terminal {
  overflow: hidden;
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.terminal-bar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px 0 12px;
  color: #8b949e;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  background: #161b22;
  border-bottom: 1px solid #21262d;

  .el-button {
    margin-left: auto;
    color: #8b949e;
  }
}

.terminal-lights {
  display: flex;
  gap: 5px;
  margin-right: 12px;

  i {
    width: 7px;
    height: 7px;
    background: #ef4444;
    border-radius: 50%;

    &:nth-child(2) {
      background: #f59e0b;
    }

    &:nth-child(3) {
      background: #10b981;
    }
  }
}

.terminal-body,
.result-view {
  min-height: 300px;
  max-height: 420px;
  overflow: auto;

  /* Custom Webkit scrollbar for premium terminal look */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #0d1117;
    border-radius: 0 0 10px 0;
  }
  &::-webkit-scrollbar-thumb {
    background: #30363d;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #8b949e;
  }
}

.terminal-body {
  padding: 14px 16px;
  box-sizing: border-box;

  pre,
  .terminal-empty {
    margin: 0;
    color: #c9d1d9;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .terminal-empty {
    color: #8b949e;
  }
}

.terminal-cursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  margin-right: 8px;
  vertical-align: -2px;
  background: #58a6ff;
  animation: blink 1s step-end infinite;
}

.result-view {
  padding: 16px;
  box-sizing: border-box;
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 10px;

  pre {
    margin: 0;
    color: #c9d1d9;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.drawer-footer-actions {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.footer-hint {
  margin-right: auto;
  color: #94a3b8;
  font-size: 11px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .execution-overview,
  .drawer-footer-actions {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .footer-hint {
    width: 100%;
  }
}
</style>
