<template>
  <div class="inhibit-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="auto"
      class="inhibit-form"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row form-row-inline">
          <el-form-item prop="name" label="规则名称" class="form-item form-item-flex">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
          <el-form-item prop="enabled" label="启用状态" class="form-item form-item-flex">
            <div class="switch-container">
              <el-switch v-model="formData.enabled" size="large" />
              <span class="form-tip">是否启用此抑制规则</span>
            </div>
          </el-form-item>
        </div>

        <div class="form-row form-row-inline">
          <el-form-item prop="scope" label="生效范围" class="form-item form-item-flex">
            <el-select v-model="formData.scope" placeholder="请选择生效范围" @change="handleScopeChange">
              <el-option label="全局生效" :value="InhibitScope.Global" />
              <el-option label="所属空间内生效" :value="InhibitScope.Workspace" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="formData.scope === InhibitScope.Workspace"
            label="工作空间"
            class="form-item form-item-flex"
          >
            <el-input :value="`当前工作空间 (ID: ${currentWorkspaceId})`" disabled placeholder="自动使用当前工作空间" />
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Filter /></el-icon>
          <span>匹配器配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="source_matchers" label="源匹配器" class="form-item">
            <div class="matcher-config">
              <div v-for="(matcher, index) in formData.source_matchers" :key="index" class="matcher-item">
                <el-input v-model="matcher.name" placeholder="标签名" size="default" />
                <el-select v-model="matcher.type" placeholder="类型" size="default">
                  <el-option label="等于" :value="MatchType.Equal" />
                  <el-option label="不等于" :value="MatchType.NotEqual" />
                  <el-option label="正则" :value="MatchType.Regexp" />
                  <el-option label="非正则" :value="MatchType.NotRegexp" />
                </el-select>
                <el-input v-model="matcher.value" placeholder="标签值" size="default" />
                <el-button type="text" @click="removeSourceMatcher(index)" class="matcher-remove"> 删除 </el-button>
              </div>
              <el-button type="text" @click="addSourceMatcher" class="add-matcher-btn">
                <el-icon><Plus /></el-icon>
                添加源匹配器
              </el-button>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="target_matchers" label="目标匹配器" class="form-item">
            <div class="matcher-config">
              <div v-for="(matcher, index) in formData.target_matchers" :key="index" class="matcher-item">
                <el-input v-model="matcher.name" placeholder="标签名" size="default" />
                <el-select v-model="matcher.type" placeholder="类型" size="default">
                  <el-option label="等于" :value="MatchType.Equal" />
                  <el-option label="不等于" :value="MatchType.NotEqual" />
                  <el-option label="正则" :value="MatchType.Regexp" />
                  <el-option label="非正则" :value="MatchType.NotRegexp" />
                </el-select>
                <el-input v-model="matcher.value" placeholder="标签值" size="default" />
                <el-button type="text" @click="removeTargetMatcher(index)" class="matcher-remove"> 删除 </el-button>
              </div>
              <el-button type="text" @click="addTargetMatcher" class="add-matcher-btn">
                <el-icon><Plus /></el-icon>
                添加目标匹配器
              </el-button>
            </div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="equal_labels" label="相同标签" class="form-item">
            <div class="equal-labels-config">
              <el-tag
                v-for="(label, index) in formData.equal_labels"
                :key="index"
                closable
                @close="removeEqualLabel(index)"
                class="label-tag"
              >
                {{ label }}
              </el-tag>
              <el-input
                v-if="inputVisible"
                ref="inputRef"
                v-model="inputValue"
                class="label-input"
                size="small"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
              />
              <el-button v-else class="button-new-tag" size="small" @click="showInput"> + 添加标签 </el-button>
            </div>
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title has-right-content">
          <div class="title-left">
            <el-icon class="section-icon"><Clock /></el-icon>
            <span>时间窗口</span>
          </div>
          <div class="time-window-switch">
            <el-switch v-model="hasTimeWindow" @change="toggleTimeWindow" size="large" />
            <span class="form-tip">启用时间窗口</span>
          </div>
        </div>

        <div v-if="hasTimeWindow" class="form-row">
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

        <div v-if="hasTimeWindow" class="form-row">
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
import { ref, nextTick, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { Setting, Filter, Clock, Plus } from "@element-plus/icons-vue"
import type { SaveInhibitRuleReq } from "@/api/alert/inhibit/types"
import { MatchType, InhibitScope } from "@/api/alert/inhibit/types"
import type { FormInstance } from "element-plus"
import { clearZeroValues } from "@@/utils"

interface Props {
  formRules: any
}
defineProps<Props>()

// 使用 defineModel 简化双向绑定
const formData = defineModel<SaveInhibitRuleReq>("formData", { required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 获取当前工作空间ID
const route = useRoute()
const currentWorkspaceId = computed(() => {
  const workspaceId = route.params.id
  return workspaceId ? Number(workspaceId) : undefined
})

// 时间窗口相关
const hasTimeWindow = ref(false)
const startTime = ref("")
const endTime = ref("")

// 标签输入相关
const inputVisible = ref(false)
const inputValue = ref("")
const inputRef = ref<InstanceType<typeof import("element-plus").ElInput>>()

// 处理生效范围变化
const handleScopeChange = (scope: InhibitScope) => {
  if (scope === InhibitScope.Global) {
    formData.value.workspace_id = undefined
  } else if (scope === InhibitScope.Workspace) {
    // 自动设置当前工作空间ID
    formData.value.workspace_id = currentWorkspaceId.value
  }
}

// 切换时间窗口
const toggleTimeWindow = (val: string | number | boolean) => {
  const value = Boolean(val)
  if (value) {
    // 使用当前时间作为默认值
    const now = Date.now()
    formData.value.time_window = { start: now, end: now + 60 * 60 * 1000 } // 默认1小时后结束
  } else {
    formData.value.time_window = null
  }
  // 同步到显示值
  syncTimeWindowToDisplay()
}

// 更新时间窗口
const updateTimeWindow = () => {
  if (startTime.value && endTime.value) {
    // 将日期时间字符串转换为时间戳
    const startTimestamp = new Date(startTime.value).getTime()
    const endTimestamp = new Date(endTime.value).getTime()
    formData.value.time_window = {
      start: startTimestamp,
      end: endTimestamp
    }
  }
}

// 添加源匹配器
const addSourceMatcher = () => {
  formData.value.source_matchers.push({
    type: MatchType.Equal,
    name: "",
    value: ""
  })
}

// 删除源匹配器
const removeSourceMatcher = (index: number) => {
  formData.value.source_matchers.splice(index, 1)
}

// 添加目标匹配器
const addTargetMatcher = () => {
  formData.value.target_matchers.push({
    type: MatchType.Equal,
    name: "",
    value: ""
  })
}

// 删除目标匹配器
const removeTargetMatcher = (index: number) => {
  formData.value.target_matchers.splice(index, 1)
}

// 快速设置时间窗口
const setQuickTime = (hours: number) => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000)

  startTime.value = formatDateTime(start)
  endTime.value = formatDateTime(end)
  updateTimeWindow()
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
    console.warn("Invalid date from timestamp:", timestamp, "converted to:", actualTimestamp)
    return ""
  }

  return formatDateTime(date)
}

// 初始化时间窗口显示
const initializeTimeWindow = () => {
  if (formData.value?.time_window) {
    const startTimeStr = timestampToDateTime(formData.value.time_window.start)
    const endTimeStr = timestampToDateTime(formData.value.time_window.end)

    // 只有当转换成功时才更新显示值
    if (startTimeStr && endTimeStr) {
      startTime.value = startTimeStr
      endTime.value = endTimeStr
      hasTimeWindow.value = true
    } else {
      // 如果时间戳无效，清空显示值
      startTime.value = ""
      endTime.value = ""
      hasTimeWindow.value = false
    }
  } else {
    startTime.value = ""
    endTime.value = ""
    hasTimeWindow.value = false
  }
}

// 同步时间窗口状态到显示值
const syncTimeWindowToDisplay = () => {
  if (formData.value?.time_window) {
    hasTimeWindow.value = true
    initializeTimeWindow()
  } else {
    hasTimeWindow.value = false
    startTime.value = ""
    endTime.value = ""
  }
}

// 组件挂载时初始化
onMounted(() => {
  syncTimeWindowToDisplay()
})

// 显示标签输入框
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.input?.focus()
  })
}

// 确认标签输入
const handleInputConfirm = () => {
  if (inputValue.value) {
    formData.value.equal_labels.push(inputValue.value)
    inputValue.value = ""
  }
  inputVisible.value = false
}

// 删除相同标签
const removeEqualLabel = (index: number) => {
  formData.value.equal_labels.splice(index, 1)
}

// 获取清理后的表单数据（用于保存时清理零值）
const getCleanedFormData = () => {
  return clearZeroValues(formData.value)
}

// 暴露 formRef 和清理函数给父组件
defineExpose({
  formRef,
  getCleanedFormData
})
</script>

<style lang="scss" scoped>
.inhibit-form-container {
  padding: 20px;
}

.inhibit-form {
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
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .time-window-switch {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;

      .form-tip {
        font-size: 12px;
        color: #6b7280;
      }
    }
  }

  .section-title.has-right-content {
    justify-content: space-between;

    .title-left {
      display: flex;
      align-items: center;

      .section-icon {
        margin-right: 6px;
        font-size: 16px;
        color: #3b82f6;
      }

      span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    &.form-row-inline {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    &.form-item-flex {
      flex: 1;
      min-width: 0; // 防止 flex 子元素溢出
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
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

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
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

  .switch-container {
    display: flex;
    align-items: center;
    gap: 8px;

    .form-tip {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .matcher-config {
    width: 100%;

    .matcher-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 6px;
      width: 100%;

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
      width: 100%;
      margin-top: 8px;
      color: #3b82f6;
      border: 1px dashed #3b82f6;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &:hover {
        color: #1d4ed8;
        background: #dbeafe;
      }
    }
  }

  .equal-labels-config {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .label-tag {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .label-input {
      width: 90px;
      height: 24px;
    }

    .button-new-tag {
      height: 24px;
      line-height: 22px;
      padding: 0 8px;
      font-size: 12px;
    }
  }

  .time-window-config {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .form-tip {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .time-range {
    display: flex;
    align-items: center;
    gap: 12px;

    .time-separator {
      font-size: 14px;
      color: #6b7280;
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
