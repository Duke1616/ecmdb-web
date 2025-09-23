<template>
  <div class="inhibit-rules-section">
    <div class="section-header">
      <div class="header-info">
        <h4>抑制规则</h4>
        <span class="header-tip">全局抑制规则，对所有工作空间生效</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAddRule">添加规则</el-button>
    </div>
    <div class="section-content">
      <div class="inhibit-rules-list" v-loading="loading">
        <!-- 空状态 -->
        <div v-if="!loading && rules.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><Filter /></el-icon>
          </div>
          <h4 class="empty-title">暂无抑制规则</h4>
          <p class="empty-description">配置全局抑制规则，减少不必要的告警通知</p>
          <el-button type="primary" :icon="Plus" @click="handleAddRule">
            添加抑制规则
          </el-button>
        </div>

        <!-- 规则列表 -->
        <div v-for="rule in rules" :key="rule.id" class="inhibit-rule-card">
          <div class="rule-header">
            <div class="rule-info">
              <h5 class="rule-name">抑制规则 #{{ rule.id }}</h5>
                       <p class="rule-description">
                         源匹配：{{ rule.source_match.map(m => `${m.Name}=${m.Value}`).join(', ') }} |
                         目标匹配：{{ rule.target_match.map(m => `${m.Name}=${m.Value}`).join(', ') }}
                       </p>
            </div>
            <div class="rule-actions">
              <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" />
              <el-button type="text" @click="handleEditRule(rule)">编辑</el-button>
              <el-button type="text" @click="handleDeleteRule(rule)">删除</el-button>
            </div>
          </div>
          <div class="rule-details">
            <div class="rule-labels">
              <span class="label">匹配标签：</span>
              <span class="value">{{ rule.equal_labels.join(', ') || '无' }}</span>
            </div>
            <div class="rule-time" v-if="rule.time_window && (rule.time_window.start !== 0 || rule.time_window.end !== 0)">
              <span class="label">时间窗口：</span>
              <span class="value">{{ formatTimeWindow(rule.time_window) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则抽屉 -->
    <Drawer
      v-model="dialogVisible"
      :title="isEdit ? '编辑抑制规则' : '添加抑制规则'"
      :subtitle="isEdit ? '修改抑制规则配置' : '配置全局抑制规则，减少不必要的告警'"
      :header-icon="Filter"
      size="700px"
      direction="rtl"
      :before-close="handleDialogClose"
      @closed="handleDialogClose"
      @confirm="handleSubmit"
      :confirm-loading="submitting"
    >
      <div class="rule-form-container">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-position="top"
          label-width="auto"
          class="rule-form"
        >
          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>基本信息</span>
            </div>

            <div class="form-row">
              <el-form-item prop="name" label="规则名称" class="form-item">
                <el-input v-model="formData.name" placeholder="请输入规则名称" size="large" clearable />
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Filter /></el-icon>
              <span>匹配器配置</span>
            </div>

            <div class="form-row">
              <el-form-item prop="source_match" label="源匹配器" class="form-item">
                <div class="matchers-container">
                  <div v-for="(matcher, index) in formData.source_match" :key="index" class="matcher-item">
                    <el-select v-model="matcher.Type" placeholder="类型" size="large" style="width: 100px">
                      <el-option label="等于" :value="1" />
                      <el-option label="正则" :value="2" />
                    </el-select>
                    <el-input v-model="matcher.Name" placeholder="标签名" size="large" style="width: 120px" />
                    <el-input v-model="matcher.Value" placeholder="标签值" size="large" style="width: 150px" />
                    <el-button type="text" @click="removeMatcher('source', index)">删除</el-button>
                  </div>
                  <el-button type="text" @click="addMatcher('source')" class="add-matcher-btn">
                    <el-icon><Plus /></el-icon>
                    添加源匹配器
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item prop="target_match" label="目标匹配器" class="form-item">
                <div class="matchers-container">
                  <div v-for="(matcher, index) in formData.target_match" :key="index" class="matcher-item">
                    <el-select v-model="matcher.Type" placeholder="类型" size="large" style="width: 100px">
                      <el-option label="等于" :value="1" />
                      <el-option label="正则" :value="2" />
                    </el-select>
                    <el-input v-model="matcher.Name" placeholder="标签名" size="large" style="width: 120px" />
                    <el-input v-model="matcher.Value" placeholder="标签值" size="large" style="width: 150px" />
                    <el-button type="text" @click="removeMatcher('target', index)">删除</el-button>
                  </div>
                  <el-button type="text" @click="addMatcher('target')" class="add-matcher-btn">
                    <el-icon><Plus /></el-icon>
                    添加目标匹配器
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item prop="equal_labels" label="匹配标签" class="form-item">
                <el-select
                  v-model="formData.equal_labels"
                  multiple
                  filterable
                  allow-create
                  placeholder="请选择或输入标签"
                  size="large"
                  clearable
                >
                  <el-option
                    v-for="label in commonLabels"
                    :key="label"
                    :label="label"
                    :value="label"
                  />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Clock /></el-icon>
              <span>时间配置</span>
            </div>

            <div class="form-row">
              <el-form-item prop="time_window" label="时间窗口" class="form-item">
                <div class="time-window-container">
                  <div class="switch-container">
                    <el-switch v-model="hasTimeWindow" @change="handleTimeWindowChange" size="large" />
                    <span class="form-tip">是否设置抑制时间窗口</span>
                  </div>
                  <div v-if="hasTimeWindow" class="time-window-config">
                    <el-date-picker
                      v-model="timeRange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="x"
                      size="large"
                    />
                  </div>
                </div>
              </el-form-item>
            </div>
          </div>
        </el-form>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { Plus, Filter, Setting, Clock } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"

// 接收抑制规则数据
const props = defineProps<{
  inhibitRules?: any[] // 从父组件传入的抑制规则数据
}>()

// 抑制规则相关类型
interface Matcher {
  Type: number
  Name: string
  Value: string
}

interface TimeRange {
  start: number
  end: number
}

interface InhibitRule {
  id: number
  name: string
  source_match: Matcher[]
  target_match: Matcher[]
  equal_labels: string[]
  time_window: TimeRange | null
  enabled: boolean
}

interface SaveInhibitRuleReq {
  id?: number
  name: string
  source_match: Matcher[]
  target_match: Matcher[]
  equal_labels: string[]
  time_window: TimeRange | null
  enabled: boolean
}

// 抑制规则是全局的，不需要工作空间ID

// 数据
const rules = ref<InhibitRule[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance | null>(null)
const hasTimeWindow = ref(false)
const timeRange = ref<[number, number] | null>(null)

// 常用标签
const commonLabels = ref([
  "instance", "job", "severity", "alertname", "service", "env", "cluster", "datacenter"
])

// 表单数据
const formData = ref<SaveInhibitRuleReq>({
  name: "",
  source_match: [],
  target_match: [],
  equal_labels: [],
  time_window: null,
  enabled: true
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  source_match: [{ required: true, message: "请添加源匹配器", trigger: "change" }],
  target_match: [{ required: true, message: "请添加目标匹配器", trigger: "change" }]
}

// 加载规则列表（全局抑制规则）
const loadRules = async () => {
  try {
    loading.value = true
    
    // 如果父组件传入了抑制规则数据，直接使用
    if (props.inhibitRules) {
      rules.value = props.inhibitRules
      return
    }
    
    // 否则使用模拟数据
    rules.value = [
      {
        id: 1,
        name: "维护窗口抑制",
        source_match: [{ Type: 1, Name: "severity", Value: "critical" }],
        target_match: [{ Type: 1, Name: "severity", Value: "warning" }],
        equal_labels: ["instance"],
        time_window: { start: 1640995200, end: 1641081600 },
        enabled: true
      },
      {
        id: 2,
        name: "测试环境抑制",
        source_match: [{ Type: 1, Name: "env", Value: "test" }],
        target_match: [{ Type: 1, Name: "env", Value: "prod" }],
        equal_labels: ["service"],
        time_window: null,
        enabled: false
      }
    ]
  } catch (error) {
    console.error("加载抑制规则失败:", error)
    ElMessage.error("加载抑制规则失败")
  } finally {
    loading.value = false
  }
}

// 添加匹配器
const addMatcher = (type: 'source' | 'target') => {
  const matcher: Matcher = { Type: 1, Name: '', Value: '' }
  if (type === 'source') {
    formData.value.source_match.push(matcher)
  } else {
    formData.value.target_match.push(matcher)
  }
}

// 删除匹配器
const removeMatcher = (type: 'source' | 'target', index: number) => {
  if (type === 'source') {
    formData.value.source_match.splice(index, 1)
  } else {
    formData.value.target_match.splice(index, 1)
  }
}

// 时间窗口变化
const handleTimeWindowChange = (val: string | number | boolean) => {
  const value = val as boolean
  if (!value) {
    formData.value.time_window = null
    timeRange.value = null
  }
}

// 添加规则
const handleAddRule = () => {
  isEdit.value = false
  formData.value = {
    name: "",
    source_match: [],
    target_match: [],
    equal_labels: [],
    time_window: null,
    enabled: true
  }
  hasTimeWindow.value = false
  timeRange.value = null
  dialogVisible.value = true
}

// 编辑规则
const handleEditRule = (rule: InhibitRule) => {
  isEdit.value = true
  formData.value = {
    id: rule.id,
    name: rule.name,
    source_match: [...rule.source_match],
    target_match: [...rule.target_match],
    equal_labels: [...rule.equal_labels],
    time_window: rule.time_window,
    enabled: rule.enabled
  }
  hasTimeWindow.value = !!rule.time_window
  if (rule.time_window) {
    timeRange.value = [rule.time_window.start * 1000, rule.time_window.end * 1000]
  }
  dialogVisible.value = true
}

// 切换规则状态
const handleToggleRule = async (rule: InhibitRule) => {
  try {
    // 这里应该调用真实的API
    // await saveInhibitRuleApi({ ...rule, enabled: rule.enabled })
    ElMessage.success(`抑制规则已${rule.enabled ? '启用' : '禁用'}`)
    await loadRules()
  } catch (error) {
    console.error("切换抑制规则状态失败:", error)
    ElMessage.error("操作失败")
  }
}

// 删除规则
const handleDeleteRule = async (rule: InhibitRule) => {
  try {
    // 这里应该调用真实的API
    // await deleteInhibitRuleApi({ id: rule.id })
    ElMessage.success("删除抑制规则成功")
    await loadRules()
  } catch (error) {
    console.error("删除抑制规则失败:", error)
    ElMessage.error("删除失败")
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 处理时间窗口
    if (hasTimeWindow.value && timeRange.value) {
      formData.value.time_window = {
        start: Math.floor(timeRange.value[0] / 1000),
        end: Math.floor(timeRange.value[1] / 1000)
      }
    } else {
      formData.value.time_window = null
    }
    
    // 这里应该调用真实的API
    // await saveInhibitRuleApi(formData.value)
    ElMessage.success(isEdit.value ? "更新抑制规则成功" : "创建抑制规则成功")
    dialogVisible.value = false
    await loadRules()
  } catch (error) {
    console.error("保存抑制规则失败:", error)
    ElMessage.error("保存失败")
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 格式化时间窗口
const formatTimeWindow = (timeWindow: TimeRange) => {
  if (!timeWindow) return '无'
  const start = new Date(timeWindow.start * 1000).toLocaleString()
  const end = new Date(timeWindow.end * 1000).toLocaleString()
  return `${start} - ${end}`
}

// 监听抑制规则数据变化
watch(() => props.inhibitRules, (newRules) => {
  if (newRules && Array.isArray(newRules) && newRules.length > 0) {
    rules.value = newRules
  } else {
    rules.value = []
  }
}, { immediate: true })

// 组件挂载时加载数据
onMounted(() => {
  loadRules()
})
</script>

<style lang="scss" scoped>
  .inhibit-rules-section {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      border-radius: 8px 8px 0 0;

      .header-info {
        h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .header-tip {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }

    .section-content {
      padding: 20px;

    .inhibit-rules-list {
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: #f8fafc;
        border: 2px dashed #d1d5db;
        border-radius: 8px;

        .empty-icon {
          margin-bottom: 16px;

          .el-icon {
            font-size: 48px;
            color: #9ca3af;
          }
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .empty-description {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }
      }
      .inhibit-rule-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #8b5cf6;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .rule-info {
            flex: 1;

            .rule-name {
              margin: 0 0 4px 0;
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
            }

            .rule-description {
              margin: 0;
              font-size: 14px;
              color: #6b7280;
              line-height: 1.4;
            }
          }

          .rule-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
        }

        .rule-details {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;

          .rule-labels,
          .rule-time {
            .label {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
            }

            .value {
              font-size: 14px;
              color: #1f2937;
              margin-left: 4px;
            }
          }
        }
      }
    }
  }

  .rule-form-container {
    padding: 20px;
    background: #ffffff;
    border-radius: 0;
    box-shadow: none;
    height: 100%;
    overflow-y: auto;
  }

  .rule-form {
    .form-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
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
        margin-bottom: 6px;
        font-size: 13px;
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

    .matchers-container {
      width: 100%;

      .matcher-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        padding: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }

      .add-matcher-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #3b82f6;
        font-weight: 500;
        margin-top: 8px;

        &:hover {
          color: #1d4ed8;
        }
      }
    }

    .time-window-container {
      .switch-container {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .time-window-config {
        margin-top: 10px;
        width: 100%;
      }
    }

    .form-tip {
      font-size: 12px;
      color: #6b7280;
    }
  }
}
</style>
