<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">升级步骤</h3>
      <el-button type="primary" :icon="Plus" size="small" @click="addStep"> 添加步骤 </el-button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-steps">
      <el-empty description="暂无升级步骤，点击上方按钮添加" />
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
            </el-button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>

  <!-- 升级步骤编辑抽屉 -->
  <CustomDrawer
    v-model="stepEditDialogVisible"
    :title="currentStepIndex === -1 ? '新建升级步骤' : '编辑升级步骤'"
    :subtitle="currentStepIndex === -1 ? '新建升级步骤' : `升级步骤 ${currentStepIndex + 1}`"
    size="50%"
    direction="rtl"
    :show-footer="true"
    :header-icon="Setting"
    @closed="handleStepEditClosed"
    @confirm="saveStepEdit"
  >
    <EscalationStepForm v-model="currentStep" ref="stepFormRef" />
  </CustomDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { Plus, Delete, Setting, Bell, User } from "@element-plus/icons-vue"
import type { CreateStepReq, StepTemplateVO } from "@/api/alert/escalation/types"
import type { TemplateSet } from "@/api/alert/template_set/types"
import { listStepTemplatesApi, listStepTemplatesByIDsApi } from "@/api/alert/escalation"
import { listTemplateSetsApi } from "@/api/alert/template_set"
import { getChannelLabel } from "../../template/config/channels"
import { CHANNEL_CONFIGS } from "../../template/config/channels"
import { getReceiverTypeLabel, getReceiverTypeTagType, getReceiverTooltipContent } from "../utils"
import DataTable from "@/common/components/DataTable/index.vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import EscalationStepForm from "./EscalationStepForm.vue"
import { ChannelType } from "@/api/alert/template/types"

// 定义 props 和 emits
const props = defineProps<{
  modelValue: CreateStepReq[]
}>()

const emit = defineEmits<{
  "update:modelValue": [value: CreateStepReq[]]
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
    minWidth: 120,
    slot: "channels"
  },
  {
    prop: "receivers",
    label: "接收者",
    minWidth: 150,
    slot: "receivers"
  }
])

// 步骤编辑相关状态
const stepEditDialogVisible = ref(false)
const currentStepIndex = ref(-1)
const currentStep = ref<CreateStepReq>({
  level: 1,
  template_set_id: 0,
  step_template_id: 0,
  delay: 0,
  max_retries: 3,
  retry_interval: 300,
  skip_if_handled: false,
  continue_on_fail: false,
  condition_expr: "",
  urgency_level: 1,
  config_id: 0
})
const stepFormRef = ref<InstanceType<typeof EscalationStepForm>>()

// 模板集和步骤模板数据
const templateSets = ref<TemplateSet[]>([])
const stepTemplates = ref<StepTemplateVO[]>([])

// 表格行拖拽处理
const handleStepRowDrag = (newSteps: CreateStepReq[]) => {
  // 更新步骤数据
  modelValue.value = newSteps

  // 重新计算级别
  updateStepLevels()
}

// 更新步骤级别
const updateStepLevels = () => {
  modelValue.value.forEach((step, index) => {
    step.level = index + 1
  })
}

// 添加步骤
const addStep = () => {
  // 创建新步骤但不立即添加到列表中
  const newStep: CreateStepReq = {
    level: modelValue.value.length + 1,
    template_set_id: 0,
    step_template_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 300,
    skip_if_handled: false,
    continue_on_fail: false,
    condition_expr: "",
    urgency_level: 1,
    config_id: 0
  }

  // 设置当前步骤为新建的步骤
  currentStep.value = newStep
  currentStepIndex.value = -1 // 使用 -1 表示这是新建步骤

  // 直接打开编辑抽屉
  stepEditDialogVisible.value = true
}

// 编辑步骤
const editStep = async (index: number) => {
  currentStepIndex.value = index
  const step = modelValue.value[index]

  // 复制步骤数据
  currentStep.value = { ...step }

  // 如果有步骤模板ID，加载模板详情
  if (step.step_template_id) {
    await loadStepTemplateDetails(step)
  }

  stepEditDialogVisible.value = true
}

// 加载步骤模板详情
const loadStepTemplateDetails = async (step: CreateStepReq) => {
  if (step.step_template_id) {
    try {
      const response = await listStepTemplatesByIDsApi({ ids: [step.step_template_id] })
      const newTemplates = response.data.templates || []
      const existingIds = stepTemplates.value.map((t) => t.id)
      const uniqueNewTemplates = newTemplates.filter((t) => !existingIds.includes(t.id))
      stepTemplates.value.push(...uniqueNewTemplates)
    } catch (error) {
      console.error("加载步骤模板详情失败:", error)
    }
  }
}

// 删除步骤
const removeStep = (index: number) => {
  modelValue.value.splice(index, 1)
  updateStepLevels()
}

// 保存步骤编辑
const saveStepEdit = async () => {
  try {
    // 验证表单
    if (stepFormRef.value) {
      await stepFormRef.value.validate()
    }

    if (currentStepIndex.value === -1) {
      // 新建步骤：添加到列表末尾
      modelValue.value.push({ ...currentStep.value })
    } else {
      // 编辑现有步骤：更新数据
      modelValue.value[currentStepIndex.value] = { ...currentStep.value }
    }

    // 重新计算级别
    updateStepLevels()

    // 关闭对话框
    stepEditDialogVisible.value = false
    currentStepIndex.value = -1
  } catch (error) {
    console.error("保存步骤失败:", error)
  }
}

// 关闭步骤编辑
const handleStepEditClosed = () => {
  stepEditDialogVisible.value = false
  currentStepIndex.value = -1
}

// 加载模板集数据
const loadTemplateSets = async () => {
  try {
    const response = await listTemplateSetsApi({
      offset: 0,
      limit: 1000
    })
    templateSets.value = response.data.template_sets || []
  } catch (error) {
    console.error("加载模板集失败:", error)
  }
}

// 加载步骤模板数据
const loadStepTemplates = async () => {
  try {
    const response = await listStepTemplatesApi({
      offset: 0,
      limit: 1000
    })
    stepTemplates.value = response.data.templates || []
  } catch (error) {
    console.error("加载步骤模板失败:", error)
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
    return `${delay}秒`
  } else if (delay < 3600) {
    return `${Math.floor(delay / 60)}分钟`
  } else {
    return `${Math.floor(delay / 3600)}小时`
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

// 监听步骤数据变化，动态加载模板数据
watch(
  () => modelValue.value,
  async (newSteps) => {
    if (newSteps && newSteps.length > 0) {
      // 收集所有需要加载的模板ID
      const templateIds = newSteps
        .map((step) => step.step_template_id)
        .filter((id): id is number => id !== undefined && id !== 0 && !stepTemplates.value.find((t) => t.id === id))

      if (templateIds.length > 0) {
        try {
          const response = await listStepTemplatesByIDsApi({ ids: templateIds })
          const newTemplates = response.data.templates || []
          stepTemplates.value.push(...newTemplates)
        } catch (error) {
          console.error("动态加载步骤模板失败:", error)
        }
      }
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时加载数据
onMounted(() => {
  loadTemplateSets()
  loadStepTemplates()
})
</script>

<style scoped lang="scss">
.form-section {
  margin-bottom: 32px;

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
  margin-top: 16px;

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
