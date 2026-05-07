<template>
  <div class="local-section">
    <div class="section-header">
      <el-icon><Lock /></el-icon>
      <span>本地口令安全策略</span>
    </div>

    <el-row :gutter="20" class="policy-metrics-row">
      <el-col :span="8">
        <el-form-item label="最小密码长度" :prop="`${pathPrefix}.min_length`">
          <el-input-number
            :model-value="modelValue.min_length"
            @update:model-value="update('min_length', $event)"
            :min="1"
            :max="32"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="允许最大失败次数" :prop="`${pathPrefix}.max_failed_attempts`">
          <template #label>
            <div class="custom-label">
              <span>允许最大失败次数</span>
              <el-tooltip content="连续输错后账号将被锁定" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input-number
            :model-value="modelValue.max_failed_attempts"
            @update:model-value="update('max_failed_attempts', $event)"
            :min="1"
            :max="10"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="锁定持续时间 (分钟)" :prop="`${pathPrefix}.lockout_duration`">
          <el-input-number
            :model-value="modelValue.lockout_duration"
            @update:model-value="update('lockout_duration', $event)"
            :min="1"
            :max="1440"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <div class="complexity-title">复杂度要求</div>

    <el-checkbox-group
      :model-value="complexityChecks"
      @update:model-value="handleComplexityChange"
      class="complexity-group"
    >
      <el-checkbox v-for="item in complexityOptions" :key="item.value" :label="item.value" class="complexity-option">
        <span class="option-title">{{ item.title }}</span>
        <span class="option-desc">{{ item.desc }}</span>
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Lock, QuestionFilled } from "@element-plus/icons-vue"
import type { LocalVO } from "@/api/iam/identity-source/type"

interface Props {
  modelValue: LocalVO
  pathPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  pathPrefix: "local"
})

const emit = defineEmits<{
  (e: "update:modelValue", value: LocalVO): void
}>()

const complexityOptions = [
  { value: "digit", title: "包含数字", desc: "提升弱密码拦截能力" },
  { value: "lower", title: "包含小写字母", desc: "适合常规密码策略" },
  { value: "upper", title: "包含大写字母", desc: "提高密码复杂度" },
  { value: "symbol", title: "包含特殊字符", desc: "进一步增强安全性" }
]

const complexityChecks = computed(() => {
  const res: string[] = []
  if (props.modelValue.require_digit) res.push("digit")
  if (props.modelValue.require_upper) res.push("upper")
  if (props.modelValue.require_lower) res.push("lower")
  if (props.modelValue.require_symbol) res.push("symbol")
  return res
})

const handleComplexityChange = (val: (string | number | boolean)[]) => {
  emit("update:modelValue", {
    ...props.modelValue,
    require_digit: val.includes("digit"),
    require_upper: val.includes("upper"),
    require_lower: val.includes("lower"),
    require_symbol: val.includes("symbol")
  })
}

const update = <K extends keyof LocalVO>(key: K, value: unknown) => {
  // NOTE: el-input-number 可能返回 undefined，这里做兜底处理
  let finalValue = value
  if (value === undefined || value === null) {
    if (key === "min_length") finalValue = 8
    if (key === "max_failed_attempts") finalValue = 5
    if (key === "lockout_duration") finalValue = 30
  }

  emit("update:modelValue", {
    ...props.modelValue,
    [key]: finalValue as LocalVO[K]
  })
}
</script>

<style lang="scss" scoped>
.local-section {
  .section-header {
    display: none;
  }
}

.policy-metrics-row {
  margin-bottom: 20px;
}

.custom-label {
  display: flex;
  align-items: center;
  gap: 4px;
  .help-icon {
    font-size: 14px;
    color: #94a3b8;
    cursor: help;
  }
}

.complexity-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.complexity-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

:deep(.complexity-option) {
  height: auto;
  min-height: 70px;
  margin-right: 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-start;
  gap: 10px;

  &:hover {
    border-color: #93c5fd;
    background: #f0f9ff;
  }

  &.is-checked {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .el-checkbox__input {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .el-checkbox__label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 0;
  }

  .option-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }

  .option-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.3;
  }

  &.is-checked {
    .option-title {
      color: #3b82f6;
    }

    .option-desc {
      color: #475569;
    }
  }
}

@media (max-width: 1024px) {
  /* No specific overrides needed for standard el-row */
}

@media (max-width: 768px) {
  .complexity-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .complexity-group {
    grid-template-columns: 1fr;
  }
}
</style>
