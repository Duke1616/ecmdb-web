<template>
  <CollapsibleSection title="静默规则" tip="临时静默特定告警，避免在维护期间产生噪音" :default-collapsed="true">
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="handleAddRule"> 添加规则 </el-button>
    </template>

    <div class="silence-rules-list" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Bell /></el-icon>
        </div>
        <h4 class="empty-title">暂无规则</h4>
        <p class="empty-description">创建静默规则，在维护期间临时停止特定告警通知</p>
        <el-button type="primary" :icon="Plus" @click="handleAddRule"> 添加静默规则 </el-button>
      </div>

      <!-- 规则列表 -->
      <div v-for="rule in rules" :key="rule.id" class="silence-rule-card">
        <div class="card-header">
          <div class="header-left">
            <div class="rule-title">
              <h5 class="rule-name">{{ rule.name }}</h5>
              <div class="rule-meta">
                <el-tag type="warning" size="small" class="type-tag"> 静默规则 </el-tag>
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" class="status-tag">
                  {{ rule.enabled ? "运行中" : "已停用" }}
                </el-tag>
                <el-tag v-if="rule.is_active" type="danger" size="small" class="active-tag"> 活跃中 </el-tag>
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
          <!-- 匹配条件 -->
          <div class="matchers-section">
            <div class="section-header">
              <el-icon class="section-icon"><Filter /></el-icon>
              <span>匹配条件</span>
            </div>
            <div class="section-content">
              <div v-if="rule.matchers && rule.matchers.length > 0" class="matchers-list">
                <div v-for="(matcher, index) in rule.matchers" :key="index" class="matcher-item">
                  <el-tag :type="matcher.Type === 1 ? 'primary' : 'warning'" size="small" class="matcher-type-tag">
                    {{ matcher.Type === 1 ? "等于" : "正则" }}
                  </el-tag>
                  <span class="matcher-name">{{ matcher.Name }}</span>
                  <span class="matcher-value">{{ matcher.Value }}</span>
                </div>
              </div>
              <div v-else class="empty-matcher">
                <span class="empty-text">无匹配条件</span>
              </div>
            </div>
          </div>

          <!-- 静默时间 -->
          <div class="silence-time-section">
            <div class="section-header">
              <el-icon class="section-icon"><Clock /></el-icon>
              <span>静默时间</span>
            </div>
            <div class="section-content">
              <div class="time-info">
                <div class="time-item">
                  <span class="time-label">开始时间：</span>
                  <span class="time-value">{{ formatTime(rule.start_time) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">结束时间：</span>
                  <span class="time-value">{{ formatTime(rule.end_time) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">剩余时间：</span>
                  <span class="time-value" :class="{ 'time-warning': rule.is_active && getRemainingTime(rule) < 3600 }">
                    {{ getRemainingTimeText(rule) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 创建信息 -->
          <div class="create-info-section">
            <div class="section-header">
              <el-icon class="section-icon"><User /></el-icon>
              <span>创建信息</span>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">创建人：</span>
                  <span class="info-value">{{ rule.created_by || "系统管理员" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间：</span>
                  <span class="info-value">{{ formatTime(rule.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">备注：</span>
                  <span class="info-value">{{ rule.comment || "无" }}</span>
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
      :title="isEdit ? '编辑静默规则' : '添加静默规则'"
      :subtitle="isEdit ? '修改静默规则配置' : '创建新的静默规则，临时停止特定告警通知'"
      :header-icon="Bell"
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
                <el-input v-model="formData.name" placeholder="请输入静默规则名称" size="large" clearable />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item prop="comment" label="备注说明" class="form-item">
                <el-input
                  v-model="formData.comment"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注说明（可选）"
                  size="large"
                />
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Filter /></el-icon>
              <span>匹配条件</span>
            </div>

            <div class="form-row">
              <el-form-item prop="matchers" label="匹配器" class="form-item">
                <div class="matchers-container">
                  <div v-for="(matcher, index) in formData.matchers" :key="index" class="matcher-item">
                    <el-select v-model="matcher.Type" placeholder="类型" size="large" class="matcher-type">
                      <el-option label="等于" :value="1" />
                      <el-option label="正则" :value="2" />
                    </el-select>
                    <el-input v-model="matcher.Name" placeholder="标签名" size="large" class="matcher-name" />
                    <el-input v-model="matcher.Value" placeholder="标签值" size="large" class="matcher-value" />
                    <el-button type="text" @click="removeMatcher(index)" class="matcher-remove"> 删除 </el-button>
                  </div>
                  <el-button type="text" @click="addMatcher" class="add-matcher-btn">
                    <el-icon><Plus /></el-icon>
                    添加匹配器
                  </el-button>
                </div>
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon"><Clock /></el-icon>
              <span>静默时间</span>
            </div>

            <div class="form-row">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item prop="start_time" label="开始时间" class="form-item">
                    <el-date-picker
                      v-model="formData.start_time"
                      type="datetime"
                      placeholder="选择开始时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="x"
                      size="large"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item prop="end_time" label="结束时间" class="form-item">
                    <el-date-picker
                      v-model="formData.end_time"
                      type="datetime"
                      placeholder="选择结束时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="x"
                      size="large"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div class="form-row">
              <el-form-item label="快速选择" class="form-item">
                <div class="quick-time-buttons">
                  <el-button size="small" @click="setQuickTime(1)">1小时</el-button>
                  <el-button size="small" @click="setQuickTime(6)">6小时</el-button>
                  <el-button size="small" @click="setQuickTime(24)">1天</el-button>
                  <el-button size="small" @click="setQuickTime(72)">3天</el-button>
                  <el-button size="small" @click="setQuickTime(168)">1周</el-button>
                </div>
              </el-form-item>
            </div>
          </div>
        </el-form>
      </div>
    </Drawer>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { Plus, Bell, Filter, Clock, User, Edit, Delete, Setting } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import CollapsibleSection from "@@/components/CollapsibleSection/index.vue"

// 静默规则接口
interface SilenceRule {
  id: number
  name: string
  matchers: Matcher[]
  start_time: number
  end_time: number
  enabled: boolean
  is_active: boolean
  created_by?: string
  created_at: number
  comment?: string
}

interface Matcher {
  Type: number
  Name: string
  Value: string
}

// 接收静默规则数据
const props = defineProps<{
  silenceRules?: SilenceRule[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

// 数据
const rules = ref<SilenceRule[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance | null>(null)

// 表单数据
const formData = ref<SilenceRule>({
  id: 0,
  name: "",
  matchers: [],
  start_time: 0,
  end_time: 0,
  enabled: true,
  is_active: false,
  created_by: "",
  created_at: 0,
  comment: ""
})

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  matchers: [{ required: true, message: "请至少添加一个匹配器", trigger: "change" }],
  start_time: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  end_time: [{ required: true, message: "请选择结束时间", trigger: "change" }]
}

// 加载规则
const loadRules = async () => {
  try {
    loading.value = true

    // 如果父组件传入了静默规则数据，直接使用
    if (props.silenceRules) {
      rules.value = props.silenceRules
      return
    }

    // 否则使用模拟数据
    rules.value = [
      {
        id: 1,
        name: "维护窗口静默",
        matchers: [
          { Type: 1, Name: "severity", Value: "critical" },
          { Type: 1, Name: "service", Value: "database" }
        ],
        start_time: Date.now(),
        end_time: Date.now() + 2 * 60 * 60 * 1000, // 2小时后
        enabled: true,
        is_active: true,
        created_by: "admin",
        created_at: Date.now() - 30 * 60 * 1000, // 30分钟前
        comment: "数据库维护期间静默关键告警"
      },
      {
        id: 2,
        name: "测试环境静默",
        matchers: [{ Type: 1, Name: "env", Value: "test" }],
        start_time: Date.now() + 24 * 60 * 60 * 1000, // 明天
        end_time: Date.now() + 48 * 60 * 60 * 1000, // 后天
        enabled: false,
        is_active: false,
        created_by: "admin",
        created_at: Date.now() - 2 * 60 * 60 * 1000, // 2小时前
        comment: "测试环境告警静默"
      }
    ]
  } catch (error) {
    console.error("加载静默规则失败:", error)
    ElMessage.error("加载静默规则失败")
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return "未设置"
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

// 获取剩余时间（秒）
const getRemainingTime = (rule: SilenceRule) => {
  if (!rule.is_active) return 0
  const now = Date.now()
  const remaining = rule.end_time - now
  return Math.max(0, Math.floor(remaining / 1000))
}

// 获取剩余时间文本
const getRemainingTimeText = (rule: SilenceRule) => {
  if (!rule.is_active) return "未激活"
  const remaining = getRemainingTime(rule)
  if (remaining <= 0) return "已过期"

  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
}

// 添加匹配器
const addMatcher = () => {
  formData.value.matchers.push({
    Type: 1,
    Name: "",
    Value: ""
  })
}

// 删除匹配器
const removeMatcher = (index: number) => {
  formData.value.matchers.splice(index, 1)
}

// 快速设置时间
const setQuickTime = (hours: number) => {
  const now = Date.now()
  formData.value.start_time = now
  formData.value.end_time = now + hours * 60 * 60 * 1000
}

// 添加规则
const handleAddRule = () => {
  isEdit.value = false
  formData.value = {
    id: 0,
    name: "",
    matchers: [],
    start_time: 0,
    end_time: 0,
    enabled: true,
    is_active: false,
    created_by: "",
    created_at: 0,
    comment: ""
  }
  dialogVisible.value = true
}

// 编辑规则
const handleEditRule = (rule: SilenceRule) => {
  isEdit.value = true
  formData.value = { ...rule }
  dialogVisible.value = true
}

// 切换规则状态
const handleToggleRule = async (rule: SilenceRule) => {
  try {
    // 这里应该调用API更新规则状态
    ElMessage.success(`规则已${rule.enabled ? "启用" : "停用"}`)
    emit("refresh")
  } catch (error) {
    console.error("切换规则状态失败:", error)
    ElMessage.error("操作失败")
  }
}

// 删除规则
const handleDeleteRule = async (id: number) => {
  try {
    // 这里应该调用API删除规则
    rules.value = rules.value.filter((rule) => rule.id !== id)
    ElMessage.success("规则已删除")
    emit("refresh")
  } catch (error) {
    console.error("删除规则失败:", error)
    ElMessage.error("删除失败")
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 这里应该调用API保存规则
    if (isEdit.value) {
      // 更新规则
      const index = rules.value.findIndex((rule) => rule.id === formData.value.id)
      if (index !== -1) {
        rules.value[index] = { ...formData.value }
      }
      ElMessage.success("规则已更新")
    } else {
      // 添加规则
      const newRule = {
        ...formData.value,
        id: Date.now(),
        created_at: Date.now(),
        created_by: "当前用户"
      }
      rules.value.unshift(newRule)
      ElMessage.success("规则已创建")
    }

    dialogVisible.value = false
    emit("refresh")
  } catch (error) {
    console.error("保存规则失败:", error)
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

// 监听父组件传入的数据
watch(
  () => props.silenceRules,
  (newRules) => {
    if (newRules && Array.isArray(newRules) && newRules.length > 0) {
      rules.value = newRules
    } else {
      rules.value = []
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadRules()
})
</script>

<style lang="scss" scoped>
.silence-rules-list {
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

  .silence-rule-card {
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

            .active-tag {
              font-weight: 500;
              animation: pulse 2s infinite;
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

      .matchers-section,
      .silence-time-section,
      .create-info-section {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;

          .section-icon {
            font-size: 16px;
            color: #6b7280;
          }
        }

        .section-content {
          .matchers-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .matcher-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 6px;

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

          .empty-matcher {
            text-align: center;
            padding: 20px 0;
            color: #9ca3af;
            font-size: 14px;
          }

          .time-info {
            .time-item {
              display: flex;
              align-items: center;
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }

              .time-label {
                font-size: 14px;
                color: #6b7280;
                min-width: 80px;
              }

              .time-value {
                font-size: 14px;
                color: #374151;
                font-weight: 500;

                &.time-warning {
                  color: #dc2626;
                  font-weight: 600;
                }
              }
            }
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;

            .info-item {
              display: flex;
              align-items: center;

              .info-label {
                font-size: 14px;
                color: #6b7280;
                min-width: 80px;
              }

              .info-value {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
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
    gap: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #374151;

    .section-icon {
      font-size: 18px;
      color: #6b7280;
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
  }

  .matchers-container {
    width: 100%;

    .matcher-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

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
      width: 100%;
      margin-top: 8px;
      color: #3b82f6;
      border: 1px dashed #3b82f6;
      background: #eff6ff;

      &:hover {
        color: #1d4ed8;
      }
    }
  }

  .quick-time-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
