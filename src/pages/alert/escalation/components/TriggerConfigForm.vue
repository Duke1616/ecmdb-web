<template>
  <div class="trigger-config-form">
    <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top">
      <!-- 时间触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.TIME" class="config-section">
        <el-form-item label="延迟时间" label-position="top" prop="duration">
          <el-input-number v-model="timeConfig.duration" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时间单位" label-position="top" prop="unit">
          <el-select v-model="timeConfig.unit" style="width: 100%">
            <el-option label="分钟" value="minutes" />
            <el-option label="小时" value="hours" />
            <el-option label="天" value="days" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 级别触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.LEVEL" class="config-section">
        <el-form-item label="目标告警等级" label-position="top" prop="target_alert_levels">
          <el-select v-model="levelConfig.target_alert_levels" multiple style="width: 100%">
            <el-option label="P1 - 紧急" value="P1" />
            <el-option label="P2 - 高" value="P2" />
            <el-option label="P3 - 中" value="P3" />
            <el-option label="P4 - 低" value="P4" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低告警等级" label-position="top" prop="min_alert_level">
          <el-select v-model="levelConfig.min_alert_level" style="width: 100%">
            <el-option label="P1 - 紧急" value="P1" />
            <el-option label="P2 - 高" value="P2" />
            <el-option label="P3 - 中" value="P3" />
            <el-option label="P4 - 低" value="P4" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 无响应触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.NO_RESPONSE" class="config-section">
        <el-form-item label="检查间隔（毫秒）" label-position="top">
          <el-input-number v-model="noResponseConfig.check_interval" :min="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大尝试次数" label-position="top">
          <el-input-number v-model="noResponseConfig.max_attempts" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="需要的确认数" label-position="top">
          <el-input-number v-model="noResponseConfig.required_acks" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
      </div>

      <!-- 手动触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.MANUAL" class="config-section">
        <el-form-item label="允许触发的用户" label-position="top">
          <el-select v-model="manualConfig.allowed_users" multiple filterable allow-create style="width: 100%">
            <el-option label="admin" value="admin" />
            <el-option label="operator" value="operator" />
            <el-option label="manager" value="manager" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否需要认证" label-position="top">
          <el-switch v-model="manualConfig.require_auth" />
        </el-form-item>
      </div>

      <!-- 自定义触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.CUSTOM" class="config-section">
        <el-form-item label="自定义表达式" label-position="top">
          <el-input v-model="customConfig.expression" type="textarea" :rows="4" placeholder="输入自定义表达式" />
        </el-form-item>
        <el-form-item label="变量定义" label-position="top">
          <div class="variables-section">
            <div v-for="(value, key, index) in customConfig.variables" :key="index" class="variable-item">
              <el-row :gutter="10" align="middle">
                <el-col :span="10">
                  <el-input v-model="variableKeys[index]" placeholder="变量名" />
                </el-col>
                <el-col :span="10">
                  <el-input v-model="variableValues[index]" placeholder="变量值" />
                </el-col>
                <el-col :span="4">
                  <el-button type="danger" :icon="Delete" circle @click="removeVariable(index)" />
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" :icon="Plus" @click="addVariable">添加变量</el-button>
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import type {
  EscalationTriggerType,
  AnyEscalationTriggerConfig,
  TimeTriggerConfig,
  LevelTriggerConfig,
  NoResponseTriggerConfig,
  ManualTriggerConfig,
  CustomTriggerConfig
} from "@/api/alert/escalation/types"
import { ESCALATION_TRIGGER_TYPES } from "@/api/alert/escalation/types"
import { getTriggerConfigRules } from "../config/validation"

interface Props {
  triggerType: EscalationTriggerType
}

const modelValue = defineModel<AnyEscalationTriggerConfig>({ required: true })
const props = defineProps<Props>()

// 表单引用
const formRef = ref<FormInstance>()

// 根据触发类型获取验证规则
const formRules = computed(() => getTriggerConfigRules(props.triggerType))

// 类型守卫函数
const isTimeConfig = (config: AnyEscalationTriggerConfig): config is { time_config: TimeTriggerConfig } => {
  return "time_config" in config
}

const isLevelConfig = (config: AnyEscalationTriggerConfig): config is { level_config: LevelTriggerConfig } => {
  return "level_config" in config
}

const isNoResponseConfig = (
  config: AnyEscalationTriggerConfig
): config is { no_response_config: NoResponseTriggerConfig } => {
  return "no_response_config" in config
}

const isManualConfig = (config: AnyEscalationTriggerConfig): config is { manual_config: ManualTriggerConfig } => {
  return "manual_config" in config
}

const isCustomConfig = (config: AnyEscalationTriggerConfig): config is { custom_config: CustomTriggerConfig } => {
  return "custom_config" in config
}

// 类型安全的配置访问 - 使用计算属性，提供默认值避免 null
const timeConfig = computed({
  get: () => (isTimeConfig(modelValue.value) ? modelValue.value.time_config : { duration: 5, unit: "minutes" }),
  set: (value: TimeTriggerConfig) => {
    if (isTimeConfig(modelValue.value)) {
      modelValue.value.time_config = value
    }
  }
})

const levelConfig = computed({
  get: () =>
    isLevelConfig(modelValue.value)
      ? modelValue.value.level_config
      : { target_alert_levels: [], min_alert_level: "P3" },
  set: (value: LevelTriggerConfig) => {
    if (isLevelConfig(modelValue.value)) {
      modelValue.value.level_config = value
    }
  }
})

const noResponseConfig = computed({
  get: () =>
    isNoResponseConfig(modelValue.value)
      ? modelValue.value.no_response_config
      : { check_interval: 30000, max_attempts: 3, required_acks: 1 },
  set: (value: NoResponseTriggerConfig) => {
    if (isNoResponseConfig(modelValue.value)) {
      modelValue.value.no_response_config = value
    }
  }
})

const manualConfig = computed({
  get: () =>
    isManualConfig(modelValue.value) ? modelValue.value.manual_config : { allowed_users: [], require_auth: true },
  set: (value: ManualTriggerConfig) => {
    if (isManualConfig(modelValue.value)) {
      modelValue.value.manual_config = value
    }
  }
})

const customConfig = computed({
  get: () => (isCustomConfig(modelValue.value) ? modelValue.value.custom_config : { expression: "", variables: {} }),
  set: (value: CustomTriggerConfig) => {
    if (isCustomConfig(modelValue.value)) {
      modelValue.value.custom_config = value
    }
  }
})

// 变量管理
const variableKeys = ref<string[]>([])
const variableValues = ref<string[]>([])

// 初始化变量
const initVariables = () => {
  const variables = customConfig.value?.variables || {}
  variableKeys.value = Object.keys(variables)
  variableValues.value = Object.values(variables)
}

// 监听触发类型变化，处理自定义配置的变量初始化
watch(
  () => props.triggerType,
  () => {
    if (props.triggerType === ESCALATION_TRIGGER_TYPES.CUSTOM) {
      initVariables()
    }
  },
  { immediate: true }
)

// 监听变量变化，更新 modelValue
watch(
  [variableKeys, variableValues],
  () => {
    const variables: Record<string, string> = {}
    variableKeys.value.forEach((key, index) => {
      if (key && variableValues.value[index]) {
        variables[key] = variableValues.value[index]
      }
    })

    if (customConfig.value) {
      customConfig.value.variables = variables
    }
  },
  { deep: true }
)

// 添加变量
const addVariable = () => {
  variableKeys.value.push("")
  variableValues.value.push("")
}

// 移除变量
const removeVariable = (index: number) => {
  variableKeys.value.splice(index, 1)
  variableValues.value.splice(index, 1)
}

// 初始化
initVariables()
</script>

<style scoped lang="scss">
.trigger-config-form {
  .config-section {
    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }

  .variables-section {
    .variable-item {
      margin-bottom: 12px;
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      background-color: #fafafa;
    }
  }
}
</style>
