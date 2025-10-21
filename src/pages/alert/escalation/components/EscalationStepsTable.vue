<template>
  <div class="form-section">
    <div v-if="modelValue.length === 0" class="empty-steps">
      <el-empty description="暂无升级步骤" />
    </div>

    <div v-else class="steps-table-container">
      <DataTable
        :data="modelValue"
        :columns="stepTableColumns"
        :show-selection="false"
        :show-pagination="false"
        :enable-row-drag="true"
        @row-drag="handleStepRowDrag"
      >
        <!-- 级别列 -->
        <template #level="{ index }">
          <el-tag type="primary" size="default"> 第 {{ index + 1 }} 级 </el-tag>
        </template>

        <!-- 模板集列 -->
        <template #templateSet="{ row }">
          <span>{{ row.template_set_id ? getTemplateSetName(row.template_set_id) : "未设置" }}</span>
        </template>

        <!-- 步骤模板列 -->
        <template #stepTemplate="{ row }">
          <span>{{ row.step_template_id ? getStepTemplateName(row.step_template_id) : "未设置" }}</span>
        </template>

        <!-- 延迟时间列 -->
        <template #delay="{ row }">
          <span>{{ formatDelay(row.delay) }}</span>
        </template>

        <!-- 重试次数列 -->
        <template #retries="{ row }">
          <span>{{ row.max_retries }}次</span>
        </template>

        <!-- 执行条件列 -->
        <template #condition="{ row }">
          <span v-if="row.condition_expr" class="condition-text">{{ row.condition_expr }}</span>
          <span v-else class="text-gray-400">无条件</span>
        </template>

        <!-- 通知渠道列 -->
        <template #channels="{ row }">
          <div class="channels-cell">
            <div v-if="getStepTemplateChannels(row.step_template_id).length > 0" class="channels-container">
              <el-tooltip
                v-for="channel in getStepTemplateChannels(row.step_template_id)"
                :key="channel"
                :content="`通知渠道: ${getChannelLabelSafe(channel)}`"
                placement="top"
                effect="dark"
              >
                <div class="channel-item">
                  <el-icon class="channel-icon"><Bell /></el-icon>
                  <span class="channel-name">{{ getChannelLabelSafe(channel) }}</span>
                </div>
              </el-tooltip>
            </div>
            <div v-else class="empty-channels">
              <el-text type="info" size="small">暂无渠道</el-text>
            </div>
          </div>
        </template>

        <!-- 接收者列 -->
        <template #receivers="{ row }">
          <div class="receivers-cell">
            <div v-if="getStepTemplateReceivers(row.step_template_id).length > 0" class="receivers-container">
              <el-tooltip
                v-for="receiver in getStepTemplateReceivers(row.step_template_id)"
                :key="receiver.id"
                :content="getReceiverTooltipContent(receiver)"
                placement="top"
                effect="dark"
              >
                <div class="receiver-item">
                  <el-icon class="receiver-icon"><User /></el-icon>
                  <span class="receiver-name">{{ receiver.display_name }}</span>
                  <el-tag :type="getReceiverTypeTagType(receiver.type)" size="small" class="receiver-type-tag">
                    {{ getReceiverTypeLabel(receiver.type) }}
                  </el-tag>
                </div>
              </el-tooltip>
            </div>
            <div v-else class="empty-receivers">
              <el-text type="info" size="small">暂无接收者</el-text>
            </div>
          </div>
        </template>

        <!-- 操作列 -->
        <template #actions="{ index }">
          <div class="action-buttons">
            <el-button type="primary" size="small" @click="editStep(index)">
              <el-icon><Setting /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="removeStep(index)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { Delete, Setting, Bell, User } from "@element-plus/icons-vue"
import type { StepVO, EscalationStep, StepTemplateVO } from "@/api/alert/escalation/types"
import type { TemplateSet } from "@/api/alert/template_set/types"
import { listStepTemplatesByIDsApi } from "@/api/alert/escalation"
import { listTemplateSetsByIDsApi } from "@/api/alert/template_set"
import { getChannelLabel } from "../../template/config/channels"
import { CHANNEL_CONFIGS } from "../../template/config/channels"
import { getReceiverTypeLabel, getReceiverTypeTagType, getReceiverTooltipContent } from "../utils"
import DataTable from "@/common/components/DataTable/index.vue"
import { ChannelType } from "@/api/alert/template/types"

// 定义 props 和 emits
const props = defineProps<{
  modelValue: StepVO[] | EscalationStep[]
}>()

const emit = defineEmits<{
  "update:modelValue": [value: StepVO[] | EscalationStep[]]
  "add-step": []
  "edit-step": [index: number, step: StepVO | EscalationStep]
  "delete-step": [index: number, step: StepVO | EscalationStep]
  "row-drag": [newSteps: StepVO[] | EscalationStep[]]
}>()

// 使用 v-model
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

// 升级步骤表格列配置
const stepTableColumns = computed(() => [
  {
    prop: "level",
    label: "级别",
    width: 150,
    slot: "level"
  },
  {
    prop: "template_set_name",
    label: "模板集",
    minWidth: 120,
    slot: "templateSet"
  },
  {
    prop: "step_template_name",
    label: "步骤模板",
    minWidth: 150,
    slot: "stepTemplate"
  },
  {
    prop: "channels",
    label: "通知渠道",
    minWidth: 200,
    slot: "channels"
  },
  {
    prop: "receivers",
    label: "接收者",
    minWidth: 240,
    slot: "receivers"
  }
])

// 模板集和步骤模板数据
const templateSets = ref<TemplateSet[]>([])
const stepTemplates = ref<StepTemplateVO[]>([])

// 表格行拖拽处理
const handleStepRowDrag = (newSteps: StepVO[] | EscalationStep[]) => {
  emit("row-drag", newSteps)
}

// 编辑步骤
const editStep = (index: number) => {
  const step = modelValue.value[index]
  emit("edit-step", index, step)
}

// 删除步骤
const removeStep = (index: number) => {
  const step = modelValue.value[index]
  emit("delete-step", index, step)
}

// 加载模板集数据
const loadTemplateSets = async () => {
  try {
    // 收集所有步骤中的 template_set_id
    const templateSetIds = modelValue.value
      .map((step) => step.template_set_id)
      .filter((id) => id && id > 0)
      .filter((id, index, arr) => arr.indexOf(id) === index) // 去重

    if (templateSetIds.length > 0) {
      const response = await listTemplateSetsByIDsApi({
        ids: templateSetIds
      })
      templateSets.value = response.data.template_sets || []
    } else {
      templateSets.value = []
    }
  } catch (error) {
    console.error("加载模板集失败:", error)
    templateSets.value = []
  }
}

// 加载步骤模板数据
const loadStepTemplates = async () => {
  try {
    // 收集所有步骤中的 step_template_id
    const stepTemplateIds = modelValue.value
      .map((step) => step.step_template_id)
      .filter((id): id is number => id !== undefined && id > 0)
      .filter((id, index, arr) => arr.indexOf(id) === index) // 去重

    if (stepTemplateIds.length > 0) {
      const response = await listStepTemplatesByIDsApi({
        ids: stepTemplateIds
      })
      stepTemplates.value = response.data.templates || []
    } else {
      stepTemplates.value = []
    }
  } catch (error) {
    console.error("加载步骤模板失败:", error)
    stepTemplates.value = []
  }
}

// 获取模板集名称
const getTemplateSetName = (id: number) => {
  const templateSet = templateSets.value.find((ts) => ts.id === id)
  return templateSet ? templateSet.name : `模板集 ${id}`
}

// 获取步骤模板名称
const getStepTemplateName = (id: number) => {
  const template = stepTemplates.value.find((st) => st.id === id)
  return template ? template.name : `步骤模板 ${id}`
}

// 获取步骤模板内容
const getStepTemplateContent = (id?: number) => {
  if (!id) return null
  return stepTemplates.value.find((st) => st.id === id) || null
}

// 获取步骤模板的通知渠道
const getStepTemplateChannels = (id?: number) => {
  if (!id) return []
  const template = getStepTemplateContent(id)
  return template ? template.channels : []
}

// 获取步骤模板的接收者
const getStepTemplateReceivers = (id?: number) => {
  if (!id) return []
  const template = getStepTemplateContent(id)
  return template ? template.receivers : []
}

// 格式化延迟时间
const formatDelay = (delay: number) => {
  if (delay < 60) {
    return `${delay}分钟`
  } else if (delay < 1440) {
    return `${Math.floor(delay / 60)}小时${delay % 60 > 0 ? `${delay % 60}分钟` : ""}`
  } else {
    return `${Math.floor(delay / 1440)}天${Math.floor((delay % 1440) / 60)}小时${delay % 60 > 0 ? `${delay % 60}分钟` : ""}`
  }
}

// 获取渠道标签（处理字符串类型）
const getChannelLabelSafe = (channel: string): string => {
  // 首先尝试使用原有的函数
  try {
    return getChannelLabel(channel as ChannelType)
  } catch {
    // 如果失败，使用配置映射
    return CHANNEL_CONFIGS[channel]?.label || channel
  }
}

// 监听 modelValue 变化，重新加载模板数据
watch(
  () => modelValue.value,
  () => {
    loadTemplateSets()
    loadStepTemplates()
  },
  { deep: true }
)

// 组件挂载时加载模板数据
onMounted(() => {
  loadTemplateSets()
  loadStepTemplates()
})
</script>

<style scoped lang="scss">
.form-section {
  height: 100%;
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .empty-steps {
    padding: 40px 0;
    text-align: center;
  }
}

// 步骤表格容器样式
.steps-table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .condition-text {
    font-family: "Courier New", monospace;
    font-size: 12px;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    color: #606266;
  }

  // 通知渠道样式
  .channels-cell {
    .channels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
      justify-content: center;
    }

    .channel-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;

      &:hover {
        background: #e0f2fe;
        border-color: #7dd3fc;
      }

      .channel-icon {
        font-size: 11px;
        color: #0284c7;
        flex-shrink: 0;
      }

      .channel-name {
        font-size: 11px;
        color: #0c4a6e;
        font-weight: 500;
        white-space: nowrap;
      }
    }

    .empty-channels {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      color: #9ca3af;
    }
  }

  // 接收者样式
  .receivers-cell {
    .receivers-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
      justify-content: center;
    }

    .receiver-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;

      &:hover {
        background: #dcfce7;
        border-color: #86efac;
      }

      .receiver-icon {
        font-size: 11px;
        color: #16a34a;
        flex-shrink: 0;
      }

      .receiver-name {
        font-size: 11px;
        color: #166534;
        font-weight: 500;
        white-space: nowrap;
      }

      .receiver-type-tag {
        font-size: 9px;
        padding: 1px 3px;
        height: 14px;
        line-height: 12px;
        flex-shrink: 0;
      }
    }

    .empty-receivers {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      color: #9ca3af;
    }
  }
}
</style>
