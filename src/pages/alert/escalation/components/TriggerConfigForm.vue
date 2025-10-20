<template>
  <div class="trigger-config-form">
    <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top">
      <!-- 时间触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.TIME" class="config-section">
        <el-form-item label="延迟时间" label-position="top" prop="delay">
          <el-input-number v-model="timeConfig.delay" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时间单位" label-position="top" prop="unit">
          <el-select v-model="timeConfig.unit" style="width: 100%">
            <el-option label="分钟" :value="TimeUnit.MINUTES" />
            <el-option label="小时" :value="TimeUnit.HOURS" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 级别触发配置 -->
      <div v-if="props.triggerType === ESCALATION_TRIGGER_TYPES.LEVEL" class="config-section">
        <el-form-item label="匹配模式" label-position="top" prop="match_mode">
          <el-select v-model="levelConfig.match_mode" style="width: 100%">
            <el-option label="精确匹配" :value="LevelMatchMode.EXACT" />
            <el-option label="范围匹配" :value="LevelMatchMode.RANGE" />
            <el-option label="双重匹配" :value="LevelMatchMode.BOTH" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标告警级别" label-position="top" prop="target_alert_levels">
          <el-select v-model="levelConfig.target_alert_levels" multiple style="width: 100%">
            <el-option label="紧急" :value="Level.EMERGENCY" />
            <el-option label="严重" :value="Level.CRITICAL" />
            <el-option label="错误" :value="Level.ERROR" />
            <el-option label="警告" :value="Level.WARNING" />
            <el-option label="提示" :value="Level.INFO" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低告警级别" label-position="top" prop="min_alert_level">
          <el-select v-model="levelConfig.min_alert_level" style="width: 100%">
            <el-option label="紧急" :value="Level.EMERGENCY" />
            <el-option label="严重" :value="Level.CRITICAL" />
            <el-option label="错误" :value="Level.ERROR" />
            <el-option label="警告" :value="Level.WARNING" />
            <el-option label="提示" :value="Level.INFO" />
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
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import type { FormInstance } from "element-plus"
import type {
  EscalationTriggerType,
  EscalationTriggerConfig,
  TimeTriggerConfig,
  LevelTriggerConfig,
  NoResponseTriggerConfig
} from "@/api/alert/escalation/types"
import { ESCALATION_TRIGGER_TYPES, TimeUnit, Level, LevelMatchMode } from "@/api/alert/escalation/types"
import { getTriggerConfigRules } from "../config/validation"

interface Props {
  triggerType: EscalationTriggerType
}

const modelValue = defineModel<EscalationTriggerConfig>({ required: true })
const props = defineProps<Props>()

// 表单引用
const formRef = ref<FormInstance>()

// 根据触发类型获取验证规则
const formRules = computed(() => getTriggerConfigRules(props.triggerType))

// 类型守卫函数
const isTimeConfig = (config: EscalationTriggerConfig): config is { time_config: TimeTriggerConfig } => {
  return "time_config" in config && config.time_config !== undefined
}

const isLevelConfig = (config: EscalationTriggerConfig): config is { level_config: LevelTriggerConfig } => {
  return "level_config" in config && config.level_config !== undefined
}

const isNoResponseConfig = (
  config: EscalationTriggerConfig
): config is { no_response_config: NoResponseTriggerConfig } => {
  return "no_response_config" in config && config.no_response_config !== undefined
}

// 类型安全的配置访问 - 使用计算属性，提供默认值避免 null
const timeConfig = computed({
  get: () => (isTimeConfig(modelValue.value) ? modelValue.value.time_config : { delay: 5, unit: TimeUnit.MINUTES }),
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
      : { target_alert_levels: [], min_alert_level: Level.ERROR, match_mode: LevelMatchMode.EXACT },
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
