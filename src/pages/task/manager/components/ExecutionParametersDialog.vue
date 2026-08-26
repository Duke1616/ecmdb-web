<template>
  <FormDialog
    v-model="visible"
    title="执行参数快照"
    subtitle="查看本次执行最终生效的参数与覆盖来源"
    width="min(860px, calc(100vw - 32px))"
    :header-icon="DataAnalysis"
    :show-footer="false"
  >
    <div v-loading="loading" class="parameters-content">
      <div v-if="snapshot" class="parameters-summary">
        <div class="summary-item summary-item--execution">
          <span class="summary-label">执行编号</span>
          <strong>#{{ snapshot.execution_id }}</strong>
        </div>
        <el-tooltip content="用户点击“立即执行”时，为本次执行临时传入的参数。" placement="top">
          <div class="summary-item">
            <span class="summary-label">手动覆盖</span>
            <strong>{{ snapshot.manual_override_count }} <small>项</small></strong>
          </div>
        </el-tooltip>
        <el-tooltip
          content="调度器为本次执行传入的动态参数，例如分页位置、续跑进度或重试信息；同名时优先于手动输入。"
          placement="top"
        >
          <div class="summary-item">
            <span class="summary-label">调度覆盖</span>
            <strong>{{ snapshot.schedule_override_count }} <small>项</small></strong>
          </div>
        </el-tooltip>
      </div>

      <el-table
        v-if="snapshot?.parameters?.length"
        :data="snapshot.parameters"
        class="parameters-table"
        size="default"
        max-height="460"
      >
        <el-table-column label="参数" width="260">
          <template #default="{ row }">
            <div class="parameter-name">
              <span class="parameter-label">{{ getParameterLabel(row.key) }}</span>
              <code v-if="getParameterLabel(row.key) !== row.key" class="parameter-key">{{ row.key }}</code>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最终值" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="parameter-value">{{ row.value }}</code>
          </template>
        </el-table-column>
        <el-table-column label="覆盖来源" width="130" align="center">
          <template #default="{ row }">
            <span v-if="row.source === 'TASK_SNAPSHOT'" class="source-default">任务配置</span>
            <el-tooltip v-else :content="getSourceMeta(row.source).description" placement="top">
              <span class="source-override" :class="`source-override--${row.source.toLowerCase()}`">
                {{ getSourceMeta(row.source).label }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="该执行没有参数快照" :image-size="92" />
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { DataAnalysis } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"
import { getExecutionParametersApi, getTaskDetailApi } from "@/api/task/manager"
import type { ExecutionParameterSource, ExecutionParametersVO } from "@/api/task/manager/type"
import { listAllResourcesApi } from "@/api/task/resource"

const visible = defineModel<boolean>({ default: false })
const props = defineProps<{ executionId: number | null; taskId?: number | null }>()

const loading = ref(false)
const snapshot = ref<ExecutionParametersVO | null>(null)
const parameterLabels = ref<Record<string, string>>({})
let loadRequest = 0

const builtInParameterLabels: Record<string, string> = {
  variables: "环境变量",
  vars: "剧本变量"
}

const sourceMeta: Record<ExecutionParameterSource, { label: string; description: string }> = {
  TASK_SNAPSHOT: { label: "任务配置", description: "任务创建时保存的基础参数。" },
  SCHEDULE_OVERRIDE: {
    label: "调度覆盖",
    description: "调度器为本次执行传入的动态参数；同名时优先于手动输入。"
  },
  MANUAL_OVERRIDE: {
    label: "手动覆盖",
    description: "用户手动启动本次执行时传入的参数；没有调度覆盖时生效。"
  },
  SYSTEM: { label: "系统参数", description: "由系统根据执行配置自动生成的参数。" }
}

const getSourceMeta = (source: string) =>
  sourceMeta[source as ExecutionParameterSource] ?? {
    label: "未知来源",
    description: "无法识别该参数的来源。"
  }

const getParameterLabel = (key: string) => parameterLabels.value[key] || builtInParameterLabels[key] || key

const loadParameterLabels = async (taskId: number, requestId: number) => {
  try {
    const [{ data: task }, resources] = await Promise.all([getTaskDetailApi(taskId), listAllResourcesApi()])
    if (requestId !== loadRequest || !task.grpc_config) return

    const handler = resources
      .find((resource) => resource.name === task.grpc_config?.service_name)
      ?.handlers.find((item) => item.name === task.grpc_config?.handler_name)
    parameterLabels.value = Object.fromEntries(
      (handler?.metadata ?? [])
        .filter((parameter) => parameter.desc?.trim())
        .map((parameter) => [parameter.key, parameter.desc.trim()])
    )
  } catch {
    // 参数名称只是展示增强，元数据不可用时保留机器键名，不影响快照本身。
  }
}

const load = async () => {
  if (!props.executionId) return
  const requestId = ++loadRequest
  parameterLabels.value = {}
  loading.value = true
  try {
    const response = await getExecutionParametersApi(props.executionId)
    if (requestId !== loadRequest) return
    snapshot.value = response.data
    if (props.taskId) void loadParameterLabels(props.taskId, requestId)
  } catch (error) {
    if (requestId !== loadRequest) return
    snapshot.value = null
    ElMessage.error(error instanceof Error ? error.message : "加载执行参数失败")
  } finally {
    loading.value = false
  }
}

watch([visible, () => props.executionId], ([value]) => {
  if (value) void load()
  else {
    loadRequest++
    snapshot.value = null
    parameterLabels.value = {}
  }
})
</script>

<style scoped lang="scss">
.parameters-content {
  min-height: 140px;
}

.parameters-summary {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 13px 16px;
  background: #f8fafc;
  border: 1px solid #e5eaf1;
  border-radius: 10px;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 0 20px;

  strong {
    color: #1f2937;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }

  small {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 500;
  }
}

.summary-item--execution {
  padding-left: 0;

  strong {
    color: #2563eb;
  }
}

.summary-item + .el-tooltip,
.summary-item + .summary-item {
  border-left: 1px solid #dfe5ec;
}

:deep(.parameters-summary > .el-tooltip) {
  display: flex;
  align-items: baseline;
  padding: 0 20px;
}

:deep(.parameters-summary > .el-tooltip .summary-item) {
  padding: 0;
}

.summary-label {
  color: #94a3b8;
  font-size: 12px;
}

.parameter-value {
  display: block;
  overflow: hidden;
  color: #334155;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parameter-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.parameter-label {
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parameter-key {
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-default {
  color: #94a3b8;
  font-size: 12px;
}

.source-override {
  font-size: 12px;
  line-height: 1.4;
}

.source-override--manual_override {
  color: #f56c6c;
}

.source-override--schedule_override {
  color: #e6a23c;
}

.source-override--system {
  color: #409eff;
}

:deep(.parameters-table) {
  overflow: hidden;
  border: 1px solid #e8edf3;
  border-radius: 10px;

  .el-table__inner-wrapper::before {
    display: none;
  }

  th.el-table__cell {
    height: 40px;
    color: #64748b;
    background: #f8fafc;
    font-size: 12px;
    font-weight: 600;
  }

  td.el-table__cell {
    height: 58px;
    color: #475569;
    border-bottom-color: #eef2f6;
  }

  tr:last-child td.el-table__cell {
    border-bottom: 0;
  }

  .el-table__row:hover > td.el-table__cell {
    background: #f8fbff;
  }
}

@media (max-width: 640px) {
  .parameters-summary {
    flex-wrap: wrap;
    gap: 12px 0;
  }

  .summary-item {
    padding: 0 14px;
  }

  :deep(.parameters-summary > .el-tooltip) {
    padding: 0 14px;
  }
}
</style>
