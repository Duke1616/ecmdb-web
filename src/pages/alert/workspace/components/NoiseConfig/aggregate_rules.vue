<template>
  <div class="aggregate-rules-section">
    <div class="section-header">
      <div class="header-info">
        <h4>分组聚合规则</h4>
        <span class="header-tip">每个工作空间只能有一个聚合规则</span>
      </div>
      <el-button type="primary" :icon="Setting" @click="handleAddRule" :disabled="rules.length > 0">
        {{ rules.length > 0 ? "已有规则" : "添加规则" }}
      </el-button>
    </div>
    <div class="section-content">
      <div class="aggregate-rules-list" v-loading="loading">
        <!-- 空状态 -->
        <div v-if="!loading && rules.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><Setting /></el-icon>
          </div>
          <h4 class="empty-title">暂无聚合规则</h4>
          <p class="empty-description">为当前工作空间配置告警聚合规则，减少重复告警</p>
          <el-button type="primary" :icon="Setting" @click="handleAddRule"> 添加聚合规则 </el-button>
        </div>

        <!-- 规则列表 -->
        <div v-for="rule in rules" :key="rule.id" class="aggregate-rule-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-left">
              <div class="rule-meta">
                <el-tag :type="rule.type === 0 ? 'primary' : 'warning'" size="small" class="type-tag">
                  {{ rule.type === 0 ? "按标签聚合" : "按时间聚合" }}
                </el-tag>
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" class="status-tag">
                  {{ rule.enabled ? "运行中" : "已停用" }}
                </el-tag>
              </div>
            </div>
            <div class="header-right">
              <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" size="large" />
              <el-button type="primary" :icon="Edit" size="small" @click="handleEditRule(rule)"> 编辑 </el-button>
              <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteRule(rule)"> 删除 </el-button>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 标签区域 -->
            <div class="info-section">
              <div class="section-title">
                <el-icon><PriceTag /></el-icon>
                <span>聚合标签</span>
              </div>
              <div class="section-content">
                <div v-if="rule.labels && rule.labels.length > 0" class="tags-container">
                  <el-tag v-for="label in rule.labels" :key="label" type="info" size="small" class="label-tag">
                    {{ label }}
                  </el-tag>
                </div>
                <div v-else class="empty-state">
                  <el-icon><Warning /></el-icon>
                  <span>未配置聚合标签</span>
                </div>
              </div>
            </div>

            <!-- 时间配置区域 -->
            <div class="info-section">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                <span>时间配置</span>
              </div>
              <div class="section-content">
                <div class="timing-cards">
                  <div class="timing-card">
                    <div class="timing-value">{{ rule.group_wait }}</div>
                    <div class="timing-label">等待时间(秒)</div>
                  </div>
                  <div class="timing-card">
                    <div class="timing-value">{{ rule.group_interval }}</div>
                    <div class="timing-label">组间隔(秒)</div>
                  </div>
                  <div class="timing-card">
                    <div class="timing-value">{{ rule.repeat_interval }}</div>
                    <div class="timing-label">重复间隔(秒)</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 其他配置区域 -->
            <div class="info-section">
              <div class="section-title">
                <el-icon><Operation /></el-icon>
                <span>其他配置</span>
              </div>
              <div class="section-content">
                <div class="config-grid">
                  <div class="config-item">
                    <div class="config-label">
                      <el-icon><DataAnalysis /></el-icon>
                      <span>区分数据源</span>
                    </div>
                    <el-tag :type="rule.is_diff_data_source ? 'success' : 'info'" size="small">
                      {{ rule.is_diff_data_source ? "是" : "否" }}
                    </el-tag>
                  </div>
                  <div class="config-item">
                    <div class="config-label">
                      <el-icon><Document /></el-icon>
                      <span>通知模板</span>
                    </div>
                    <span class="config-value">#{{ rule.template_id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则抽屉 -->
    <Drawer
      v-model="dialogVisible"
      :title="isEdit ? '编辑聚合规则' : '添加聚合规则'"
      :subtitle="isEdit ? '修改聚合规则配置' : '为工作空间配置告警聚合规则'"
      :header-icon="Setting"
      size="600px"
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
              <span>聚合配置</span>
            </div>

            <div class="form-row">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item prop="type" label="聚合类型" class="form-item">
                    <el-radio-group v-model="formData.type" size="large">
                      <el-radio :label="0">按标签聚合</el-radio>
                      <el-radio :label="1">按时间聚合</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item prop="is_diff_data_source" label="区分数据源" class="form-item">
                    <div class="switch-container">
                      <el-switch v-model="formData.is_diff_data_source" size="large" />
                      <span class="form-tip">是否根据数据源进行分组</span>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div class="form-row">
              <el-form-item prop="labels" label="聚合标签" class="form-item">
                <div class="labels-container">
                  <!-- 标签输入区域 -->
                  <div class="labels-input-wrapper">
                    <el-input
                      v-model="labelInput"
                      placeholder="输入标签名称，按回车添加"
                      size="large"
                      class="label-input"
                      @keyup.enter="addLabel"
                      @blur="addLabel"
                    >
                      <template #suffix>
                        <el-button
                          type="primary"
                          size="small"
                          :icon="Plus"
                          @click="addLabel"
                          :disabled="!labelInput.trim()"
                        >
                          添加
                        </el-button>
                      </template>
                    </el-input>
                  </div>

                  <!-- 标签显示区域 -->
                  <div class="labels-display" v-if="formData.labels && formData.labels.length > 0">
                    <div class="labels-header">
                      <span class="labels-count">已选择 {{ formData.labels.length }} 个标签</span>
                      <el-button type="danger" size="small" :icon="Delete" @click="clearAllLabels" text>
                        清空
                      </el-button>
                    </div>
                    <div class="labels-list">
                      <el-tag
                        v-for="(label, index) in formData.labels"
                        :key="index"
                        closable
                        @close="removeLabel(index)"
                        class="label-item"
                        type="info"
                        effect="light"
                      >
                        {{ label }}
                      </el-tag>
                    </div>
                  </div>

                  <!-- 推荐标签区域 -->
                  <div class="suggested-labels" v-if="commonLabels.length > 0">
                    <div class="suggested-header">
                      <el-icon><Star /></el-icon>
                      <span>推荐标签</span>
                    </div>
                    <div class="suggested-list">
                      <el-tag
                        v-for="label in commonLabels"
                        :key="label"
                        @click="addRecommendedLabel(label)"
                        class="suggested-tag"
                        effect="plain"
                      >
                        {{ label }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Clock /></el-icon>
              <span>时间配置</span>
            </div>

            <div class="timing-config-row">
              <div class="timing-config-item">
                <div class="timing-label">等待时间</div>
                <div class="timing-input-wrapper">
                  <input
                    v-model.number="formData.group_wait"
                    type="number"
                    class="timing-input"
                    :min="1"
                    :max="3600"
                    @input="validateTime('group_wait', 1, 3600)"
                  />
                  <span class="timing-unit">秒</span>
                </div>
              </div>

              <div class="timing-config-item">
                <div class="timing-label">组间隔</div>
                <div class="timing-input-wrapper">
                  <input
                    v-model.number="formData.group_interval"
                    type="number"
                    class="timing-input"
                    :min="1"
                    :max="86400"
                    @input="validateTime('group_interval', 1, 86400)"
                  />
                  <span class="timing-unit">秒</span>
                </div>
              </div>

              <div class="timing-config-item">
                <div class="timing-label">重复间隔</div>
                <div class="timing-input-wrapper">
                  <input
                    v-model.number="formData.repeat_interval"
                    type="number"
                    class="timing-input"
                    :min="1"
                    :max="86400"
                    @input="validateTime('repeat_interval', 1, 86400)"
                  />
                  <span class="timing-unit">秒</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Bell /></el-icon>
              <span>通知配置</span>
            </div>

            <div class="form-row">
              <el-form-item prop="template_id" label="通知模板" class="form-item">
                <el-input-number
                  v-model="formData.template_id"
                  :min="1"
                  controls-position="right"
                  size="large"
                  style="width: 200px"
                />
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
import {
  Setting,
  Clock,
  Bell,
  Edit,
  Delete,
  PriceTag,
  Warning,
  Operation,
  DataAnalysis,
  Document,
  Plus,
  Star
} from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { saveAggregateRuleApi, deleteAggregateRuleApi } from "@/api/aggregate"
import type { CreateAggregateGroupRuleReq, AggregateGroupRule } from "@/api/aggregate/types"

// 接收工作空间ID和聚合规则数据
const props = defineProps<{
  workspaceId: number
  aggregateRule?: any // 从父组件传入的聚合规则数据
}>()

// 定义事件
const emit = defineEmits<{
  refresh: [] // 通知父组件刷新数据
}>()

// 数据
const rules = ref<AggregateGroupRule[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance | null>(null)

// 常用标签
const commonLabels = ref(["instance", "job", "severity", "alertname", "service", "env", "cluster", "datacenter"])

// 表单数据
const formData = ref<CreateAggregateGroupRuleReq>({
  type: 0,
  labels: [],
  workspace_id: props.workspaceId,
  is_diff_data_source: false,
  matchers: [],
  group_wait: 30,
  group_interval: 300,
  repeat_interval: 3600,
  template_id: 1
})

// 标签输入
const labelInput = ref("")

// 添加标签
const addLabel = () => {
  const label = labelInput.value.trim()
  if (label && !formData.value.labels.includes(label)) {
    formData.value.labels.push(label)
    labelInput.value = ""
  }
}

// 添加推荐标签
const addRecommendedLabel = (label: string) => {
  if (!formData.value.labels.includes(label)) {
    formData.value.labels.push(label)
  }
}

// 移除标签
const removeLabel = (index: number) => {
  if (formData.value.labels) {
    formData.value.labels.splice(index, 1)
  }
}

// 清空所有标签
const clearAllLabels = () => {
  formData.value.labels = []
}

// 表单验证规则
const formRules: FormRules = {
  type: [{ required: true, message: "请选择聚合类型", trigger: "change" }],
  labels: [{ required: true, message: "请选择聚合标签", trigger: "change" }],
  group_wait: [{ required: true, message: "请输入等待时间", trigger: "blur" }],
  group_interval: [{ required: true, message: "请输入组间隔", trigger: "blur" }],
  repeat_interval: [{ required: true, message: "请输入重复间隔", trigger: "blur" }],
  template_id: [{ required: true, message: "请输入通知模板ID", trigger: "blur" }]
}

// 加载规则列表
const loadRules = async () => {
  try {
    loading.value = true

    // 如果父组件传入了聚合规则数据，直接使用
    if (props.aggregateRule && props.aggregateRule.id) {
      const ruleWithEnabled = {
        ...props.aggregateRule,
        enabled: props.aggregateRule.enabled ?? true
      }
      rules.value = [ruleWithEnabled]
    } else {
      // 如果没有数据，显示空状态
      rules.value = []
    }
  } catch (error) {
    console.error("加载聚合规则失败:", error)
    ElMessage.error("加载聚合规则失败")
  } finally {
    loading.value = false
  }
}

// 添加规则
const handleAddRule = () => {
  // 检查是否已有规则
  if (rules.value.length > 0) {
    ElMessage.warning("每个工作空间只能有一个聚合规则，请编辑现有规则")
    return
  }

  isEdit.value = false
  formData.value = {
    type: 0,
    labels: [],
    workspace_id: props.workspaceId,
    is_diff_data_source: false,
    matchers: [],
    group_wait: 30,
    group_interval: 300,
    repeat_interval: 3600,
    template_id: 1
  }
  dialogVisible.value = true
}

// 编辑规则
const handleEditRule = (rule: any) => {
  isEdit.value = true
  formData.value = {
    id: rule.id,
    type: rule.type,
    labels: [...(rule.labels || [])],
    workspace_id: props.workspaceId,
    is_diff_data_source: rule.is_diff_data_source || false,
    matchers: [...(rule.matchers || [])],
    group_wait: rule.group_wait || 30,
    group_interval: rule.group_interval || 300,
    repeat_interval: rule.repeat_interval || 3600,
    template_id: rule.template_id || 1
  }
  dialogVisible.value = true
}

// 切换规则状态
const handleToggleRule = async (rule: any) => {
  try {
    const updateData: CreateAggregateGroupRuleReq = {
      id: rule.id,
      type: rule.type,
      labels: rule.labels,
      workspace_id: rule.workspace_id,
      is_diff_data_source: rule.is_diff_data_source,
      matchers: rule.matchers,
      group_wait: rule.group_wait,
      group_interval: rule.group_interval,
      repeat_interval: rule.repeat_interval,
      template_id: rule.template_id
    }

    await saveAggregateRuleApi(updateData)
    ElMessage.success(`聚合规则已${rule.enabled ? "启用" : "禁用"}`)
    // 通知父组件刷新数据
    emit("refresh")
  } catch (error) {
    console.error("切换聚合规则状态失败:", error)
    ElMessage.error("操作失败")
  }
}

// 删除规则
const handleDeleteRule = async (rule: any) => {
  try {
    await deleteAggregateRuleApi({ id: rule.id })
    ElMessage.success("删除聚合规则成功")
    // 通知父组件刷新数据
    emit("refresh")
  } catch (error) {
    console.error("删除聚合规则失败:", error)
    ElMessage.error("删除失败")
  }
}

// 时间验证方法
const validateTime = (field: string, min: number, max: number) => {
  const currentValue = formData.value[field as keyof typeof formData.value] as number
  if (currentValue < min) {
    ;(formData.value as any)[field] = min
  } else if (currentValue > max) {
    ;(formData.value as any)[field] = max
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await saveAggregateRuleApi(formData.value)
    ElMessage.success(isEdit.value ? "更新聚合规则成功" : "创建聚合规则成功")
    dialogVisible.value = false
    // 通知父组件刷新数据
    emit("refresh")
  } catch (error) {
    console.error("保存聚合规则失败:", error)
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

// 监听聚合规则数据变化
watch(
  () => props.aggregateRule,
  (newRule) => {
    if (newRule && newRule.id) {
      // 为规则添加默认的 enabled 字段
      const ruleWithEnabled = {
        ...newRule,
        enabled: newRule.enabled ?? true
      }
      rules.value = [ruleWithEnabled]
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
.aggregate-rules-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

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
    .aggregate-rules-list {
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
      .aggregate-rule-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        // 移除过渡动画
        margin-bottom: 16px;

        // 移除悬停效果

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;

          .header-left {
            .rule-meta {
              display: flex;
              gap: 8px;
              align-items: center;

              .type-tag {
                font-weight: 600;
                border-radius: 6px;
              }

              .status-tag {
                font-weight: 600;
                border-radius: 6px;
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
          padding: 16px 20px;

          .info-section {
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .section-title {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #f3f4f6;

              .el-icon {
                margin-right: 8px;
                font-size: 16px;
                color: #3b82f6;
              }

              span {
                font-size: 14px;
                font-weight: 700;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
            }

            .section-content {
              .tags-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;

                .label-tag {
                  font-weight: 500;
                  border-radius: 6px;
                  padding: 4px 12px;
                }
              }

              .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                color: #92400e;
                font-size: 14px;
                font-weight: 500;

                .el-icon {
                  margin-right: 8px;
                  font-size: 16px;
                }
              }

              .timing-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;

                .timing-card {
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 16px;
                  text-align: center;
                  // 移除过渡动画

                  // 移除悬停效果

                  .timing-value {
                    font-size: 28px;
                    font-weight: 800;
                    color: #1f2937;
                    margin-bottom: 4px;
                    line-height: 1;
                  }

                  .timing-label {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                }
              }

              .config-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;

                .config-item {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 12px;
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                  // 移除过渡动画

                  // 移除悬停效果

                  .config-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    .el-icon {
                      font-size: 16px;
                      color: #6b7280;
                    }

                    span {
                      font-size: 14px;
                      font-weight: 600;
                      color: #374151;
                    }
                  }

                  .config-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1f2937;
                    font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
                    background: #e5e7eb;
                    padding: 4px 8px;
                    border-radius: 4px;
                  }
                }
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

      &.timing-row {
        display: flex;
        gap: 16px;
        margin-bottom: 0;

        .timing-item {
          flex: 1;
        }
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
    }

    .timing-config-row {
      display: flex;
      gap: 16px;
      margin-bottom: 0;

      .timing-config-item {
        flex: 1;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px 16px;
        text-align: center;
        position: relative;

        .timing-label {
          font-size: 14px;
          color: #374151;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .timing-input-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          .timing-input {
            width: 100px;
            height: 40px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            background: #ffffff;
            outline: none;

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }

            &[type="number"] {
              -moz-appearance: textfield;
            }
          }

          .timing-unit {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
        }
      }
    }

    .labels-container {
      width: 100%;

      .labels-input-wrapper {
        margin-bottom: 16px;

        .label-input {
          :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;

            &:hover {
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }

            &.is-focus {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }
      }

      .labels-display {
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        margin-bottom: 16px;

        .labels-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .labels-count {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
        }

        .labels-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;

          .label-item {
            border-radius: 6px;
            background: #eff6ff;
            border-color: #bfdbfe;
            color: #1e40af;
            font-size: 13px;
            padding: 4px 8px;
            max-width: 100%;
            word-break: break-word;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .el-tag__close {
              color: #6b7280;
              margin-left: 4px;

              &:hover {
                background: #dbeafe;
                color: #1e40af;
              }
            }
          }
        }
      }

      .suggested-labels {
        padding: 16px;
        background: #fef3c7;
        border-radius: 8px;
        border: 1px solid #fbbf24;

        .suggested-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;

          .el-icon {
            margin-right: 6px;
            color: #f59e0b;
            font-size: 16px;
          }

          span {
            font-size: 14px;
            color: #92400e;
            font-weight: 500;
          }
        }

        .suggested-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;

          .suggested-tag {
            border-radius: 6px;
            background: #ffffff;
            border-color: #fbbf24;
            color: #92400e;
            font-size: 13px;
            padding: 4px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            max-width: 100%;
            word-break: break-word;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover {
              background: #fef3c7;
              border-color: #f59e0b;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
          }
        }
      }
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

    :deep(.el-input-number__wrapper) {
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
    gap: 12px;
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-tip {
    font-size: 12px;
    color: #6b7280;
  }

  .form-unit {
    font-size: 14px;
    color: #6b7280;
  }
}
</style>
