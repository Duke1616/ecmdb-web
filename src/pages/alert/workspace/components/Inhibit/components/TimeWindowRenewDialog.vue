<template>
  <div class="time-window-renew-content">
    <div class="current-time-info">
      <h4>当前时间窗口</h4>
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
          <div class="title-left">
            <el-icon class="section-icon"><Clock /></el-icon>
            <span>时间窗口</span>
          </div>
        </div>

        <div class="form-row">
          <el-form-item label="快速选择" class="form-item">
            <div class="quick-time-buttons">
              <el-button size="small" @click="setQuickTime(1)">1小时</el-button>
              <el-button size="small" @click="setQuickTime(6)">6小时</el-button>
              <el-button size="small" @click="setQuickTime(12)">12小时</el-button>
              <el-button size="small" @click="setQuickTime(24)">1天</el-button>
              <el-button size="small" @click="setQuickTime(72)">3天</el-button>
              <el-button size="small" @click="setQuickTime(168)">7天</el-button>
              <el-button size="small" @click="setQuickTime(720)">1月</el-button>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item prop="time_window.start" label="开始时间" class="form-item">
                <el-date-picker
                  v-model="startTime"
                  type="datetime"
                  placeholder="选择开始时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm"
                  size="large"
                  style="width: 100%"
                  @change="updateTimeWindow"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="time_window.end" label="结束时间" class="form-item">
                <el-date-picker
                  v-model="endTime"
                  type="datetime"
                  placeholder="选择结束时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm"
                  size="large"
                  style="width: 100%"
                  @change="updateTimeWindow"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Clock } from "@element-plus/icons-vue"
import type { InhibitRule } from "@/api/alert/inhibit/types"
import { renewalTimeWindowApi } from "@/api/alert/inhibit"

interface Props {
  rule: InhibitRule | null
}

interface Emits {
  (e: "confirm", data: any): void
  (e: "cancel"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref<FormInstance>()
const submitting = ref(false)
const startTime = ref("")
const endTime = ref("")

// 当前时间窗口信息
const currentTimeWindow = computed(() => props.rule?.time_window)

// 表单数据
const formData = computed(() => ({
  time_window:
    startTime.value && endTime.value
      ? {
          start: new Date(startTime.value).getTime(),
          end: new Date(endTime.value).getTime()
        }
      : null
}))

// 表单验证规则
const formRules: FormRules = {
  "time_window.start": [
    {
      validator: (rule, value, callback) => {
        if (!startTime.value) {
          callback(new Error("请选择开始时间"))
        } else {
          callback()
        }
      },
      trigger: "change"
    }
  ],
  "time_window.end": [
    {
      validator: (rule, value, callback) => {
        if (!endTime.value) {
          callback(new Error("请选择结束时间"))
        } else if (startTime.value && endTime.value) {
          const start = new Date(startTime.value).getTime()
          const end = new Date(endTime.value).getTime()
          if (end <= start) {
            callback(new Error("结束时间必须晚于开始时间"))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: "change"
    }
  ]
}

// 格式化时间戳
const formatTime = (timestamp: number): string => {
  if (!timestamp || timestamp <= 0) {
    return "无效时间"
  }

  let actualTimestamp = timestamp
  if (timestamp.toString().length === 10) {
    actualTimestamp = timestamp * 1000
  }

  const date = new Date(actualTimestamp)
  if (isNaN(date.getTime())) {
    return "无效时间"
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 更新时间窗口
const updateTimeWindow = () => {
  // 这个方法在日期选择器变化时被调用，用于触发验证
  // 实际的时间窗口数据通过 computed 的 formData 自动更新
}

// 快速设置时间窗口
const setQuickTime = (hours: number) => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000)

  startTime.value = formatDateTime(start)
  endTime.value = formatDateTime(end)
}

// 格式化时间为 YYYY-MM-DD HH:mm
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 时间戳转换为日期时间字符串
const timestampToDateTime = (timestamp: number): string => {
  // 检查时间戳是否有效
  if (!timestamp || timestamp <= 0) {
    console.warn("Invalid timestamp:", timestamp)
    return ""
  }

  // 如果时间戳看起来是秒级时间戳（10位数字），转换为毫秒
  let actualTimestamp = timestamp
  if (timestamp.toString().length === 10) {
    actualTimestamp = timestamp * 1000
  }

  const date = new Date(actualTimestamp)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.warn("Invalid date from timestamp:", timestamp)
    return ""
  }

  return formatDateTime(date)
}

// 初始化时间窗口显示
const initializeTimeWindow = () => {
  if (props.rule?.time_window) {
    const startTimeStr = timestampToDateTime(props.rule.time_window.start)
    const endTimeStr = timestampToDateTime(props.rule.time_window.end)

    // 只有当转换成功时才更新显示值
    if (startTimeStr && endTimeStr) {
      startTime.value = startTimeStr
      endTime.value = endTimeStr
    } else {
      // 如果时间戳无效，清空显示值
      startTime.value = ""
      endTime.value = ""
    }
  } else {
    startTime.value = ""
    endTime.value = ""
  }
}

// 初始化表单数据
const initializeForm = () => {
  initializeTimeWindow()
}

// 监听规则变化，初始化表单
watch(
  () => props.rule,
  () => {
    if (props.rule) {
      nextTick(() => {
        initializeForm()
        formRef.value?.clearValidate()
      })
    }
  },
  { immediate: true }
)

// 处理确认
const handleConfirm = async () => {
  if (!formRef.value || !props.rule) {
    throw new Error("表单或规则数据不完整")
  }

  await formRef.value.validate()
  submitting.value = true

  try {
    // 构建续期数据
    const renewalData = {
      id: props.rule.id,
      start_time: formData.value.time_window?.start || 0,
      end_time: formData.value.time_window?.end || 0
    }

    await renewalTimeWindowApi(renewalData)
    ElMessage.success("时间窗口续期成功")
    return renewalData
  } catch (error) {
    console.error("续期失败:", error)
    ElMessage.error("续期失败，请重试")
    throw error
  } finally {
    submitting.value = false
  }
}

// 处理取消
const handleCancel = () => {
  emit("cancel")
}

// 导出函数供父组件使用
defineExpose({
  handleConfirm,
  handleCancel
})
</script>

<style scoped lang="scss">
.time-window-renew-content {
  .current-time-info {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .time-display {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #6b7280;

      .el-icon {
        color: #3b82f6;
      }
    }
  }

  .time-window-config {
    .time-picker-container {
      margin-top: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 时间窗口部分样式
.time-window-section {
  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    &.has-right-content {
      justify-content: space-between;
    }

    .title-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        font-size: 16px;
        color: #3b82f6;
      }

      span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
    }

    .time-window-switch {
      display: flex;
      align-items: center;
      gap: 8px;

      .form-tip {
        font-size: 12px;
        color: #6b7280;
      }
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
      font-size: 13px;
      line-height: 1.4;
      padding: 0;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .quick-time-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    gap: 8px;
    margin: 0;
    padding: 0;
    width: 100%;

    .el-button {
      border-radius: 4px;
      font-size: 12px;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      color: #374151;
      width: 100%;
      min-width: 0;
      max-width: none;
      margin: 0;
      box-sizing: border-box;

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #eff6ff;
      }
    }
  }
}
</style>
