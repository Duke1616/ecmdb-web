<template>
  <div class="settings-group">
    <div class="group-title">
      <el-icon><RefreshRight /></el-icon>
      <span>轮换设置</span>
    </div>

    <div class="rotation-settings">
      <!-- 轮换周期 -->
      <div class="rotation-period">
        <div class="period-label">轮换周期</div>
        <div class="period-controls">
          <div class="period-slider-container">
            <div class="period-value-display">
              <span class="period-number">{{ formData.time_duration }}</span>
              <span class="period-unit">
                {{ formData.time_unit === 4 ? "天" : "小时" }}
              </span>
            </div>
            <el-slider
              v-model="formData.time_duration"
              :min="1"
              :max="30"
              :step="1"
              :show-tooltip="false"
              class="period-slider"
            />
          </div>
        </div>
        <div class="period-presets">
          <el-button
            v-for="preset in [1, 3, 7, 14, 30]"
            :key="preset"
            size="small"
            :type="formData.time_duration === preset ? 'primary' : 'default'"
            @click="selectDuration(preset)"
            class="preset-btn"
          >
            {{ preset }}
          </el-button>
        </div>
      </div>

      <!-- 时间单位 -->
      <div class="rotation-unit">
        <div class="unit-label">时间单位</div>
        <div class="unit-options">
          <div class="unit-option" :class="{ active: formData.time_unit === 4 }" @click="selectUnit(4)">
            <el-icon><Calendar /></el-icon>
            <span>天</span>
          </div>
          <div class="unit-option" :class="{ active: formData.time_unit === 5 }" @click="selectUnit(5)">
            <el-icon><Clock /></el-icon>
            <span>小时</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { Calendar, Clock, RefreshRight } from "@element-plus/icons-vue"

interface RotationData {
  time_unit: number
  time_duration: number
}

interface Props {
  modelValue: RotationData
}

interface Emits {
  (e: "update:modelValue", value: RotationData): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const formData = ref<RotationData>({ ...props.modelValue })

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    formData.value = { ...newValue }
  },
  { deep: true }
)

// 监听内部数据变化
watch(
  formData,
  (newValue) => {
    emits("update:modelValue", newValue)
  },
  { deep: true }
)

// 选择单位
const selectUnit = (unit: number) => {
  formData.value.time_unit = unit
}

// 选择周期
const selectDuration = (duration: number) => {
  formData.value.time_duration = duration
}
</script>

<style scoped lang="scss">
@import "../styles/shared.scss";
</style>
