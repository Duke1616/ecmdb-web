<template>
  <WorkspaceSectionPage
    title="静默规则"
    subtitle="在维护窗口内按标签匹配告警并停止通知"
    :primary-action="{
      label: '添加规则',
      icon: MuteNotification,
      capability: ALERT_CAPABILITIES.Silence.Add
    }"
    @primary-action="handleAddRule"
  >
    <div class="silence-rules-content" v-loading="loading">
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><MuteNotification /></el-icon>
        </div>
        <h4 class="empty-title">暂无静默规则</h4>
        <p class="empty-description">在维护窗口内暂停匹配告警的通知</p>
        <AuthButton
          type="primary"
          :icon="MuteNotification"
          :capability="ALERT_CAPABILITIES.Silence.Add"
          disable-mode
          @click="handleAddRule"
        >
          添加静默规则
        </AuthButton>
      </div>

      <div class="rules-grid">
        <div v-for="rule in rules" :key="rule.id" class="silence-rule-card">
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
                <el-tag v-if="isActive(rule)" type="danger" size="small" effect="light">生效中</el-tag>
                <el-tag v-else-if="isTimeWindowExpired(rule.time_window)" type="info" size="small" effect="light">
                  已过期
                </el-tag>
              </div>
            </div>

            <div class="rule-toolbar">
              <el-tooltip :content="rule.enabled ? '停用规则' : '启用规则'" placement="top">
                <el-switch
                  v-model="rule.enabled"
                  size="small"
                  :disabled="!canToggleRule"
                  @change="handleToggleRule(rule)"
                />
              </el-tooltip>
              <div class="rule-actions">
                <AuthButton
                  type="primary"
                  :icon="Edit"
                  size="small"
                  :capability="ALERT_CAPABILITIES.Silence.Edit"
                  disable-mode
                  @click="handleEditRule(rule)"
                >
                  编辑
                </AuthButton>
                <AuthButton
                  type="danger"
                  :icon="Delete"
                  size="small"
                  :capability="ALERT_CAPABILITIES.Silence.Delete"
                  disable-mode
                  @click="handleDeleteRule(rule.id)"
                >
                  删除
                </AuthButton>
                <AuthButton
                  v-if="isTimeWindowExpired(rule.time_window)"
                  type="warning"
                  :icon="Clock"
                  size="small"
                  :capability="ALERT_CAPABILITIES.Silence.Renewal"
                  disable-mode
                  @click="handleRenewTimeWindow(rule)"
                >
                  续期
                </AuthButton>
              </div>
            </div>
          </div>

          <div class="rule-card-body">
            <section class="rule-panel">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>匹配器</span>
                <el-tag v-if="rule.matchers.length" size="small" type="info">{{ rule.matchers.length }}</el-tag>
              </div>
              <div class="matcher-content">
                <div v-if="rule.matchers.length === 0" class="empty-matcher">
                  <el-icon><Warning /></el-icon>
                  <span>无匹配条件</span>
                </div>
                <div v-else class="matcher-tags">
                  <el-tag v-for="(matcher, index) in rule.matchers" :key="index" size="small" class="matcher-tag">
                    <span class="matcher-name">{{ matcher.name }}</span>
                    <span class="matcher-operator">{{ getOperatorText(matcher.type) }}</span>
                    <span v-if="isValueRequired(matcher.type)" class="matcher-value">{{ matcher.value }}</span>
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="rule-panel">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                <span>静默窗口</span>
              </div>
              <div class="time-window-card" :class="{ expired: isTimeWindowExpired(rule.time_window) }">
                <template v-if="isValidTimeWindow(rule.time_window)">
                  <strong>{{ formatTime(rule.time_window.start) }}</strong>
                  <span>至</span>
                  <strong>{{ formatTime(rule.time_window.end) }}</strong>
                </template>
                <span v-else>未配置时间窗口</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <SilenceDrawer
      v-model:visible="dialogVisible"
      v-model:is-edit="isEdit"
      v-model:submitting="submitting"
      v-model:form-data="formData"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <FormDialog
      v-model="renewDialogVisible"
      title="续期静默窗口"
      width="520px"
      @confirm="handleRenewConfirm"
      @cancel="handleRenewCancel"
    >
      <SilenceTimeWindowRenewDialog ref="renewDialogRef" :rule="currentRule" />
    </FormDialog>
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Clock, Delete, Edit, Filter, MuteNotification, Warning } from "@element-plus/icons-vue"
import { MatchType } from "@@/constants/match-type"
import { FormDialog } from "@@/components/Dialogs"
import { useMatcher } from "@@/composables/useMatcher"
import { usePermission } from "@/common/composables/usePermission"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import {
  createSilenceRuleApi,
  deleteSilenceRuleApi,
  listSilenceRulesByWorkspaceApi,
  toggleSilenceRuleStatusApi,
  updateSilenceRuleApi
} from "@/api/alert/silence"
import type { SaveSilenceRuleReq, SilenceRule, TimeRange } from "@/api/alert/silence/types"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"
import SilenceDrawer from "./drawer.vue"
import SilenceTimeWindowRenewDialog from "./components/SilenceTimeWindowRenewDialog.vue"

const emit = defineEmits<{
  refresh: []
}>()

const props = defineProps<{
  workspaceId: number
}>()

const { hasPermission } = usePermission()
const { getOperatorText, isValueRequired } = useMatcher()

const canToggleRule = computed(() => hasPermission(ALERT_CAPABILITIES.Silence.Toggle))

const rules = ref<SilenceRule[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const renewDialogVisible = ref(false)
const currentRule = ref<SilenceRule | null>(null)
const renewDialogRef = ref<InstanceType<typeof SilenceTimeWindowRenewDialog>>()

const createEmptyFormData = (): SaveSilenceRuleReq => ({
  name: "",
  matchers: [
    {
      type: MatchType.Equal,
      name: "",
      value: ""
    }
  ],
  time_window: {
    start: Date.now(),
    end: Date.now() + 60 * 60 * 1000
  },
  enabled: true,
  workspace_id: props.workspaceId || undefined
})

const formData = ref<SaveSilenceRuleReq>(createEmptyFormData())

const normalizeRule = (rule: SilenceRule): SilenceRule => ({
  ...rule,
  matchers: rule.matchers || [],
  time_window: rule.time_window || { start: 0, end: 0 },
  enabled: rule.enabled ?? true
})

const loadRules = async () => {
  if (!props.workspaceId) {
    rules.value = []
    return
  }

  loading.value = true
  try {
    const { data } = await listSilenceRulesByWorkspaceApi({ workspace_id: props.workspaceId })
    rules.value = (data.silence_rules || []).map(normalizeRule)
  } catch {
    ElMessage.error("静默规则加载失败")
    rules.value = []
  } finally {
    loading.value = false
  }
}

const handleAddRule = () => {
  isEdit.value = false
  formData.value = createEmptyFormData()
  dialogVisible.value = true
}

const handleEditRule = (rule: SilenceRule) => {
  isEdit.value = true
  formData.value = {
    id: rule.id,
    name: rule.name,
    matchers: rule.matchers.map((matcher) => ({ ...matcher })),
    time_window: { ...rule.time_window },
    enabled: rule.enabled,
    workspace_id: rule.workspace_id || props.workspaceId
  }
  dialogVisible.value = true
}

const handleRenewTimeWindow = (rule: SilenceRule) => {
  currentRule.value = rule
  renewDialogVisible.value = true
}

const handleRenewConfirm = async () => {
  if (!renewDialogRef.value) return

  try {
    const renewed = await renewDialogRef.value.handleConfirm()
    if (!renewed) return

    renewDialogVisible.value = false
    currentRule.value = null
    await loadRules()
    emit("refresh")
  } catch {
    ElMessage.error("续期失败，请稍后重试")
  }
}

const handleRenewCancel = () => {
  renewDialogVisible.value = false
  currentRule.value = null
}

const handleToggleRule = async (rule: SilenceRule) => {
  try {
    await toggleSilenceRuleStatusApi(rule.id)
    ElMessage.success(rule.enabled ? "规则已启用" : "规则已停用")
    await loadRules()
    emit("refresh")
  } catch {
    rule.enabled = !rule.enabled
    ElMessage.error("状态切换失败")
  }
}

const handleDeleteRule = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个静默规则吗？", "确认删除", { type: "warning" })
    await deleteSilenceRuleApi(id)
    ElMessage.success("删除成功")
    await loadRules()
    emit("refresh")
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败，请稍后重试")
    }
  }
}

const handleConfirm = async () => {
  try {
    submitting.value = true
    const payload: SaveSilenceRuleReq = {
      ...formData.value,
      workspace_id: props.workspaceId
    }

    if (isEdit.value) {
      await updateSilenceRuleApi(payload)
    } else {
      await createSilenceRuleApi(payload)
    }

    ElMessage.success(isEdit.value ? "规则更新成功" : "规则创建成功")
    dialogVisible.value = false
    await loadRules()
    emit("refresh")
  } catch {
    ElMessage.error("保存失败，请稍后重试")
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  dialogVisible.value = false
  isEdit.value = false
}

const normalizeTimestamp = (timestamp: number) => {
  if (!timestamp || timestamp <= 0) return 0
  return timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
}

const isValidTimeWindow = (timeWindow?: TimeRange): boolean => {
  if (!timeWindow?.start || !timeWindow?.end) return false
  return normalizeTimestamp(timeWindow.start) > 0 && normalizeTimestamp(timeWindow.end) > 0
}

const isTimeWindowExpired = (timeWindow?: TimeRange): boolean => {
  if (!isValidTimeWindow(timeWindow)) return false
  return Date.now() > normalizeTimestamp(timeWindow!.end)
}

const isActive = (rule: SilenceRule) => {
  if (!rule.enabled || !isValidTimeWindow(rule.time_window)) return false
  const now = Date.now()
  return normalizeTimestamp(rule.time_window.start) <= now && normalizeTimestamp(rule.time_window.end) >= now
}

const formatTime = (timestamp: number): string => {
  const actualTimestamp = normalizeTimestamp(timestamp)
  if (!actualTimestamp) return "无效时间"

  const date = new Date(actualTimestamp)
  if (Number.isNaN(date.getTime())) return "无效时间"

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

watch(
  () => props.workspaceId,
  () => {
    formData.value = createEmptyFormData()
    loadRules()
  },
  { immediate: true }
)

defineExpose({
  loadRules
})
</script>

<style lang="scss" scoped>
.silence-rules-content {
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
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.silence-rule-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: none;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
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

  :deep(.el-button) {
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
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.65fr);
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
}

.matcher-tags {
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
  }

  .matcher-value {
    overflow: hidden;
    color: #475569;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.time-window-card {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 36px;
  padding: 8px 10px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;

  &.expired {
    color: #991b1b;
    background: #fef2f2;
    border-color: #fecaca;
  }

  strong {
    color: #334155;
    font-size: 12px;
    font-weight: 800;
  }
}

@media (max-width: 900px) {
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
}
</style>
