<template>
  <WorkspaceSectionPage
    title="抑制规则"
    subtitle="配置抑制规则，减少不必要的告警通知"
    :primary-action="{
      label: '添加规则',
      icon: Filter,
      capability: ALERT_CAPABILITIES.Inhibit.Add
    }"
    @primary-action="handleAddRule"
  >
    <div class="inhibit-rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Filter /></el-icon>
        </div>
        <h4 class="empty-title">暂无抑制规则</h4>
        <p class="empty-description">配置抑制规则，减少不必要的告警通知</p>
        <AuthButton
          type="primary"
          :icon="Filter"
          :capability="ALERT_CAPABILITIES.Inhibit.Add"
          disable-mode
          @click="handleAddRule"
        >
          添加抑制规则
        </AuthButton>
      </div>

      <!-- 规则列表 -->
      <div class="rules-grid">
        <div v-for="rule in rules" :key="rule.id" class="inhibit-rule-card">
          <div class="rule-card-header">
            <div class="rule-heading">
              <div class="rule-title-line">
                <h5 class="rule-name">{{ rule.name }}</h5>
                <span class="rule-id">#{{ rule.id }}</span>
              </div>
              <div class="summary-tags">
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" effect="light">
                  {{ rule.enabled ? "运行中" : "已停用" }}
                </el-tag>
                <el-tag
                  v-if="rule.time_window && isTimeWindowExpired(rule.time_window)"
                  type="danger"
                  size="small"
                  effect="light"
                >
                  已过期
                </el-tag>
              </div>
            </div>

            <div class="rule-toolbar">
              <el-tooltip :content="rule.enabled ? '停用规则' : '启用规则'" placement="top">
                <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" size="small" />
              </el-tooltip>
              <div class="rule-actions">
                <el-button type="primary" :icon="Edit" size="small" @click="handleEditRule(rule)">编辑</el-button>
                <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteRule(rule.id)">删除</el-button>
                <el-button
                  v-if="rule.time_window && isTimeWindowExpired(rule.time_window)"
                  type="warning"
                  :icon="Clock"
                  size="small"
                  @click="handleRenewTimeWindow(rule)"
                >
                  续期
                </el-button>
              </div>
            </div>
          </div>

          <div class="rule-card-body">
            <section class="rule-panel">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>源匹配器</span>
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
                  <el-tag v-for="(matcher, index) in rule.source_match" :key="index" size="small" class="matcher-tag">
                    <span class="matcher-name">{{ matcher.name }}</span>
                    <span class="matcher-operator">{{ getOperatorText(matcher.type) }}</span>
                    <span class="matcher-value">{{ matcher.value }}</span>
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="rule-panel">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>目标匹配器</span>
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
                  <el-tag v-for="(matcher, index) in rule.target_match" :key="index" size="small" class="matcher-tag">
                    <span class="matcher-name">{{ matcher.name }}</span>
                    <span class="matcher-operator">{{ getOperatorText(matcher.type) }}</span>
                    <span class="matcher-value">{{ matcher.value }}</span>
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="rule-panel rule-extra-panel">
              <div class="extra-block">
                <div class="section-title">
                  <el-icon><Clock /></el-icon>
                  <span>生效窗口</span>
                </div>
                <div class="time-window-card">
                  <template v-if="rule.time_window && isValidTimeWindow(rule.time_window)">
                    <strong>{{ formatTime(rule.time_window.start) }}</strong>
                    <span>至</span>
                    <strong>{{ formatTime(rule.time_window.end) }}</strong>
                  </template>
                  <span v-else>未配置时间窗口</span>
                </div>
              </div>

              <div class="extra-block">
                <div class="section-title">
                  <el-icon><PriceTag /></el-icon>
                  <span>相同标签</span>
                </div>
                <div v-if="rule.equal_labels && rule.equal_labels.length > 0" class="labels-container">
                  <el-tag v-for="label in rule.equal_labels" :key="label" type="info" size="small" class="label-tag">
                    {{ label }}
                  </el-tag>
                </div>
                <div v-else class="empty-extra">未配置相同标签</div>
              </div>
            </section>
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
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Filter, Edit, Delete, PriceTag, Clock, Warning } from "@element-plus/icons-vue"
import { map, defaults } from "lodash-es"
import InhibitDrawer from "./drawer.vue"
import TimeWindowRenewDialog from "./components/TimeWindowRenewDialog.vue"
import { FormDialog } from "@@/components/Dialogs"
import {
  listInhibitRulesByWorkspaceApi,
  deleteInhibitRuleApi,
  createInhibitRuleApi,
  updateInhibitRuleApi,
  toggleInhibitRuleStatusApi
} from "@/api/alert/inhibit"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"
import { useInhibitUtils } from "./composables/useInhibitUtils"
import { useMatcher } from "@@/composables/useMatcher"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"

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
          enabled: true
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
    const payload = {
      ...formData.value,
      workspace_id: props.workspaceId
    }
    if (isEdit.value) {
      await updateInhibitRuleApi(payload)
    } else {
      await createInhibitRuleApi(payload)
    }
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

// 使用匹配器工具函数
const { getOperatorText } = useMatcher()

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
.inhibit-rules-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  background: transparent;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 360px;
  padding: 64px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;

  .empty-icon {
    color: #94a3b8;
    font-size: 44px;
    margin-bottom: 16px;
  }

  .empty-title {
    margin: 0 0 8px;
    color: #334155;
    font-size: 16px;
    font-weight: 700;
  }

  .empty-description {
    max-width: 320px;
    margin: 0 0 24px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
  }
}

.rules-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.inhibit-rule-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: none;
  }
}

.rule-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.rule-heading {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.rule-title-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.rule-name {
  margin: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-id {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.summary-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  :deep(.el-tag) {
    height: 22px;
    padding: 0 8px;
    border-radius: 6px;
    font-weight: 700;
  }
}

.rule-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-button {
    min-width: 60px;
    height: 26px;
    margin-left: 0;
    padding: 0 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }
}

.rule-card-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(380px, 0.95fr);
  gap: 0;
  min-width: 0;
}

.rule-panel {
  min-width: 0;
  padding: 12px 14px;
  border-right: 1px solid #f1f5f9;

  &:last-child {
    border-right: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;

    .el-icon {
      color: #64748b;
      font-size: 14px;
    }
  }
}

.matcher-content {
  min-width: 0;
}

.empty-matcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 8px 10px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 7px;
  font-size: 12px;

  .el-icon {
    font-size: 14px;
  }
}

.matcher-tags,
.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.matcher-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 7px;
  color: #475569;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.35;

  .matcher-name {
    color: #475569;
    font-weight: 800;
  }

  .matcher-operator {
    color: #64748b;
    font-size: 12px;
  }

  .matcher-value {
    overflow: hidden;
    color: #475569;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.rule-extra-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.extra-block {
  min-width: 0;
}

.labels-container {
  margin-bottom: 0;

  .label-tag {
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }
}

.time-window-card,
.empty-extra {
  min-height: 36px;
  padding: 8px 10px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.time-window-card {
  display: flex;
  flex-direction: column;
  gap: 1px;

  strong {
    color: #334155;
    font-size: 12px;
    font-weight: 800;
  }
}

@media (max-width: 1200px) {
  .rule-card-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rule-extra-panel {
    grid-column: 1 / -1;
    border-top: 1px solid #f1f5f9;
  }
}

@media (max-width: 768px) {
  .inhibit-rules-content {
    gap: 12px;
  }

  .rule-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .rule-toolbar {
    justify-content: space-between;
  }

  .rule-card-body {
    grid-template-columns: 1fr;
  }

  .rule-panel {
    border-right: 0;
    border-bottom: 1px solid #f1f5f9;

    &:last-child {
      border-bottom: 0;
    }
  }

  .rule-extra-panel {
    grid-template-columns: 1fr;
  }
}
</style>
