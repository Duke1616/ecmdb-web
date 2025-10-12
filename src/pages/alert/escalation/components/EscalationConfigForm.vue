<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="120px">
    <!-- 基本信息 -->
    <div class="form-section">
      <h3 class="section-title">基本信息</h3>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="配置名称" prop="name">
            <el-input v-model="modelValue.name" placeholder="请输入配置名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="配置标识" prop="key">
            <el-input v-model="modelValue.key" placeholder="请输入配置标识" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="配置描述" prop="description">
        <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="超时时间（毫秒）" prop="timeout">
            <el-input-number v-model="modelValue.timeout" :min="1000" :max="3600000" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否启用" prop="enabled">
            <el-switch v-model="modelValue.enabled" />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 触发条件和触发逻辑 -->
    <div class="form-section">
      <el-row :gutter="24">
        <!-- 左侧：触发条件 -->
        <el-col :span="12">
          <div class="trigger-conditions">
            <h3 class="section-title">
              触发条件
              <el-button type="primary" :icon="Plus" size="small" @click="addTrigger">添加触发条件</el-button>
            </h3>
            <div v-if="modelValue.triggers.length === 0" class="empty-state">
              <el-empty description="暂无触发条件" />
            </div>
            <div v-else>
              <div v-for="(trigger, index) in modelValue.triggers" :key="index" class="trigger-item">
                <el-row :gutter="20" align="middle">
                  <el-col :span="6">
                    <el-form-item :label="`触发类型 ${index + 1}`" :prop="`triggers.${index}.type`">
                      <el-select
                        v-model="trigger.type"
                        placeholder="选择触发类型"
                        style="width: 100%"
                        @change="handleTriggerTypeChange(index, $event)"
                      >
                        <el-option label="时间触发" :value="ESCALATION_TRIGGER_TYPES.TIME" />
                        <el-option label="级别触发" :value="ESCALATION_TRIGGER_TYPES.LEVEL" />
                        <el-option label="无响应触发" :value="ESCALATION_TRIGGER_TYPES.NO_RESPONSE" />
                        <el-option label="手动触发" :value="ESCALATION_TRIGGER_TYPES.MANUAL" />
                        <el-option label="自定义触发" :value="ESCALATION_TRIGGER_TYPES.CUSTOM" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item :label="`描述 ${index + 1}`" :prop="`triggers.${index}.description`">
                      <el-input v-model="trigger.description" placeholder="触发条件描述" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="配置详情">
                      <el-button type="info" size="small" @click="editTriggerConfig(index)">配置详情</el-button>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-button type="danger" :icon="Delete" circle @click="removeTrigger(index)" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：触发逻辑 -->
        <el-col :span="12">
          <div class="trigger-logic">
            <h3 class="section-title">触发逻辑</h3>
            <el-form-item label="逻辑类型" prop="trigger_logic.type">
              <el-select v-model="modelValue.trigger_logic.type" style="width: 100%">
                <el-option label="任意条件满足" :value="ESCALATION_LOGIC_TYPES.ANY" />
                <el-option label="所有条件满足" :value="ESCALATION_LOGIC_TYPES.ALL" />
                <el-option label="第一个条件满足" :value="ESCALATION_LOGIC_TYPES.FIRST" />
                <el-option label="自定义逻辑" :value="ESCALATION_LOGIC_TYPES.CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item label="表达式" prop="trigger_logic.expression">
              <el-input v-model="modelValue.trigger_logic.expression" placeholder="逻辑表达式" />
            </el-form-item>
            <el-form-item label="逻辑描述" prop="trigger_logic.description">
              <el-input
                v-model="modelValue.trigger_logic.description"
                type="textarea"
                :rows="3"
                placeholder="逻辑描述"
              />
            </el-form-item>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 升级步骤 -->
    <div class="form-section">
      <div class="section-header">
        <h3 class="section-title">升级步骤</h3>
        <el-button type="primary" :icon="Plus" size="small" @click="addStep"> 添加步骤 </el-button>
      </div>

      <div v-if="modelValue.steps.length === 0" class="empty-steps">
        <el-empty description="暂无升级步骤，点击上方按钮添加" />
      </div>

      <div v-else class="steps-container">
        <VueDraggable
          v-model="modelValue.steps"
          :animation="200"
          ghost-class="step-ghost"
          chosen-class="step-chosen"
          drag-class="step-drag"
          @start="onDragStart"
          @end="onDragEnd"
          @change="onDragSort"
          class="steps-grid"
        >
          <div
            v-for="(step, index) in modelValue.steps"
            :key="`step-${step.level || index}`"
            class="step-card"
            :class="{ 'step-dragging': draggingIndex === index }"
          >
            <!-- 步骤头部 -->
            <div class="step-header">
              <div class="step-title">
                <span class="step-number">步骤 {{ index + 1 }}</span>
                <el-tag :type="getUrgencyTagType(step.urgency_level)" size="small" class="urgency-tag">
                  P{{ step.urgency_level }}
                </el-tag>
              </div>
              <div class="step-actions">
                <el-button type="primary" size="small" @click="editStep(index)">
                  <el-icon><Setting /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="removeStep(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 步骤内容 -->
            <div class="step-content">
              <!-- 步骤信息 -->
              <div class="step-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">模板集</span>
                    <span class="info-value">
                      {{ step.template_set_id ? getTemplateSetName(step.template_set_id) : "未设置" }}
                    </span>
                  </div>
                  <div class="info-item" v-if="step.step_template_id">
                    <span class="info-label">步骤模板</span>
                    <span class="info-value">{{ getStepTemplateName(step.step_template_id) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">延迟</span>
                    <span class="info-value">{{ formatDelay(step.delay) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">重试</span>
                    <span class="info-value">{{ step.max_retries }}次</span>
                  </div>
                </div>

                <!-- 条件表达式 -->
                <div v-if="step.condition_expr" class="step-condition">
                  <span class="condition-label">执行条件:</span>
                  <code class="condition-code">{{ step.condition_expr }}</code>
                </div>

                <!-- 模板详情 -->
                <div v-if="getStepTemplateContent(step.step_template_id)" class="template-details">
                  <div class="template-channels">
                    <span class="template-label">通知渠道:</span>
                    <div class="channels-list">
                      <el-tag
                        v-for="channel in getStepTemplateChannels(step.step_template_id)"
                        :key="channel"
                        size="small"
                        class="channel-tag"
                      >
                        {{ getChannelLabel(channel) }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="template-receivers">
                    <span class="template-label">接收者:</span>
                    <div class="receivers-list">
                      <el-tag
                        v-for="receiver in getStepTemplateReceivers(step.step_template_id)"
                        :key="receiver.id"
                        size="small"
                        class="receiver-tag"
                        :type="getReceiverTagType(receiver.type)"
                      >
                        <span class="receiver-type">{{ getReceiverTypeLabel(receiver.type) }}:</span>
                        <span class="receiver-name">{{ receiver.display_name }}</span>
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </VueDraggable>
      </div>
    </div>
  </el-form>

  <!-- 触发条件配置对话框 -->
  <FormDialog
    v-model="triggerConfigDialogVisible"
    title="触发条件配置"
    subtitle="配置触发条件的详细参数"
    width="600px"
    header-icon="Setting"
    confirm-text="保存配置"
    :confirm-loading="triggerConfigSaving"
    @confirm="saveTriggerConfig"
    @cancel="cancelTriggerConfig"
  >
    <TriggerConfigForm
      v-if="currentTriggerIndex !== -1"
      v-model="modelValue.triggers[currentTriggerIndex].config as any"
      :trigger-type="modelValue.triggers[currentTriggerIndex].type"
    />
  </FormDialog>

  <!-- 升级步骤编辑抽屉 -->
  <CustomDrawer
    v-model="stepEditDialogVisible"
    title="编辑升级步骤"
    :subtitle="`升级步骤 ${currentStepIndex + 1}`"
    size="50%"
    direction="rtl"
    :show-footer="true"
    :header-icon="Setting"
    @closed="handleStepEditClosed"
    @confirm="saveStepEdit"
  >
    <EscalationStepForm v-if="currentStepIndex !== -1" v-model="currentStep" ref="stepFormRef" />
  </CustomDrawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Plus, Delete, Setting } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { CreateConfigReq } from "@/api/alert/escalation/types"
import { ESCALATION_LOGIC_TYPES, ESCALATION_TRIGGER_TYPES } from "@/api/alert/escalation/types"
import TriggerConfigForm from "./TriggerConfigForm.vue"
import EscalationStepForm from "./EscalationStepForm.vue"
import { VueDraggable } from "vue-draggable-plus"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { listTemplateSetsApi } from "@/api/alert/template_set"
import { listStepTemplatesApi, listStepTemplatesByIDsApi } from "@/api/alert/escalation"
import { escalationConfigFormRules, validateEscalationConfig } from "../config/validation"
import type { TemplateSet } from "@/api/alert/template_set/types"
import type { StepTemplateVO } from "@/api/alert/escalation/types"

const modelValue = defineModel<CreateConfigReq>({ required: true })

const formRef = ref<FormInstance>()
const stepFormRef = ref<InstanceType<typeof EscalationStepForm>>()
const triggerConfigDialogVisible = ref(false)
const currentTriggerIndex = ref(-1)
const triggerConfigSaving = ref(false)

// 步骤编辑相关状态
const stepEditDialogVisible = ref(false)
const currentStepIndex = ref(-1)
const currentStep = ref({
  level: 1,
  template_set_id: 0,
  step_template_id: 0,
  delay: 0,
  max_retries: 3,
  retry_interval: 60000,
  skip_if_handled: false,
  continue_on_fail: false,
  condition_expr: "",
  urgency_level: 1
})

// 拖拽相关状态
const draggingIndex = ref(-1)

// 模板集和步骤模板数据
const templateSets = ref<TemplateSet[]>([])
const stepTemplates = ref<StepTemplateVO[]>([])

// 表单验证规则
// 使用导入的验证规则
const formRules = escalationConfigFormRules

// 表单验证方法
const validateForm = async (): Promise<boolean> => {
  try {
    // 先进行 Element Plus 表单验证
    await formRef.value?.validate()

    // 再进行自定义业务逻辑验证
    const errors = validateEscalationConfig(modelValue.value)
    if (errors.length > 0) {
      ElMessage.error(`表单验证失败：${errors.join("; ")}`)
      return false
    }

    return true
  } catch (error) {
    ElMessage.error("表单验证失败，请检查必填项")
    return false
  }
}

// 暴露验证方法给父组件
defineExpose({
  validateForm
})

// 添加触发条件
const addTrigger = () => {
  modelValue.value.triggers.push({
    type: ESCALATION_TRIGGER_TYPES.TIME,
    config: {
      time_config: {
        duration: 5,
        unit: "minutes"
      }
    },
    description: ""
  })
}

// 移除触发条件
const removeTrigger = (index: number) => {
  modelValue.value.triggers.splice(index, 1)
}

// 处理触发类型变化
const handleTriggerTypeChange = (index: number, newType: string) => {
  const trigger = modelValue.value.triggers[index]

  // 根据新类型重新创建配置
  switch (newType) {
    case ESCALATION_TRIGGER_TYPES.TIME:
      trigger.config = {
        time_config: {
          duration: 5,
          unit: "minutes"
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.LEVEL:
      trigger.config = {
        level_config: {
          target_alert_levels: [],
          min_alert_level: "P3"
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.NO_RESPONSE:
      trigger.config = {
        no_response_config: {
          check_interval: 30000,
          max_attempts: 3,
          required_acks: 1
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.MANUAL:
      trigger.config = {
        manual_config: {
          allowed_users: [],
          require_auth: true
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.CUSTOM:
      trigger.config = {
        custom_config: {
          expression: "",
          variables: {}
        }
      }
      break
  }
}

// 编辑触发条件配置
const editTriggerConfig = (index: number) => {
  currentTriggerIndex.value = index
  triggerConfigDialogVisible.value = true
}

// 保存触发条件配置
const saveTriggerConfig = async () => {
  triggerConfigSaving.value = true
  try {
    // 这里可以添加验证逻辑
    // 由于使用了 defineModel，配置会自动同步
    triggerConfigDialogVisible.value = false
    currentTriggerIndex.value = -1
  } finally {
    triggerConfigSaving.value = false
  }
}

// 取消触发条件配置
const cancelTriggerConfig = () => {
  triggerConfigDialogVisible.value = false
  currentTriggerIndex.value = -1
}

// 添加升级步骤
const addStep = () => {
  const newStep = {
    level: modelValue.value.steps.length + 1, // 保持 level 字段用于后端，但不在 UI 中显示
    template_set_id: 0,
    step_template_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 60000, // 1分钟
    skip_if_handled: false,
    continue_on_fail: false,
    condition_expr: "",
    urgency_level: 1
  }

  // 直接添加到末尾，让网格自动排列
  modelValue.value.steps.push(newStep)
}

// 移除升级步骤
const removeStep = (index: number) => {
  modelValue.value.steps.splice(index, 1)
  // 重新调整级别
  updateStepLevels()
}

// 更新步骤级别
const updateStepLevels = () => {
  modelValue.value.steps.forEach((step, idx) => {
    step.level = idx + 1
  })
}

// 拖拽开始
const onDragStart = (event: any) => {
  draggingIndex.value = event.oldIndex
}

// 拖拽结束
const onDragEnd = () => {
  draggingIndex.value = -1
  updateStepLevels()
}

// 拖拽排序
const onDragSort = () => {
  updateStepLevels()
}

// 编辑步骤
const editStep = async (index: number) => {
  currentStepIndex.value = index
  const step = modelValue.value.steps[index]
  currentStep.value = {
    level: step.level,
    template_set_id: step.template_set_id,
    step_template_id: step.step_template_id,
    delay: step.delay,
    max_retries: step.max_retries,
    retry_interval: step.retry_interval,
    skip_if_handled: step.skip_if_handled,
    continue_on_fail: step.continue_on_fail,
    condition_expr: step.condition_expr,
    urgency_level: step.urgency_level
  }

  // 先打开抽屉
  stepEditDialogVisible.value = true

  // 如果当前步骤有步骤模板ID，则加载对应的模板数据
  if (step.step_template_id) {
    // 使用新的接口加载特定的模板数据
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

// 保存步骤编辑
const saveStepEdit = async () => {
  if (!stepFormRef.value) return

  try {
    await stepFormRef.value.validate()
    if (currentStepIndex.value !== -1) {
      modelValue.value.steps[currentStepIndex.value] = { ...currentStep.value }
    }
    stepEditDialogVisible.value = false
    currentStepIndex.value = -1
  } catch (error) {
    console.error("表单验证失败:", error)
  }
}

// 处理步骤编辑抽屉关闭
const handleStepEditClosed = () => {
  currentStepIndex.value = -1
}

// 获取紧急程度标签类型
const getUrgencyTagType = (level: number) => {
  if (level >= 4) return "danger"
  if (level >= 3) return "warning"
  if (level >= 2) return "info"
  return "success"
}

// 格式化延迟时间
const formatDelay = (delay: number) => {
  if (delay === 0) return "无延迟"
  if (delay < 1000) return `${delay}ms`
  if (delay < 60000) return `${Math.round(delay / 1000)}s`
  if (delay < 3600000) return `${Math.round(delay / 60000)}min`
  return `${Math.round(delay / 3600000)}h`
}

// 加载模板集数据
const loadTemplateSets = async () => {
  try {
    const response = await listTemplateSetsApi({
      offset: 0,
      limit: 1000 // 获取所有模板集
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
      limit: 1000 // 获取所有步骤模板
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
  const template = getStepTemplateContent(id)
  return template ? template.channels : []
}

// 获取步骤模板的接收者
const getStepTemplateReceivers = (id?: number) => {
  const template = getStepTemplateContent(id)
  return template ? template.receivers : []
}

// 获取渠道标签
const getChannelLabel = (channel: string) => {
  const channelMap: Record<string, string> = {
    EMAIL: "邮件",
    WECHAT: "企业微信",
    FEISHU_CARD: "飞书卡片"
  }
  return channelMap[channel] || channel
}

// 获取接收者类型标签
const getReceiverTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    user: "用户",
    team: "团队",
    department: "部门",
    oncall: "值班"
  }
  return typeMap[type] || type
}

// 获取接收者标签类型（用于Element Plus的tag组件）
const getReceiverTagType = (type: string): "primary" | "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "danger" | "info"> = {
    user: "primary",
    team: "success",
    department: "warning",
    oncall: "danger"
  }
  return typeMap[type] || "info"
}

// 组件挂载时加载数据
onMounted(() => {
  loadTemplateSets()
  loadStepTemplates()
})
</script>

<style scoped lang="scss">
.form-section {
  margin-bottom: 32px;

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 8px;
  }
}

.trigger-item,
.step-item {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;

  &:hover {
    border-color: #409eff;
  }
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.trigger-conditions,
.trigger-logic {
  height: 100%;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;

  .section-title {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 8px;
  }
}

.trigger-conditions {
  .trigger-item {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #ffffff;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.empty-steps {
  text-align: center;
  padding: 3rem 0;
  color: #909399;
}

.steps-container {
  width: 100%;
}

.steps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.step-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  min-height: 200px;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
    transform: translateY(-2px);
  }

  &.step-dragging {
    opacity: 0.6;
    transform: rotate(2deg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .step-title {
      display: flex;
      align-items: center;
      gap: 8px;

      .step-number {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .urgency-tag {
        font-weight: 500;
      }
    }

    .step-actions {
      display: flex;
      gap: 6px;
    }
  }

  .step-content {
    flex: 1;
    min-width: 0;

    .step-info {
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .info-label {
            font-size: 11px;
            color: #909399;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 13px;
            color: #606266;
            font-weight: 500;
          }
        }
      }

      .step-condition {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: #f0f9ff;
        border: 1px solid #b3d8ff;
        border-radius: 4px;
        margin-bottom: 8px;

        .condition-label {
          font-size: 10px;
          color: #409eff;
          font-weight: 500;
        }

        .condition-code {
          font-size: 10px;
          color: #409eff;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          background: none;
          padding: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .template-details {
        padding: 8px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;

        .template-channels {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;

          .template-label {
            font-size: 10px;
            color: #6c757d;
            font-weight: 500;
            min-width: 60px;
          }

          .channels-list {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;

            .channel-tag {
              font-size: 10px;
              padding: 2px 6px;
            }
          }
        }

        .template-receivers {
          display: flex;
          align-items: flex-start;
          gap: 6px;

          .template-label {
            font-size: 10px;
            color: #6c757d;
            font-weight: 500;
            min-width: 60px;
            margin-top: 2px;
          }

          .receivers-list {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;

            .receiver-tag {
              font-size: 10px;
              padding: 2px 6px;
              display: flex;
              align-items: center;
              gap: 4px;

              .receiver-type {
                font-weight: 500;
                opacity: 0.8;
              }

              .receiver-name {
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }
}

// 拖拽状态样式
.step-ghost {
  opacity: 0.5;
  background: #f0f9ff;
  border: 2px dashed #409eff;
}

.step-chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.step-drag {
  transform: rotate(5deg);
  opacity: 0.8;
}
</style>
