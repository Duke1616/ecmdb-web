<template>
  <div class="inhibit-rules-section">
    <div class="section-header">
      <div class="header-info">
        <h4>抑制规则</h4>
        <span class="header-tip">全局抑制规则，对所有工作空间生效</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAddRule"> 添加规则 </el-button>
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
          <el-button type="primary" :icon="Plus" @click="handleAddRule"> 添加抑制规则 </el-button>
        </div>

        <!-- 规则列表 -->
        <div v-for="rule in rules" :key="rule.id" class="inhibit-rule-card">
          <div class="card-header">
            <div class="header-left">
              <div class="rule-title">
                <h5 class="rule-name">{{ rule.name }}</h5>
                <div class="rule-meta">
                  <el-tag type="primary" size="small" class="type-tag"> 抑制规则 </el-tag>
                  <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" class="status-tag">
                    {{ rule.enabled ? "运行中" : "已停用" }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="header-right">
              <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" size="large" />
              <el-button type="primary" :icon="Edit" size="small" @click="handleEditRule(rule)"> 编辑 </el-button>
              <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteRule(rule.id)"> 删除 </el-button>
            </div>
          </div>

          <div class="card-content">
            <!-- 匹配器信息 -->
            <div class="matchers-grid">
              <!-- 源匹配器 -->
              <div class="matcher-group">
                <div class="matcher-header">
                  <el-icon class="matcher-icon"><ArrowRight /></el-icon>
                  <span class="matcher-title">源匹配器</span>
                </div>
                <div class="matcher-content">
                  <div v-if="rule.source_match.length === 0" class="empty-matcher">
                    <span class="empty-text">无匹配条件</span>
                  </div>
                  <div v-else class="matcher-list">
                    <div v-for="(matcher, index) in rule.source_match" :key="index" class="matcher-item">
                      <el-tag :type="matcher.Type === 1 ? 'primary' : 'warning'" size="small" class="matcher-type-tag">
                        {{ matcher.Type === 1 ? "等于" : "正则" }}
                      </el-tag>
                      <span class="matcher-name">{{ matcher.Name }}</span>
                      <span class="matcher-value">{{ matcher.Value }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 目标匹配器 -->
              <div class="matcher-group">
                <div class="matcher-header">
                  <el-icon class="matcher-icon"><ArrowLeft /></el-icon>
                  <span class="matcher-title">目标匹配器</span>
                </div>
                <div class="matcher-content">
                  <div v-if="rule.target_match.length === 0" class="empty-matcher">
                    <span class="empty-text">无匹配条件</span>
                  </div>
                  <div v-else class="matcher-list">
                    <div v-for="(matcher, index) in rule.target_match" :key="index" class="matcher-item">
                      <el-tag :type="matcher.Type === 1 ? 'primary' : 'warning'" size="small" class="matcher-type-tag">
                        {{ matcher.Type === 1 ? "等于" : "正则" }}
                      </el-tag>
                      <span class="matcher-name">{{ matcher.Name }}</span>
                      <span class="matcher-value">{{ matcher.Value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 匹配标签 -->
            <div v-if="rule.equal_labels && rule.equal_labels.length > 0" class="labels-section">
              <div class="labels-header">
                <el-icon class="labels-icon"><PriceTag /></el-icon>
                <span class="labels-title">匹配标签</span>
              </div>
              <div class="labels-content">
                <el-tag v-for="label in rule.equal_labels" :key="label" type="info" size="small" class="label-tag">
                  {{ label }}
                </el-tag>
              </div>
            </div>

            <!-- 时间窗口 -->
            <div
              v-if="rule.time_window && (rule.time_window.start !== 0 || rule.time_window.end !== 0)"
              class="time-window-section"
            >
              <div class="time-window-header">
                <el-icon class="time-window-icon"><Clock /></el-icon>
                <span class="time-window-title">时间窗口</span>
              </div>
              <div class="time-window-content">
                <span class="time-window-text">{{ formatTimeWindow(rule.time_window) }}</span>
              </div>
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
              <el-form-item prop="source_matchers" label="源匹配器" class="form-item">
                <div class="matchers-container">
                  <div v-for="(matcher, index) in formData.source_matchers" :key="index" class="matcher-item">
                    <el-select v-model="matcher.Type" placeholder="类型" size="large" class="matcher-type">
                      <el-option label="等于" :value="1" />
                      <el-option label="正则" :value="2" />
                    </el-select>
                    <el-input v-model="matcher.Name" placeholder="标签名" size="large" class="matcher-name" />
                    <el-input v-model="matcher.Value" placeholder="标签值" size="large" class="matcher-value" />
                    <el-button type="text" @click="removeMatcher('source', index)" class="matcher-remove">
                      删除
                    </el-button>
                  </div>
                  <el-button type="text" @click="addMatcher('source')" class="add-matcher-btn">
                    <el-icon><Plus /></el-icon>
                    添加源匹配器
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item prop="target_matchers" label="目标匹配器" class="form-item">
                <div class="matchers-container">
                  <div v-for="(matcher, index) in formData.target_matchers" :key="index" class="matcher-item">
                    <el-select v-model="matcher.Type" placeholder="类型" size="large" class="matcher-type">
                      <el-option label="等于" :value="1" />
                      <el-option label="正则" :value="2" />
                    </el-select>
                    <el-input v-model="matcher.Name" placeholder="标签名" size="large" class="matcher-name" />
                    <el-input v-model="matcher.Value" placeholder="标签值" size="large" class="matcher-value" />
                    <el-button type="text" @click="removeMatcher('target', index)" class="matcher-remove">
                      删除
                    </el-button>
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
                <LabelSelector
                  v-model="formData.equal_labels"
                  placeholder="输入标签名称，按回车添加"
                  :suggested-labels="commonLabels"
                />
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Clock /></el-icon>
              <span>时间配置</span>
            </div>

            <div class="form-row">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item prop="time_window" label="时间窗口" class="form-item">
                    <div class="time-window-container">
                      <div class="switch-container">
                        <el-switch v-model="hasTimeWindow" @change="handleTimeWindowChange" size="large" />
                        <span class="form-tip">是否设置抑制时间窗口</span>
                      </div>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="hasTimeWindow">
                  <el-form-item label="时间范围" class="form-item">
                    <el-date-picker
                      v-model="timeRange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="x"
                      size="large"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
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
import { Plus, Filter, Setting, Clock, ArrowRight, Edit, Delete, ArrowLeft, PriceTag } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import LabelSelector from "@@/components/LabelSelector/index.vue"
import { saveInhibitRuleApi } from "@/api/noise"
import type { SaveInhibitRuleReq as ApiSaveInhibitRuleReq } from "@/api/noise/types"

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
const commonLabels = ref(["instance", "job", "severity", "alertname", "service", "env", "cluster", "datacenter"])

// 表单数据
const formData = ref<ApiSaveInhibitRuleReq>({
  name: "",
  source_matchers: [],
  target_matchers: [],
  equal_labels: [],
  time_window: null,
  enabled: true
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  source_matchers: [{ required: true, message: "请添加源匹配器", trigger: "change" }],
  target_matchers: [{ required: true, message: "请添加目标匹配器", trigger: "change" }]
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
const addMatcher = (type: "source" | "target") => {
  const matcher: Matcher = { Type: 1, Name: "", Value: "" }
  if (type === "source") {
    formData.value.source_matchers.push(matcher)
  } else {
    formData.value.target_matchers.push(matcher)
  }
}

// 删除匹配器
const removeMatcher = (type: "source" | "target", index: number) => {
  if (type === "source") {
    formData.value.source_matchers.splice(index, 1)
  } else {
    formData.value.target_matchers.splice(index, 1)
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
    source_matchers: [],
    target_matchers: [],
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
    source_matchers: [...rule.source_match],
    target_matchers: [...rule.target_match],
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
    ElMessage.success(`抑制规则已${rule.enabled ? "启用" : "禁用"}`)
    await loadRules()
  } catch (error) {
    console.error("切换抑制规则状态失败:", error)
    ElMessage.error("操作失败")
  }
}

// 删除规则
const handleDeleteRule = async (id: number) => {
  console.log(id)
  try {
    // 这里应该调用真实的API
    // await deleteInhibitRuleApi({ id: id })
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

    // 调用真实的API
    await saveInhibitRuleApi(formData.value)
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
  if (!timeWindow) return "无"
  const start = new Date(timeWindow.start * 1000).toLocaleString()
  const end = new Date(timeWindow.end * 1000).toLocaleString()
  return `${start} - ${end}`
}

// 监听抑制规则数据变化
watch(
  () => props.inhibitRules,
  (newRules) => {
    if (newRules && Array.isArray(newRules) && newRules.length > 0) {
      rules.value = newRules
    } else {
      rules.value = []
    }
  },
  { immediate: true }
)

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
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;

        &:last-child {
          margin-bottom: 0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;

          .header-left {
            .rule-title {
              .rule-name {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.4;
              }

              .rule-meta {
                display: flex;
                align-items: center;
                gap: 8px;

                .type-tag {
                  font-weight: 500;
                }

                .status-tag {
                  font-weight: 500;
                }
              }
            }
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
        }

        .card-content {
          padding: 20px;

          // 匹配器网格
          .matchers-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;

            .matcher-group {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;

              .matcher-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-bottom: 1px solid #d1d5db;

                .matcher-icon {
                  font-size: 16px;
                  color: #3b82f6;
                }

                .matcher-title {
                  font-size: 14px;
                  font-weight: 600;
                  color: #374151;
                }
              }

              .matcher-content {
                padding: 16px;

                .empty-matcher {
                  text-align: center;
                  padding: 20px 0;
                  color: #9ca3af;
                  font-size: 14px;
                }

                .matcher-list {
                  .matcher-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-bottom: 8px;

                    &:last-child {
                      margin-bottom: 0;
                    }

                    .matcher-type-tag {
                      font-size: 11px;
                      font-weight: 600;
                      border-radius: 4px;
                      flex-shrink: 0;
                    }

                    .matcher-name {
                      font-size: 13px;
                      font-weight: 600;
                      color: #374151;
                      min-width: 60px;
                      flex-shrink: 0;
                    }

                    .matcher-value {
                      font-size: 13px;
                      color: #6b7280;
                      flex: 1;
                      word-break: break-all;
                    }
                  }
                }
              }
            }
          }

          // 匹配标签
          .labels-section {
            margin-bottom: 20px;
            padding: 16px;
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;

            .labels-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;

              .labels-icon {
                font-size: 16px;
                color: #f59e0b;
              }

              .labels-title {
                font-size: 14px;
                font-weight: 600;
                color: #92400e;
              }
            }

            .labels-content {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;

              .label-tag {
                font-size: 12px;
                border-radius: 4px;
                background: #ffffff;
                border-color: #fbbf24;
                color: #92400e;
              }
            }
          }

          // 时间窗口
          .time-window-section {
            padding: 16px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;

            .time-window-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;

              .time-window-icon {
                font-size: 16px;
                color: #3b82f6;
              }

              .time-window-title {
                font-size: 14px;
                font-weight: 600;
                color: #1e40af;
              }
            }

            .time-window-content {
              .time-window-text {
                font-size: 14px;
                color: #1e40af;
                font-weight: 500;
              }
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
        gap: 12px;
        margin-bottom: 12px;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;

        .matcher-type {
          flex: 0 0 100px;
          min-width: 100px;
        }

        .matcher-name {
          flex: 0 0 150px;
          min-width: 150px;
        }

        .matcher-value {
          flex: 1;
          min-width: 200px;
        }

        .matcher-remove {
          flex: 0 0 auto;
          margin-left: auto;
        }
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
