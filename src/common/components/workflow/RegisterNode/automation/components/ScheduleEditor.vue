<template>
  <div class="schedule-editor">
    <div v-if="enabled" class="schedule-config">
      <div class="template-priority">
        <div class="template-priority__icon">
          <el-icon><Connection /></el-icon>
        </div>
        <div>
          <strong>模板配置优先</strong>
          <span>模板可覆盖为表单延迟或指定时间；未配置时使用下方默认延迟</span>
        </div>
      </div>

      <el-form-item label="默认延迟" :error="showErrors && fixedError ? fixedError : ''">
        <div class="duration-control">
          <el-input-number
            :model-value="delayValue"
            :min="1"
            :precision="0"
            controls-position="right"
            :disabled="disabled"
            @update:model-value="updateFixedValue"
          />
          <el-select v-model="delayUnit" :disabled="disabled">
            <el-option v-for="item in unitOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-form-item>

      <div class="schedule-summary">
        <el-icon><Clock /></el-icon>
        <span>{{ scheduleSummary }}</span>
      </div>
    </div>

    <div v-else class="schedule-summary immediate">
      <el-icon><VideoPlay /></el-icon>
      <span>节点到达后立即执行，不读取模板调度配置</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Clock, Connection, VideoPlay } from "@element-plus/icons-vue"
import type { ScheduleConfig, ScheduleUnit } from "../schedule"

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
const model = defineModel<ScheduleConfig>({ required: true })
const showErrors = ref(false)

const unitOptions: Array<{ value: ScheduleUnit; label: string }> = [
  { value: "minute", label: "分钟" },
  { value: "hour", label: "小时" },
  { value: "day", label: "天" }
]

const enabled = computed(() => model.value.type !== "immediate")
const delayValue = computed(() => (model.value.type === "delay" ? model.value.source.value : undefined))
const delayUnit = computed<ScheduleUnit>({
  get: () => (model.value.type === "delay" ? model.value.unit : "hour"),
  set: (unit) => {
    model.value = {
      type: "delay",
      source: { type: "fixed", value: delayValue.value || 1 },
      unit
    }
  }
})

const fixedError = computed(() => {
  const value = delayValue.value
  return typeof value !== "number" || !Number.isInteger(value) || value <= 0 ? "请输入大于 0 的整数" : ""
})

const scheduleSummary = computed(() => {
  const unit = unitOptions.find((item) => item.value === delayUnit.value)?.label || ""
  const value = delayValue.value
  return value && unit ? `模板未配置时，节点到达 ${value} ${unit}后执行` : ""
})

const updateFixedValue = (value: number | undefined) => {
  model.value = {
    type: "delay",
    source: { type: "fixed", value: value ?? 1 },
    unit: delayUnit.value
  }
}

const validate = () => {
  showErrors.value = true
  return !enabled.value || !fixedError.value
}

defineExpose({ validate, enabled })
</script>

<style scoped lang="scss">
.schedule-editor {
  width: 100%;
}

.schedule-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.template-priority {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  background: linear-gradient(135deg, #fffaf0 0%, #fff 100%);
  border: 1px solid #fde7bd;
  border-radius: 8px;

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #d97706;
    background: #fff3d6;
    border-radius: 7px;
  }

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 3px;
    color: #92400e;
    font-size: 13px;
  }

  span {
    color: #8b6b3f;
    font-size: 12px;
    line-height: 1.5;
  }
}

.duration-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 8px;
  width: 100%;

  .el-input-number,
  .el-select {
    width: 100%;
  }
}

.schedule-config :deep(.el-form-item) {
  margin-bottom: 0;
}

.schedule-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 7px 10px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  background: #f8fafc;
  border-left: 3px solid #f59e0b;
}

.schedule-summary.immediate {
  border-left-color: #94a3b8;
}
</style>
