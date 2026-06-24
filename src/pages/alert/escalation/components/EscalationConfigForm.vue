<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="120px">
    <!-- 基本信息 -->
    <div class="form-section">
      <h3 class="section-title">基本信息</h3>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="配置名称" prop="name">
            <el-input v-model="modelValue.name" placeholder="请输入配置名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="配置描述" prop="description">
        <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
      </el-form-item>
    </div>

    <!-- 升级时机和组合方式 -->
    <div class="form-section">
      <el-row :gutter="24">
        <!-- 左侧：升级时机 -->
        <el-col :span="12">
          <div class="trigger-conditions">
            <h3 class="section-title">
              升级时机
              <el-button type="primary" :icon="Plus" size="small" @click="addTrigger">添加时机</el-button>
            </h3>
            <p class="section-desc">聚合路由命中告警后，满足这里的时机才会创建或推进升级。</p>
            <div v-if="modelValue.triggers.length === 0" class="empty-state">
              <el-empty description="暂无升级时机" />
            </div>
            <div v-else>
              <div v-for="(trigger, index) in modelValue.triggers" :key="index" class="trigger-item">
                <el-row :gutter="20" align="middle">
                  <el-col :span="5">
                    <el-form-item :label="`时机类型 ${index + 1}`" :prop="`triggers.${index}.type`">
                      <el-select
                        v-model="trigger.type"
                        placeholder="选择时机类型"
                        style="width: 100%"
                        @change="handleTriggerTypeChange(index, $event)"
                      >
                        <el-option label="持续时间达到" :value="ESCALATION_TRIGGER_TYPES.TIME" />
                        <el-option label="告警级别达到" :value="ESCALATION_TRIGGER_TYPES.LEVEL" />
                        <el-option label="连续评估次数达到" :value="ESCALATION_TRIGGER_TYPES.EVAL_COUNT" />
                        <el-option label="聚合告警数量达到" :value="ESCALATION_TRIGGER_TYPES.ALERT_COUNT" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="`描述 ${index + 1}`" :prop="`triggers.${index}.description`">
                      <el-input v-model="trigger.description" placeholder="描述这个升级时机" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="配置详情">
                      <el-button type="info" size="small" @click="editTriggerConfig(index)">配置详情</el-button>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3" style="text-align: center">
                    <el-button type="danger" :icon="Delete" circle @click="removeTrigger(index)" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：组合方式 -->
        <el-col :span="12">
          <div class="trigger-logic">
            <h3 class="section-title">组合方式</h3>
            <p class="section-desc">多个升级时机之间如何组合判断。</p>
            <el-form-item label="组合类型" prop="trigger_logic.type">
              <el-select v-model="modelValue.trigger_logic.type" style="width: 100%">
                <el-option label="任一时机满足" :value="ESCALATION_LOGIC_TYPES.ANY" />
                <el-option label="所有时机满足" :value="ESCALATION_LOGIC_TYPES.ALL" />
                <el-option label="第一个时机满足" :value="ESCALATION_LOGIC_TYPES.FIRST" />
                <el-option label="自定义逻辑" :value="ESCALATION_LOGIC_TYPES.CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="modelValue.trigger_logic.type === ESCALATION_LOGIC_TYPES.CUSTOM"
              label="表达式"
              prop="trigger_logic.expression"
            >
              <el-input v-model="modelValue.trigger_logic.expression" placeholder="逻辑表达式" />
            </el-form-item>
            <el-form-item label="组合描述" prop="trigger_logic.description">
              <el-input
                v-model="modelValue.trigger_logic.description"
                type="textarea"
                :rows="3"
                placeholder="描述这些升级时机的组合方式"
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
      <EscalationStepsTable
        v-model="modelValue.steps"
        @add-step="handleAddStep"
        @edit-step="handleEditStep"
        @delete-step="handleDeleteStep"
        @row-drag="handleStepRowDrag"
      />
    </div>
  </el-form>

  <!-- 升级时机配置对话框 -->
  <FormDialog
    v-model="triggerConfigDialogVisible"
    title="升级时机配置"
    subtitle="配置命中聚合路由后的升级触发时机"
    width="600px"
    header-icon="Setting"
    confirm-text="保存配置"
    :confirm-loading="triggerConfigSaving"
    @confirm="saveTriggerConfig"
    @cancel="cancelTriggerConfig"
  >
    <TriggerConfigForm
      v-if="currentTriggerIndex !== -1"
      v-model="modelValue.triggers[currentTriggerIndex].config"
      :trigger-type="modelValue.triggers[currentTriggerIndex].type"
    />
  </FormDialog>

  <!-- 升级步骤编辑抽屉 -->
  <CustomDrawer
    v-model="stepEditDialogVisible"
    :title="currentStepIndex === -1 ? '添加升级步骤' : '编辑升级步骤'"
    :subtitle="currentStepIndex === -1 ? '添加新的升级步骤' : `升级步骤 ${currentStepIndex + 1}`"
    size="35%"
    direction="rtl"
    :show-footer="true"
    :header-icon="Setting"
    @closed="handleStepEditClosed"
    @confirm="saveStepEdit"
  >
    <EscalationStepForm v-if="stepEditDialogVisible" v-model="currentStep" ref="stepFormRef" />
  </CustomDrawer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElMessage } from "element-plus"
import { Plus, Delete, Setting } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type { CreateConfigReq, CreateStepReq, EscalationStep } from "@/api/alert/escalation/types"
import { cloneDeep } from "lodash-es"
import { clearZeroValues } from "@@/utils"
import {
  ESCALATION_LOGIC_TYPES,
  ESCALATION_TRIGGER_TYPES,
  type EscalationTriggerType,
  TimeUnit,
  Level,
  LevelMatchMode
} from "@/api/alert/escalation/types"
import TriggerConfigForm from "./TriggerConfigForm.vue"
import EscalationStepForm from "./EscalationStepForm.vue"
import EscalationStepsTable from "./EscalationStepsTable.vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { escalationConfigFormRules, validateEscalationConfig } from "../config/validation"

const modelValue = defineModel<CreateConfigReq>({ required: true })

const formRef = ref<FormInstance>()
const stepFormRef = ref<InstanceType<typeof EscalationStepForm>>()
const triggerConfigDialogVisible = ref(false)

const currentTriggerIndex = ref(-1)
const triggerConfigSaving = ref(false)

// 步骤编辑相关状态
const stepEditDialogVisible = ref(false)
const currentStepIndex = ref(-1)
const currentStep = ref<CreateStepReq>({
  level: 1,
  template_set_id: 0,
  step_template_id: 0,
  delay: 30,
  max_retries: 3,
  retry_interval: 60,
  skip_if_handled: false,
  continue_on_fail: false,
  condition_expr: "",
  urgency_level: 1,
  config_id: 0
})

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
  const newTrigger = {
    type: ESCALATION_TRIGGER_TYPES.TIME,
    config: {
      time_config: {
        delay: 5,
        unit: TimeUnit.MINUTES
      }
    },
    description: ""
  }
  modelValue.value.triggers.push(cloneDeep(newTrigger))
}

// 移除触发条件
const removeTrigger = (index: number) => {
  modelValue.value.triggers.splice(index, 1)
}

// 处理触发类型变化
const handleTriggerTypeChange = (index: number, newType: EscalationTriggerType) => {
  const trigger = cloneDeep(modelValue.value.triggers[index])
  trigger.type = newType

  // 根据新类型重新创建配置
  switch (newType) {
    case ESCALATION_TRIGGER_TYPES.TIME:
      trigger.config = {
        time_config: {
          delay: 5,
          unit: TimeUnit.MINUTES
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.LEVEL:
      trigger.config = {
        level_config: {
          target_alert_levels: [],
          min_alert_level: Level.ERROR,
          match_mode: LevelMatchMode.EXACT
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
    case ESCALATION_TRIGGER_TYPES.EVAL_COUNT:
      trigger.config = {
        eval_count_config: {
          count: 3
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.ALERT_COUNT:
      trigger.config = {
        alert_count_config: {
          count: 5
        }
      }
      break
  }

  modelValue.value.triggers[index] = trigger
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

// 保存步骤编辑
const saveStepEdit = async () => {
  if (!stepFormRef.value) return

  try {
    await stepFormRef.value.validate()

    // 确保所有字段都有正确的类型
    const stepData = {
      ...currentStep.value,
      template_set_id: currentStep.value.template_set_id || 0,
      step_template_id: currentStep.value.step_template_id || 0
    }

    if (currentStepIndex.value !== -1) {
      // 编辑现有步骤
      modelValue.value.steps[currentStepIndex.value] = stepData
    } else {
      // 添加新步骤
      modelValue.value.steps.push(stepData)
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

// 添加步骤
const addStep = () => {
  // 创建新步骤但不立即添加到列表中
  const newStepData: CreateStepReq = {
    level: modelValue.value.steps.length + 1,
    template_set_id: 0,
    step_template_id: 0,
    delay: 30,
    max_retries: 3,
    retry_interval: 60,
    skip_if_handled: false,
    continue_on_fail: false,
    condition_expr: "",
    urgency_level: 1,
    config_id: 0
  }

  // 清空零值并设置当前步骤为新建的步骤
  currentStep.value = clearZeroValues(newStepData) as CreateStepReq
  currentStepIndex.value = -1 // 使用 -1 表示这是新建步骤

  // 直接打开编辑抽屉
  stepEditDialogVisible.value = true
}

// 处理添加步骤回调
const handleAddStep = () => {
  addStep()
}

// 处理编辑步骤回调
const handleEditStep = (index: number, step: CreateStepReq) => {
  currentStepIndex.value = index
  currentStep.value = cloneDeep(step)
  stepEditDialogVisible.value = true
}

// 处理删除步骤回调
const handleDeleteStep = (index: number, _step: CreateStepReq) => {
  modelValue.value.steps.splice(index, 1)
  // 重新计算级别
  modelValue.value.steps.forEach((s, i) => {
    s.level = i + 1
  })
}

// 处理步骤拖拽回调
const handleStepRowDrag = (newSteps: EscalationStep[]) => {
  // 确保所有字段都有正确的类型
  const stepsWithCorrectTypes = newSteps.map((step) => ({
    ...step,
    template_set_id: step.template_set_id || 0,
    step_template_id: step.step_template_id || 0
  }))
  modelValue.value.steps = stepsWithCorrectTypes
  // 重新计算级别
  modelValue.value.steps.forEach((s, i) => {
    s.level = i + 1
  })
}
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
</style>
