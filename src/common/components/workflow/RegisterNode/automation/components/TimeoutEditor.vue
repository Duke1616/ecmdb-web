<template>
  <div class="timeout-editor-control">
    <!-- 左侧：纯净数字输入框 -->
    <el-input-number
      v-model="numericValue"
      :min="1"
      :precision="0"
      :controls="false"
      :placeholder="placeholderText"
      class="timeout-number-input"
      :disabled="disabled"
      @change="handleValueChange"
    />

    <!-- 右侧：与动态路由按钮质感一致的单位选择挂件（108px 精准对齐） -->
    <el-dropdown
      trigger="click"
      :disabled="disabled"
      class="timeout-unit-dropdown"
      popper-class="timeout-unit-dropdown-popper"
      @command="handleUnitCommand"
    >
      <button
        type="button"
        class="unit-trigger-btn"
        :class="{ 'is-disabled': disabled }"
        :disabled="disabled"
      >
        <el-icon class="unit-icon"><Timer /></el-icon>
        <span class="unit-label">{{ currentUnitLabel }}</span>
        <el-icon class="unit-arrow"><ArrowDown /></el-icon>
      </button>

      <template #dropdown>
        <el-dropdown-menu class="timeout-unit-menu">
          <el-dropdown-item
            v-for="item in unitOptions"
            :key="item.value"
            :command="item.value"
            :class="{ 'is-active': currentUnit === item.value }"
          >
            <div class="menu-item-row">
              <el-icon class="item-icon"><Timer /></el-icon>
              <span class="item-text">{{ item.label }}</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Timer, ArrowDown } from "@element-plus/icons-vue"

type TimeUnit = "second" | "minute" | "hour"

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    disabled: false
  }
)

const emits = defineEmits<{
  (e: "update:modelValue", val: number | undefined): void
}>()

// ── 单位定义 ────────────────────────────────────────────────────────
const unitOptions: Array<{ value: TimeUnit; label: string; multiplier: number }> = [
  { value: "second", label: "秒", multiplier: 1 },
  { value: "minute", label: "分钟", multiplier: 60 },
  { value: "hour", label: "小时", multiplier: 3600 }
]

// ── 内部状态 ────────────────────────────────────────────────────────
const numericValue = ref<number | undefined>(undefined)
const currentUnit = ref<TimeUnit>("minute")

const currentUnitLabel = computed(() => {
  return unitOptions.find((item) => item.value === currentUnit.value)?.label || "分钟"
})

/**
 * 将传入的总秒数解构为数值与单位
 * @param seconds 总秒数
 */
const decomposeSeconds = (seconds?: number) => {
  if (!seconds || seconds <= 0) {
    numericValue.value = undefined
    currentUnit.value = "minute"
    return
  }

  if (seconds % 3600 === 0 && seconds >= 3600) {
    numericValue.value = seconds / 3600
    currentUnit.value = "hour"
  } else if (seconds % 60 === 0 && seconds >= 60) {
    numericValue.value = seconds / 60
    currentUnit.value = "minute"
  } else {
    numericValue.value = seconds
    currentUnit.value = "second"
  }
}

watch(
  () => props.modelValue,
  (val) => {
    decomposeSeconds(val)
  },
  { immediate: true }
)

const currentTotalSeconds = computed(() => {
  if (!numericValue.value || numericValue.value <= 0) return 0
  const opt = unitOptions.find((item) => item.value === currentUnit.value)
  return (numericValue.value || 0) * (opt ? opt.multiplier : 1)
})

const placeholderText = computed(() => {
  if (currentUnit.value === "minute") return "默认 5 (分钟)"
  if (currentUnit.value === "second") return "默认 300 (秒)"
  if (currentUnit.value === "hour") return "默认 1 (小时)"
  return "请输入超时时间"
})

// ── 事件分发 ────────────────────────────────────────────────────────
const emitUpdate = (totalSeconds?: number) => {
  emits("update:modelValue", totalSeconds && totalSeconds > 0 ? totalSeconds : undefined)
}

const handleValueChange = () => {
  emitUpdate(currentTotalSeconds.value)
}

const handleUnitCommand = (cmd: string | number | object) => {
  currentUnit.value = cmd as TimeUnit
  if (numericValue.value && numericValue.value > 0) {
    emitUpdate(currentTotalSeconds.value)
  }
}
</script>

<style scoped lang="scss">
.timeout-editor-control {
  display: flex;
  width: 100%;
  align-items: center;

  // ── 左侧纯净输入框 ───────────────────────────────────────────────
  .timeout-number-input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      min-height: 36px;
      height: 36px;
      padding: 2px 12px;
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px 0 0 6px !important;
      box-shadow: none !important;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        border-color: #94a3b8 !important;
        z-index: 1;
      }

      &.is-focus {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 1px #6366f1 !important;
        z-index: 2;
      }

      .el-input__inner {
        text-align: left;
        font-size: 13.5px;
        color: #334155;
      }

      .el-input__inner::placeholder {
        color: #a8abb2;
        font-size: 13px;
      }
    }
  }

  // ── 右侧单位挂件（与动态路由按钮同款 108px，图文居中对齐） ─────────────
  .timeout-unit-dropdown {
    flex: none;
    width: 108px;
    margin-left: -1px; // 与左侧重合边框

    .unit-trigger-btn {
      width: 108px;
      height: 36px;
      padding: 0 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-sizing: border-box;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0 6px 6px 0;
      color: #475569;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      position: relative;

      .unit-icon {
        font-size: 14px;
        color: #64748b;
        flex-shrink: 0;
        transition: color 0.2s ease;
      }

      .unit-label {
        color: #334155;
        font-weight: 500;
        line-height: 1;
      }

      .unit-arrow {
        font-size: 11px;
        color: #94a3b8;
        flex-shrink: 0;
        transition: transform 0.2s ease, color 0.2s ease;
      }

      &:hover:not(.is-disabled) {
        background: #f8fafc;
        border-color: #94a3b8;
        color: #1e293b;
        z-index: 1;

        .unit-icon {
          color: #334155;
        }

        .unit-arrow {
          color: #475569;
        }
      }

      &:focus:not(.is-disabled) {
        border-color: #6366f1;
        box-shadow: 0 0 0 1px #6366f1;
        z-index: 2;

        .unit-icon,
        .unit-arrow {
          color: #6366f1;
        }
      }

      &.is-disabled {
        background: #f8fafc;
        border-color: #e2e8f0;
        color: #a8abb2;
        cursor: not-allowed;

        .unit-icon,
        .unit-arrow {
          color: #cbd5e1;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.timeout-unit-dropdown-popper {
  .timeout-unit-menu {
    min-width: 108px;
    padding: 4px;

    .el-dropdown-menu__item {
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 13px;
      color: #334155;

      .menu-item-row {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;

        .item-icon {
          font-size: 13px;
          color: #94a3b8;
        }
      }

      &:hover {
        background: #f1f5f9;
        color: #1e293b;

        .item-icon {
          color: #475569;
        }
      }

      &.is-active {
        background: #eff6ff;
        color: #2563eb;
        font-weight: 600;

        .item-icon {
          color: #2563eb;
        }
      }
    }
  }
}
</style>
