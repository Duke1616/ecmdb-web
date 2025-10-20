<template>
  <div class="config-form-container">
    <el-form
      ref="formRef"
      :model="modelValue"
      :rules="formRules"
      class="config-form"
      label-position="top"
      label-width="120px"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="modelValue.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置描述" prop="description">
          <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
        </el-form-item>
      </div>

      <!-- 触发条件 -->
      <div class="form-section">
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
                <el-col :span="5">
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
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item :label="`描述 ${index + 1}`" :prop="`triggers.${index}.description`">
                    <el-input v-model="trigger.description" placeholder="触发条件描述" />
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

        <!-- 触发逻辑 -->
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
          <el-form-item
            v-if="modelValue.trigger_logic.type === ESCALATION_LOGIC_TYPES.CUSTOM"
            label="表达式"
            prop="trigger_logic.expression"
          >
            <el-input v-model="modelValue.trigger_logic.expression" placeholder="逻辑表达式" />
          </el-form-item>
          <el-form-item label="逻辑描述" prop="trigger_logic.description">
            <el-input v-model="modelValue.trigger_logic.description" type="textarea" :rows="3" placeholder="逻辑描述" />
          </el-form-item>
        </div>
      </div>
    </el-form>

    <!-- 触发条件配置对话框 -->
    <FormDialog
      v-model="triggerConfigDialogVisible"
      title="触发条件配置"
      width="600px"
      :loading="triggerConfigSaving"
      @confirm="saveTriggerConfig"
      @cancel="cancelTriggerConfig"
    >
      <TriggerConfigForm
        v-if="currentTriggerIndex >= 0"
        v-model="modelValue.triggers[currentTriggerIndex].config"
        :trigger-type="modelValue.triggers[currentTriggerIndex].type"
      />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import TriggerConfigForm from "./TriggerConfigForm.vue"
import {
  type CreateConfigReq,
  ESCALATION_TRIGGER_TYPES,
  ESCALATION_LOGIC_TYPES,
  type EscalationTrigger,
  type EscalationTriggerType,
  DEFAULT_TRIGGER_TYPE,
  TimeUnit,
  Level,
  LevelMatchMode
} from "@/api/alert/escalation/types"
import { escalationConfigFormRules } from "../config/validation"

// 双向绑定
const modelValue = defineModel<CreateConfigReq>({ required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules = computed(() => escalationConfigFormRules)

// 触发条件配置对话框
const triggerConfigDialogVisible = ref(false)
const triggerConfigSaving = ref(false)
const currentTriggerIndex = ref(-1)

// 添加触发条件
const addTrigger = () => {
  const newTrigger: EscalationTrigger = {
    type: DEFAULT_TRIGGER_TYPE,
    config: {
      time_config: {
        delay: 5,
        unit: TimeUnit.MINUTES
      }
    },
    description: ""
  }
  modelValue.value.triggers.push(newTrigger)
}

// 删除触发条件
const removeTrigger = (index: number) => {
  modelValue.value.triggers.splice(index, 1)
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

// 处理触发类型变化
const handleTriggerTypeChange = (index: number, newType: EscalationTriggerType) => {
  const trigger = modelValue.value.triggers[index]
  trigger.type = newType

  // 根据新的触发类型初始化配置
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
  }
}

// 暴露验证方法
const validateForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

defineExpose({
  validateForm
})
</script>

<style scoped lang="scss">
.config-form-container {
  padding: 20px;
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
}

.config-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    :deep(.el-textarea__inner) {
      border-radius: 6px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
  }

  .trigger-conditions,
  .trigger-logic {
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .trigger-item {
    margin-bottom: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .empty-state {
    padding: 40px 0;
    text-align: center;
  }
}
</style>
