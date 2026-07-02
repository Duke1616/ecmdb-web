<template>
  <div class="time-window-renew-content">
    <div class="current-time-info">
      <h4>当前静默窗口</h4>
      <div class="time-display">
        <el-icon><Clock /></el-icon>
        <span v-if="currentTimeWindow">
          {{ formatTime(currentTimeWindow.start) }} - {{ formatTime(currentTimeWindow.end) }}
        </span>
        <span v-else>无时间窗口</span>
      </div>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
      <div class="time-window-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>续期窗口</span>
        </div>

        <div class="quick-time-buttons">
          <el-button size="small" @click="setQuickTime(1)">1小时</el-button>
          <el-button size="small" @click="setQuickTime(6)">6小时</el-button>
          <el-button size="small" @click="setQuickTime(24)">1天</el-button>
          <el-button size="small" @click="setQuickTime(72)">3天</el-button>
          <el-button size="small" @click="setQuickTime(168)">7天</el-button>
        </div>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item prop="startTime" label="开始时间">
              <el-date-picker
                v-model="startTime"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="endTime" label="结束时间">
              <el-date-picker
                v-model="endTime"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Clock } from "@element-plus/icons-vue"
import { renewalSilenceTimeWindowApi } from "@/api/alert/silence"
import type { SilenceRule } from "@/api/alert/silence/types"

const props = defineProps<{
  rule: SilenceRule | null
}>()

const formRef = ref<FormInstance>()
const startTime = ref("")
const endTime = ref("")

const currentTimeWindow = computed(() => props.rule?.time_window)
const formData = computed(() => ({
  startTime: startTime.value,
  endTime: endTime.value
}))

const formRules: FormRules = {
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endTime: [
    { required: true, message: "请选择结束时间", trigger: "change" },
    {
      validator: (_rule, _value, callback) => {
        if (!startTime.value || !endTime.value) {
          callback()
          return
        }

        const start = new Date(startTime.value).getTime()
        const end = new Date(endTime.value).getTime()
        callback(end <= start ? new Error("结束时间必须晚于开始时间") : undefined)
      },
      trigger: "change"
    }
  ]
}

const normalizeTimestamp = (timestamp: number) => {
  if (!timestamp || timestamp <= 0) return 0
  return timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
}

const formatTime = (timestamp: number): string => {
  const actualTimestamp = normalizeTimestamp(timestamp)
  if (!actualTimestamp) return "无效时间"

  const date = new Date(actualTimestamp)
  if (Number.isNaN(date.getTime())) return "无效时间"

  return formatDateTime(date)
}

const formatDateTime = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const timestampToDateTime = (timestamp: number): string => {
  const actualTimestamp = normalizeTimestamp(timestamp)
  if (!actualTimestamp) return ""

  const date = new Date(actualTimestamp)
  return Number.isNaN(date.getTime()) ? "" : formatDateTime(date)
}

const setQuickTime = (hours: number) => {
  const now = new Date()
  startTime.value = formatDateTime(now)
  endTime.value = formatDateTime(new Date(now.getTime() + hours * 60 * 60 * 1000))
}

const initializeForm = () => {
  if (!props.rule?.time_window) {
    startTime.value = ""
    endTime.value = ""
    return
  }

  startTime.value = timestampToDateTime(props.rule.time_window.start)
  endTime.value = timestampToDateTime(props.rule.time_window.end)
}

const handleConfirm = async () => {
  if (!formRef.value || !props.rule) return false

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return false

  await renewalSilenceTimeWindowApi({
    id: props.rule.id,
    start_time: new Date(startTime.value).getTime(),
    end_time: new Date(endTime.value).getTime()
  })
  ElMessage.success("续期成功")
  return true
}

watch(
  () => props.rule,
  () => {
    nextTick(() => {
      initializeForm()
      formRef.value?.clearValidate()
    })
  },
  { immediate: true }
)

defineExpose({
  handleConfirm
})
</script>

<style lang="scss" scoped>
.time-window-renew-content {
  padding: 20px;
}

.current-time-info {
  margin-bottom: 18px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  h4 {
    margin: 0 0 8px;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
  }
}

.time-display,
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.time-window-section {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.section-title {
  margin-bottom: 12px;
  color: #1f2937;
  font-weight: 700;
}

.quick-time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
</style>
