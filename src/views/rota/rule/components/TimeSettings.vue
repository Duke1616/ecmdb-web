<template>
  <div class="settings-group">
    <div class="group-title">
      <el-icon><Calendar /></el-icon>
      <span>时间设置</span>
    </div>

    <el-form-item prop="start_time" label="开始时间" class="form-item required">
      <el-date-picker
        v-model="formData.start_time"
        type="datetime"
        placeholder="选择开始时间"
        format="YYYY-MM-DD HH:mm"
        @change="handleStartDateTimeChange"
        class="form-input"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item prop="end_time" label="结束时间" class="form-item">
      <div class="end-time-container">
        <el-switch
          v-model="isEndTimeVisible"
          @change="handleSwitchChange"
          size="default"
          :active-text="isEndTimeVisible ? '设置结束时间' : '无结束时间'"
          class="end-switch"
        />
        <el-date-picker
          v-if="isEndTimeVisible"
          v-model="formData.end_time"
          type="datetime"
          placeholder="选择结束时间"
          format="YYYY-MM-DD HH:mm"
          @change="handleEndDateTimeChange"
          class="form-input end-time-picker"
          style="width: 100%"
        />
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Calendar } from "@element-plus/icons-vue"

interface TimeData {
  start_time: number
  end_time: number
}

interface Props {
  modelValue: TimeData
}

interface Emits {
  (e: "update:modelValue", value: TimeData): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const formData = ref<TimeData>({ ...props.modelValue })
const isEndTimeVisible = ref<boolean>(false)

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    formData.value = { ...newValue }
    if (newValue.end_time !== 0) {
      isEndTimeVisible.value = true
    }
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

const handleStartDateTimeChange = (date: Date | null) => {
  if (date) {
    formData.value.start_time = date.getTime()
  }
}

const handleEndDateTimeChange = (date: Date | null) => {
  if (date) {
    const endTime = date.getTime()
    const startTime = formData.value.start_time

    if (startTime && endTime < startTime) {
      ElMessage.error("结束时间不能小于开始时间")
      formData.value.end_time = 0
    } else {
      formData.value.end_time = endTime
    }
  } else {
    formData.value.end_time = 0
  }
}

const handleSwitchChange = () => {
  if (!isEndTimeVisible.value) {
    formData.value.end_time = 0
  }
}
</script>

<style scoped lang="scss">
@import "../styles/shared.scss";
</style>
