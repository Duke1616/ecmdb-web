<template>
  <div class="settings-group">
    <div class="group-title">
      <el-icon><Calendar /></el-icon>
      <span>时间设置</span>
    </div>

    <el-form-item prop="start_time" label="开始时间" class="form-item required">
      <el-date-picker
        v-model="rotaRuleForm.start_time"
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
          v-model="rotaRuleForm.end_time"
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
import type { OnCallRule } from "@/api/alert/oncall/types/oncall"

// NOTE: 该组件为时间规则配置的输入子组件，需要与父表单进行时间状态同步
const rotaRuleForm = defineModel<OnCallRule>("rotaRuleForm", { required: true })
const isEndTimeVisible = ref<boolean>(false)

// 根据 end_time 初始化开关状态（加上安全判断）
watch(
  () => rotaRuleForm.value?.end_time,
  (val) => {
    isEndTimeVisible.value = !!val && val !== 0
  },
  { immediate: true }
)

const handleStartDateTimeChange = (date: Date | null) => {
  if (date) {
    rotaRuleForm.value!.start_time = date.getTime()
  }
}

const handleEndDateTimeChange = (date: Date | null) => {
  if (date) {
    const endTime = date.getTime()
    const startTime = rotaRuleForm.value?.start_time

    if (startTime && endTime < startTime) {
      ElMessage.error("结束时间不能小于开始时间")
      rotaRuleForm.value!.end_time = 0
    } else {
      rotaRuleForm.value!.end_time = endTime
    }
  } else {
    rotaRuleForm.value!.end_time = 0
  }
}

const handleSwitchChange = () => {
  if (!isEndTimeVisible.value) {
    rotaRuleForm.value!.end_time = 0
  }
}
</script>

<style scoped lang="scss">
/* 设置组样式 */
.settings-group {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

/* 组标题样式 */
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 0;
  background: transparent;
  border-radius: 0;

  .el-icon {
    font-size: 16px;
    color: #3b82f6;
  }

  span {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
}

/* 表单项目样式 */
.form-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #334155;
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 6px;

    &::before {
      content: "";
      display: inline-block;
      width: 16px;
      flex-shrink: 0;
    }
  }

  &.required {
    :deep(.el-form-item__label) {
      &::before {
        content: "*";
        color: #ef4444;
        font-size: 16px;
        font-weight: 700;
        margin-right: 0;
        display: inline-block;
        width: 16px;
        text-align: center;
      }
    }
  }

  .form-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      box-shadow: none;
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-input__inner) {
      font-size: 13px;
      color: #374151;
    }

    :deep(.el-input__prefix) {
      color: #9ca3af;
    }
  }
}

/* 结束时间容器 */
.end-time-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.end-time-picker {
  width: 100% !important;
  margin-top: 0 !important;

  :deep(.el-input__wrapper) {
    width: 100% !important;
  }
}
</style>
