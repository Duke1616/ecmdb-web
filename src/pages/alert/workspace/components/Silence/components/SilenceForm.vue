<template>
  <div class="silence-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="silence-form"
    >
      <div class="form-section">
        <div class="section-title has-right-content">
          <div class="title-left">
            <el-icon class="section-icon"><Setting /></el-icon>
            <span>基本信息</span>
          </div>
          <div class="section-switch">
            <el-switch v-model="formData.enabled" size="large" />
            <span class="form-tip">启用规则</span>
          </div>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="规则名称" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>匹配器配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="matchers" label="静默匹配器" class="form-item">
            <div class="matcher-config">
              <div v-for="(matcher, index) in formData.matchers" :key="index" class="matcher-item">
                <el-input v-model="matcher.name" placeholder="标签名" size="default" />
                <el-select v-model="matcher.type" placeholder="类型" size="default" @change="handleMatcherTypeChange(matcher)">
                  <el-option
                    v-for="option in matchTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-model="matcher.value"
                  placeholder="标签值"
                  size="default"
                  :disabled="!isValueRequired(matcher.type)"
                />
                <el-button type="text" class="matcher-remove" @click="removeMatcher(index)"> 删除 </el-button>
              </div>
              <el-button type="text" class="add-matcher-btn" @click="addMatcher">
                <el-icon><Plus /></el-icon>
                添加静默匹配器
              </el-button>
            </div>
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Clock /></el-icon>
          <span>时间窗口</span>
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
import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import type { FormInstance, FormRules } from "element-plus"
import { Clock, Filter, Plus, Setting } from "@element-plus/icons-vue"
import { MatchType } from "@@/constants/match-type"
import { useMatcher } from "@@/composables/useMatcher"
import type { Matcher, SaveSilenceRuleReq } from "@/api/alert/silence/types"

const formData = defineModel<SaveSilenceRuleReq>("formData", { required: true })

const route = useRoute()
const formRef = ref<FormInstance>()
const startTime = ref("")
const endTime = ref("")
const { getMatchTypeOptions, isValueRequired } = useMatcher()

const currentWorkspaceId = computed(() => {
  const workspaceId = Number(route.params.id || route.query.id)
  return Number.isFinite(workspaceId) && workspaceId > 0 ? workspaceId : undefined
})

const matchTypeOptions = computed(() => getMatchTypeOptions())

const validateMatchers = (_rule: unknown, value: Matcher[], callback: (error?: Error) => void) => {
  if (!value || value.length === 0) {
    callback(new Error("请至少添加一个匹配器"))
    return
  }

  const invalid = value.some((matcher) => !matcher.name || (isValueRequired(matcher.type) && !matcher.value))
  callback(invalid ? new Error("请补全匹配器") : undefined)
}

const validateStartTime = (_rule: unknown, _value: number, callback: (error?: Error) => void) => {
  callback(startTime.value ? undefined : new Error("请选择开始时间"))
}

const validateEndTime = (_rule: unknown, _value: number, callback: (error?: Error) => void) => {
  if (!endTime.value) {
    callback(new Error("请选择结束时间"))
    return
  }

  const start = new Date(startTime.value).getTime()
  const end = new Date(endTime.value).getTime()
  callback(end <= start ? new Error("结束时间必须晚于开始时间") : undefined)
}

const formRules: FormRules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  matchers: [{ validator: validateMatchers, trigger: "change" }],
  "time_window.start": [{ validator: validateStartTime, trigger: "change" }],
  "time_window.end": [{ validator: validateEndTime, trigger: "change" }]
}

const normalizeTimestamp = (timestamp: number) => {
  if (!timestamp || timestamp <= 0) return 0
  return timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
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

const syncTimeWindowToDisplay = () => {
  startTime.value = timestampToDateTime(Number(formData.value.time_window?.start))
  endTime.value = timestampToDateTime(Number(formData.value.time_window?.end))
}

const updateTimeWindow = () => {
  if (!startTime.value || !endTime.value) return

  formData.value.time_window = {
    ...formData.value.time_window,
    start: new Date(startTime.value).getTime(),
    end: new Date(endTime.value).getTime()
  }
}

const setQuickTime = (hours: number) => {
  const now = new Date()
  startTime.value = formatDateTime(now)
  endTime.value = formatDateTime(new Date(now.getTime() + hours * 60 * 60 * 1000))
  updateTimeWindow()
}

const addMatcher = () => {
  formData.value.matchers.push({
    type: MatchType.Equal,
    name: "",
    value: ""
  })
}

const removeMatcher = (index: number) => {
  formData.value.matchers.splice(index, 1)
}

const handleMatcherTypeChange = (matcher: Matcher) => {
  if (!isValueRequired(matcher.type)) {
    matcher.value = ""
  }
}

const getCleanedFormData = (): SaveSilenceRuleReq => {
  updateTimeWindow()
  return {
    ...formData.value,
    workspace_id: currentWorkspaceId.value,
    matchers: formData.value.matchers.map((matcher) => ({
      ...matcher,
      value: isValueRequired(matcher.type) ? matcher.value : ""
    }))
  }
}

watch(
  () => formData.value,
  () => {
    syncTimeWindowToDisplay()
  },
  { immediate: true }
)

defineExpose({
  formRef,
  getCleanedFormData
})
</script>

<style lang="scss" scoped>
.silence-form-container {
  padding: 20px;
}

.silence-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    border-radius: 6px;

    .section-icon {
      margin-right: 6px;
      color: #3b82f6;
      font-size: 16px;
    }

    span {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .section-title.has-right-content {
    justify-content: space-between;

    .title-left {
      display: flex;
      align-items: center;

      .section-icon {
        margin-right: 6px;
        color: #3b82f6;
        font-size: 16px;
      }

      span {
        color: #374151;
        font-size: 14px;
        font-weight: 600;
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
      margin-bottom: 6px;
      color: #374151;
      font-size: 13px;
      font-weight: 500;
    }

    &.form-item-flex {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .section-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;

    .form-tip {
      color: #6b7280;
      font-size: 12px;
    }
  }

  .matcher-config {
    width: 100%;

    .matcher-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-bottom: 6px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      .el-input {
        &:first-child {
          flex: 0 0 140px;
          min-width: 140px;
        }

        &:last-child {
          flex: 1;
          min-width: 150px;
        }
      }

      .el-select {
        flex: 0 0 100px;
        min-width: 100px;
      }

      .matcher-remove {
        flex: 0 0 auto;
        margin-left: auto;
        color: #ef4444;

        &:hover {
          color: #dc2626;
        }
      }
    }

    .add-matcher-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 8px;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px dashed #3b82f6;

      &:hover {
        color: #1d4ed8;
        background: #dbeafe;
      }
    }
  }

  .quick-time-buttons {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    margin: 0;
    padding: 0;

    .el-button {
      width: 100%;
      min-width: 0;
      max-width: none;
      margin: 0;
      padding: 4px 8px;
      color: #374151;
      font-size: 12px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      box-sizing: border-box;

      &:hover {
        color: #3b82f6;
        background: #eff6ff;
        border-color: #3b82f6;
      }
    }
  }
}

@media (max-width: 768px) {
  .silence-form {
    .matcher-config .matcher-item {
      align-items: stretch;
      flex-direction: column;

      .el-input,
      .el-select {
        flex: none;
        width: 100%;
        min-width: 0;
      }
    }

    .quick-time-buttons {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
