<template>
  <div class="inhibit-rules-page">
    <ManagerHeader
      title="抑制规则"
      subtitle="配置抑制规则，减少不必要的告警通知"
      :show-back-button="false"
      :show-add-button="true"
      :show-refresh-button="true"
      :add-button-text="'添加规则'"
      @add="handleAddRule"
      @refresh="loadRules"
    />

    <div class="inhibit-rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Filter /></el-icon>
        </div>
        <h4 class="empty-title">暂无抑制规则</h4>
        <p class="empty-description">配置抑制规则，减少不必要的告警通知</p>
        <el-button type="primary" :icon="Filter" @click="handleAddRule"> 添加抑制规则 </el-button>
      </div>

      <!-- 规则列表 -->
      <div class="rules-grid">
        <div v-for="rule in rules" :key="rule.id" class="inhibit-rule-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-top">
              <div class="rule-name-section">
                <h5 class="rule-name">{{ rule.name }}</h5>
                <!-- 过期状态显示在标题旁边 -->
                <div v-if="rule.time_window && isTimeWindowExpired(rule.time_window)" class="expired-indicator">
                  <el-icon class="expired-icon"><Warning /></el-icon>
                  <span class="expired-text">已过期</span>
                </div>
              </div>
              <div class="header-actions">
                <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" size="default" />
                <el-button type="primary" :icon="Edit" size="small" @click="handleEditRule(rule)">编辑</el-button>
                <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteRule(rule.id)">删除</el-button>
                <!-- 续期按钮放在操作区域 -->
                <el-button
                  v-if="rule.time_window && isTimeWindowExpired(rule.time_window)"
                  type="warning"
                  size="small"
                  @click="handleRenewTimeWindow(rule)"
                >
                  续期
                </el-button>
              </div>
            </div>
            <div class="header-bottom">
              <div class="rule-meta">
                <el-tag
                  :type="rule.scope === InhibitScope.Global ? 'primary' : 'warning'"
                  size="small"
                  class="type-tag"
                >
                  {{ rule.scope === InhibitScope.Global ? "全局生效" : "所属空间内生效" }}
                </el-tag>
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" class="status-tag">
                  {{ rule.enabled ? "运行中" : "已停用" }}
                </el-tag>
              </div>
              <div v-if="rule.time_window" class="time-range">
                <el-icon><Clock /></el-icon>
                <span v-if="isValidTimeWindow(rule.time_window)">
                  {{ formatTime(rule.time_window.start) }} - {{ formatTime(rule.time_window.end) }}
                </span>
                <span v-else>无结束时间</span>
              </div>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 匹配器信息 -->
            <div class="matchers-section">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>匹配器配置</span>
              </div>
              <div class="matchers-grid">
                <!-- 源匹配器 -->
                <div class="matcher-group">
                  <div class="matcher-header">
                    <span class="matcher-title">源匹配器</span>
                    <el-tag v-if="rule.source_match?.length" size="small" type="info">{{
                      rule.source_match.length
                    }}</el-tag>
                  </div>
                  <div class="matcher-content">
                    <div v-if="!rule.source_match || rule.source_match.length === 0" class="empty-matcher">
                      <el-icon><Warning /></el-icon>
                      <span>无匹配条件</span>
                    </div>
                    <div v-else class="matcher-tags">
                      <el-tag
                        v-for="(matcher, index) in rule.source_match"
                        :key="index"
                        size="small"
                        class="matcher-tag"
                      >
                        <span class="matcher-name">{{ matcher.name }}</span>
                        <span class="matcher-operator">{{ getOperatorText(matcher.type) }}</span>
                        <span class="matcher-value">{{ matcher.value }}</span>
                      </el-tag>
                    </div>
                  </div>
                </div>

                <!-- 目标匹配器 -->
                <div class="matcher-group">
                  <div class="matcher-header">
                    <span class="matcher-title">目标匹配器</span>
                    <el-tag v-if="rule.target_match?.length" size="small" type="info">{{
                      rule.target_match.length
                    }}</el-tag>
                  </div>
                  <div class="matcher-content">
                    <div v-if="!rule.target_match || rule.target_match.length === 0" class="empty-matcher">
                      <el-icon><Warning /></el-icon>
                      <span>无匹配条件</span>
                    </div>
                    <div v-else class="matcher-tags">
                      <el-tag
                        v-for="(matcher, index) in rule.target_match"
                        :key="index"
                        size="small"
                        class="matcher-tag"
                      >
                        <span class="matcher-name">{{ matcher.name }}</span>
                        <span class="matcher-operator">{{ getOperatorText(matcher.type) }}</span>
                        <span class="matcher-value">{{ matcher.value }}</span>
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 相同标签 -->
            <div v-if="rule.equal_labels && rule.equal_labels.length > 0" class="equal-labels-section">
              <div class="section-title">
                <el-icon><PriceTag /></el-icon>
                <span>相同标签</span>
              </div>
              <div class="labels-container">
                <el-tag v-for="label in rule.equal_labels" :key="label" type="info" size="small" class="label-tag">
                  {{ label }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则抽屉 -->
    <InhibitDrawer
      v-model:visible="dialogVisible"
      v-model:is-edit="isEdit"
      v-model:submitting="submitting"
      v-model:form-data="formData"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 时间窗口续期对话框 -->
    <FormDialog
      v-model="renewDialogVisible"
      title="续期时间窗口"
      width="500px"
      @confirm="handleRenewConfirm"
      @cancel="handleRenewCancel"
    >
      <TimeWindowRenewDialog ref="renewDialogRef" :rule="currentRule" />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Filter, Edit, Delete, PriceTag, Clock, Warning } from "@element-plus/icons-vue"
import { map, defaults } from "lodash-es"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import InhibitDrawer from "./drawer.vue"
import TimeWindowRenewDialog from "./components/TimeWindowRenewDialog.vue"
import { FormDialog } from "@@/components/Dialogs"
import {
  listInhibitRulesByWorkspaceApi,
  deleteInhibitRuleApi,
  saveInhibitRuleApi,
  toggleInhibitRuleStatusApi
} from "@/api/alert/inhibit"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"
import { MatchType, InhibitScope } from "@/api/alert/inhibit/types"
import { useInhibitUtils } from "./composables/useInhibitUtils"

// 定义事件
const emit = defineEmits<{
  refresh: []
}>()

const props = defineProps<{ workspaceId: number }>()

// 使用 defineModel 管理状态
const dialogVisible = defineModel<boolean>("dialogVisible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<SaveInhibitRuleReq>("formData", {
  default: () =>
    reactive({
      name: "",
      source_matchers: [],
      target_matchers: [],
      equal_labels: [],
      time_window: null,
      enabled: true,
      scope: InhibitScope.Global,
      workspace_id: undefined
    })
})

// 续期对话框相关状态
const renewDialogVisible = ref(false)
const currentRule = ref<InhibitRule | null>(null)
const renewDialogRef = ref()

// 使用工具函数 composable
const { createFormData, convertRuleToFormData, createEmptyFormData } = useInhibitUtils()

// 响应式数据
const loading = ref(false)
const rules = ref<InhibitRule[]>([])

// 重置表单
const resetForm = () => {
  formData.value = createEmptyFormData()
}

// 加载规则数据
const loadRules = async () => {
  loading.value = true
  try {
    // 使用工作空间接口获取规则列表
    const { data } = await listInhibitRulesByWorkspaceApi({
      workspace_id: props.workspaceId
    })

    // 使用 lodash 优化数据映射和默认值设置
    rules.value = map(data.inhibit_rules || [], (rule) =>
      defaults(
        {
          ...rule,
          source_match: rule.source_matchers || [],
          target_match: rule.target_matchers || [],
          equal_labels: rule.equal_labels || []
        },
        {
          source_match: [],
          target_match: [],
          equal_labels: [],
          enabled: true,
          scope: InhibitScope.Global
        }
      )
    )
  } catch (error) {
    console.error("加载抑制规则失败:", error)
    rules.value = []
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化 formData 的默认值
  if (!formData.value) {
    formData.value = {
      name: "",
      source_matchers: [],
      target_matchers: [],
      equal_labels: [],
      time_window: null,
      enabled: true,
      scope: InhibitScope.Global,
      workspace_id: undefined
    }
  }
  loadRules()
})

watch(
  () => props.workspaceId,
  () => {
    loadRules()
  },
  { immediate: true }
)

// 添加规则
const handleAddRule = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑规则
const handleEditRule = (rule: InhibitRule) => {
  isEdit.value = true
  formData.value = createFormData(convertRuleToFormData(rule))
  dialogVisible.value = true
}

// 处理时间窗口续期
const handleRenewTimeWindow = (rule: InhibitRule) => {
  currentRule.value = rule
  renewDialogVisible.value = true
}

// 续期确认回调
const handleRenewConfirm = async () => {
  if (!renewDialogRef.value || !currentRule.value) return

  try {
    // 调用子组件的确认方法
    await renewDialogRef.value.handleConfirm()
    renewDialogVisible.value = false
    loadRules() // 重新加载规则列表
    emit("refresh")
  } catch (error) {
    // 如果子组件验证失败，不关闭对话框
    console.error("续期验证失败:", error)
  }
}

// 续期取消回调
const handleRenewCancel = () => {
  renewDialogVisible.value = false
  currentRule.value = null
}

// 删除规则
const handleDeleteRule = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个抑制规则吗？", "确认删除", {
      type: "warning"
    })

    await deleteInhibitRuleApi(id)
    ElMessage.success("删除成功")
    loadRules()
    emit("refresh")
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除抑制规则失败:", error)
    }
  }
}

// 切换规则状态
const handleToggleRule = async (rule: InhibitRule) => {
  try {
    await toggleInhibitRuleStatusApi(rule.id)
    ElMessage.success(rule.enabled ? "规则已启用" : "规则已停用")
    loadRules()
    emit("refresh")
  } catch (error) {
    console.error("切换规则状态失败:", error)
    // 恢复原状态
    rule.enabled = !rule.enabled
  }
}

// 抽屉确认
const handleConfirm = async () => {
  if (!formData.value) return

  try {
    submitting.value = true
    await saveInhibitRuleApi(formData.value)
    ElMessage.success(isEdit.value ? "规则更新成功" : "规则创建成功")

    dialogVisible.value = false
    loadRules()
    emit("refresh")
  } catch (error) {
    console.error("保存规则失败:", error)
  } finally {
    submitting.value = false
  }
}

// 抽屉取消
const handleCancel = () => {
  dialogVisible.value = false
  isEdit.value = false
}

// 获取操作符文本
const getOperatorText = (type: MatchType): string => {
  switch (type) {
    case MatchType.Equal:
      return "="
    case MatchType.NotEqual:
      return "!="
    case MatchType.Regexp:
      return "~"
    case MatchType.NotRegexp:
      return "!~"
    case MatchType.Exists:
      return "存在"
    case MatchType.NotExists:
      return "不存在"
    default:
      return "="
  }
}

// 检查时间窗口是否有效
const isValidTimeWindow = (timeWindow: any): boolean => {
  if (!timeWindow || !timeWindow.start || !timeWindow.end) {
    return false
  }

  // 检查时间戳是否有效
  if (timeWindow.start <= 0 || timeWindow.end <= 0) {
    return false
  }

  return true
}

// 检查时间窗口是否过期
const isTimeWindowExpired = (timeWindow: any): boolean => {
  if (!isValidTimeWindow(timeWindow)) {
    return false
  }

  const now = Date.now()
  let endTime = timeWindow.end

  // 如果时间戳是秒级，转换为毫秒
  if (timeWindow.end.toString().length === 10) {
    endTime = timeWindow.end * 1000
  }

  return now > endTime
}

// 格式化时间戳为可读时间
const formatTime = (timestamp: number): string => {
  // 检查时间戳是否有效
  if (!timestamp || timestamp <= 0) {
    return "无效时间"
  }

  // 如果时间戳看起来是秒级时间戳（10位数字），转换为毫秒
  let actualTimestamp = timestamp
  if (timestamp.toString().length === 10) {
    actualTimestamp = timestamp * 1000
  }

  const date = new Date(actualTimestamp)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return "无效时间"
  }

  // 格式化为 YYYY-MM-DD HH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style lang="scss" scoped>
.inhibit-rules-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inhibit-rules-content {
  flex: 1;
  padding: 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  margin: 20px 0;

  .empty-icon {
    font-size: 48px;
    color: #adb5bd;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: #495057;
    margin: 0 0 8px 0;
  }

  .empty-description {
    font-size: 14px;
    color: #6c757d;
    margin: 0 0 24px 0;
    max-width: 300px;
  }
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.inhibit-rule-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;

  .card-header {
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .rule-name-section {
        display: flex;
        align-items: center;
        gap: 8px;

        .rule-name {
          font-size: 16px;
          font-weight: 600;
          color: #495057;
          margin: 0;
        }

        .expired-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          font-size: 11px;

          .expired-icon {
            font-size: 12px;
            color: #dc2626;
          }

          .expired-text {
            color: #dc2626;
            font-weight: 500;
          }
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .el-button {
          padding: 6px 12px;
          font-weight: 500;
          font-size: 12px;
          border-radius: 4px;
          min-width: 60px;
        }
      }
    }

    .header-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .rule-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .type-tag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .status-tag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }
      }

      .time-range {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #495057;
        background: #e3f2fd;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #bbdefb;
        font-weight: 500;
        flex-shrink: 0;

        .el-icon {
          font-size: 12px;
          color: #1976d2;
        }
      }
    }
  }

  .card-content {
    padding: 20px;

    .matchers-section,
    .equal-labels-section,
    .time-window-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e9ecef;

        .el-icon {
          font-size: 14px;
          color: #6c757d;
        }
      }
    }

    .matchers-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .matcher-group {
        .matcher-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #495057;
        }

        .matcher-content {
          .empty-matcher {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            background: #f8f9fa;
            border: 1px dashed #dee2e6;
            border-radius: 4px;
            color: #6c757d;
            font-size: 12px;

            .el-icon {
              font-size: 14px;
            }
          }

          .matcher-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;

            .matcher-tag {
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 4px;
              background: #fafbfc;
              color: #64748b;
              border: 1px solid #e2e8f0;
              display: flex;
              align-items: center;
              gap: 4px;
              transition: all 0.2s ease;

              &:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
              }

              .matcher-name {
                font-weight: 500;
                color: #475569;
                background: #f1f5f9;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 11px;
              }

              .matcher-operator {
                font-weight: 500;
                color: #64748b;
                padding: 0 2px;
                font-size: 12px;
              }

              .matcher-value {
                font-weight: 500;
                color: #475569;
                background: #f1f5f9;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 11px;
              }
            }
          }
        }
      }
    }

    .labels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .label-tag {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        background: #fafbfc;
        color: #64748b;
        border: 1px solid #e2e8f0;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
      }
    }

    .time-window-info {
      .time-text {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .inhibit-rules-content {
    padding: 16px;
  }

  .rules-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .inhibit-rule-card {
    .card-header {
      padding: 12px 16px;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-right {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .card-content {
      padding: 16px;

      .matchers-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  }
}
</style>
