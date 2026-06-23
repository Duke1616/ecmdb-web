<template>
  <el-form ref="formRef" :model="localForm" :rules="formRules" label-position="top" class="route-form">
    <!-- 基础配置 -->
    <section class="form-section">
      <div class="section-title">
        <el-icon><Setting /></el-icon>
        <span>基础配置</span>
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="路由名称" prop="name">
            <el-input v-model="localForm.name" placeholder="请输入路由名称" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="聚合类型" prop="type">
            <el-select v-model="localForm.type" style="width: 100%">
              <el-option label="规则聚合" :value="AggregateType.Rule" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="switch-group-row">
        <!-- 是否启用 -->
        <div class="switch-cell">
          <div class="switch-cell-info">
            <span class="cell-title">启用状态</span>
            <span class="cell-desc">关闭后本路由规则将失效，告警不会进入此分支</span>
          </div>
          <el-switch v-model="localForm.enabled" />
        </div>

        <!-- 区分数据源 -->
        <div class="switch-cell">
          <div class="switch-cell-info">
            <span class="cell-title">区分数据源</span>
            <span class="cell-desc">开启后不同数据源的告警独立进行指纹计算</span>
          </div>
          <el-switch v-model="localForm.is_diff_data_source" />
        </div>
      </div>
    </section>

    <!-- 匹配条件 -->
    <section class="form-section">
      <div class="section-title">
        <el-icon><Filter /></el-icon>
        <span>匹配条件</span>
      </div>

      <el-form-item label="告警级别">
        <el-select v-model="localForm.levels" multiple clearable placeholder="为空表示不限级别" style="width: 100%">
          <el-option v-for="level in levelOptions" :key="level.value" :label="level.label" :value="level.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签匹配器">
        <div class="matcher-list">
          <div v-if="!localForm.matchers || localForm.matchers.length === 0" class="empty-matchers-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>不限条件（默认匹配所有告警）</span>
          </div>

          <div class="matchers-grid" v-else>
            <MatcherInput
              v-for="(matcher, index) in localForm.matchers"
              :key="index"
              v-model="localForm.matchers[index]"
              size="default"
              @remove="removeMatcher(index)"
            />
          </div>

          <div class="dashed-add-btn" @click="addMatcher">
            <el-icon><Plus /></el-icon>
            <span>添加标签匹配器</span>
          </div>
        </div>
      </el-form-item>
    </section>

    <!-- 分组策略 -->
    <section class="form-section">
      <div class="section-title">
        <el-icon><PriceTag /></el-icon>
        <span>分组策略</span>
      </div>

      <el-form-item label="分组标签" prop="labels">
        <LabelSelector
          v-model="localForm.labels"
          placeholder="输入标签名，按回车添加"
          :suggested-labels="suggestedLabels"
        />
        <div v-if="localForm.parent_id > 0" class="form-tip">子路由留空时继承父路由的分组标签。</div>
      </el-form-item>
    </section>

    <!-- 时间策略 -->
    <section class="form-section">
      <div class="section-title">
        <el-icon><Clock /></el-icon>
        <span>时间策略</span>
      </div>

      <div class="time-cards-container">
        <!-- 组等待时间 -->
        <div class="time-card">
          <div class="time-card-header">
            <span class="label">等待时间</span>
            <span v-if="localForm.parent_id > 0" class="inherit-tip">填 0 继承</span>
          </div>
          <div class="input-unit-group">
            <el-input-number
              v-model="localForm.group_wait"
              :min="timeMin"
              :max="86400"
              controls-position="right"
              class="time-input-field"
            />
            <span class="unit-append">秒</span>
          </div>
          <div class="time-card-footer">
            <span v-if="localForm.parent_id > 0" class="preset-pill" @click="localForm.group_wait = 0">继承</span>
            <span class="preset-pill" @click="localForm.group_wait = 5">5s</span>
            <span class="preset-pill" @click="localForm.group_wait = 10">10s</span>
            <span class="preset-pill" @click="localForm.group_wait = 30">30s</span>
            <span class="preset-pill" @click="localForm.group_wait = 60">1m</span>
          </div>
        </div>

        <!-- 组间隔 -->
        <div class="time-card">
          <div class="time-card-header">
            <span class="label">组间隔</span>
            <span v-if="localForm.parent_id > 0" class="inherit-tip">填 0 继承</span>
          </div>
          <div class="input-unit-group">
            <el-input-number
              v-model="localForm.group_interval"
              :min="timeMin"
              :max="604800"
              controls-position="right"
              class="time-input-field"
            />
            <span class="unit-append">秒</span>
          </div>
          <div class="time-card-footer">
            <span v-if="localForm.parent_id > 0" class="preset-pill" @click="localForm.group_interval = 0">继承</span>
            <span class="preset-pill" @click="localForm.group_interval = 30">30s</span>
            <span class="preset-pill" @click="localForm.group_interval = 60">1m</span>
            <span class="preset-pill" @click="localForm.group_interval = 300">5m</span>
            <span class="preset-pill" @click="localForm.group_interval = 600">10m</span>
          </div>
        </div>

        <!-- 重复间隔 -->
        <div class="time-card">
          <div class="time-card-header">
            <span class="label">重复间隔</span>
            <span v-if="localForm.parent_id > 0" class="inherit-tip">填 0 继承</span>
          </div>
          <div class="input-unit-group">
            <el-input-number
              v-model="localForm.repeat_interval"
              :min="timeMin"
              :max="2592000"
              controls-position="right"
              class="time-input-field"
            />
            <span class="unit-append">秒</span>
          </div>
          <div class="time-card-footer">
            <span v-if="localForm.parent_id > 0" class="preset-pill" @click="localForm.repeat_interval = 0">继承</span>
            <span class="preset-pill" @click="localForm.repeat_interval = 600">10m</span>
            <span class="preset-pill" @click="localForm.repeat_interval = 3600">1h</span>
            <span class="preset-pill" @click="localForm.repeat_interval = 43200">12h</span>
            <span class="preset-pill" @click="localForm.repeat_interval = 86400">24h</span>
          </div>
        </div>
      </div>
      <div v-if="localForm.parent_id > 0" class="form-tip">子路由时间配置填 0 表示继承父路由，不表示立即发送。</div>
    </section>

    <!-- 通知策略 -->
    <section class="form-section">
      <div class="section-title">
        <el-icon><Bell /></el-icon>
        <span>通知策略</span>
      </div>

      <div class="notify-policy-card" :class="{ 'is-open': showNotifyDetails }" @click="toggleNotifyDetails">
        <div class="notify-overview">
          <div class="notify-summary-item">
            <span class="summary-label">接收人</span>
            <strong>{{ receiverSummaryText }}</strong>
            <span>{{ receiverInheritText }}</span>
          </div>

          <div class="notify-summary-item">
            <span class="summary-label">通知模板</span>
            <strong>{{ templateStatusText }}</strong>
            <span>{{ templateInheritText }}</span>
          </div>

          <div class="notify-actions" @click.stop>
            <el-button size="small" plain :icon="Setting" @click="() => openReceiverSelector()">配置接收人</el-button>
            <el-button size="small" text @click="toggleNotifyDetails">
              {{ showNotifyDetails ? "收起" : "展开配置" }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="showNotifyDetails" class="notify-details" @click.stop>
            <div class="details-row">
              <div class="details-label">
                <span>接收人明细</span>
                <small>{{ hasReceivers ? `${localForm.receivers?.length || 0} 个接收人` : "当前为继承策略" }}</small>
              </div>

              <div class="details-content">
                <div v-if="hasReceivers" class="receiver-shelf">
                  <div
                    v-for="receiver in localForm.receivers"
                    :key="`${receiver.type}-${receiver.id}`"
                    class="receiver-token"
                  >
                    <span class="receiver-type">{{ getReceiverTypeLabel(receiver.type) }}</span>
                    <span class="receiver-name">{{ receiver.display_name || receiver.id }}</span>
                    <button type="button" class="receiver-remove" @click="removeReceiver(receiver)">
                      <el-icon><Close /></el-icon>
                    </button>
                  </div>
                  <el-button size="small" text type="danger" :icon="Delete" @click="clearReceivers">清空</el-button>
                </div>
                <span v-else class="empty-policy-text">未配置独立接收人，保存后使用继承策略。</span>
              </div>
            </div>

            <div class="details-row">
              <div class="details-label">
                <span>通知模板</span>
                <small>不选择则继承上级模板</small>
              </div>

              <div class="details-content">
                <el-select
                  v-model="localForm.template_id"
                  clearable
                  filterable
                  :loading="templateLoading"
                  placeholder="继承父路由 / 工作空间默认模板"
                  @visible-change="handleTemplateVisibleChange"
                  @clear="localForm.template_id = 0"
                >
                  <el-option :value="0" label="继承父路由 / 工作空间默认模板" />
                  <el-option
                    v-for="template in templates"
                    :key="template.id"
                    :value="template.id"
                    :label="`${template.name} (${template.channel})`"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </section>
  </el-form>

  <ReceiverSelector
    v-model:visible="receiverSelectorVisible"
    title="配置通知策略"
    result-panel-title="已选接收人"
    empty-text="暂无接收人"
    :initial-assignees="receiverAssignees"
    :initial-tab="receiverInitialTab"
    :modes="['user', 'team', 'on_call']"
    :rule-options="receiverRuleOptions"
    :username-to-display-name="receiverDisplayNames"
    user-value-key="id"
    @confirm="handleReceiverConfirm"
    @update-user-names="updateReceiverDisplayNames"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { Bell, Clock, Close, Delete, Filter, InfoFilled, Plus, PriceTag, Setting } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import {
  AggregateType,
  type AggregateReceiverType,
  type ReceiverRef,
  type SaveAggregateGroupRuleReq
} from "@/api/alert/aggregate/types"
import { listTemplatesApi } from "@/api/alert/template"
import type { ChannelTemplate } from "@/api/alert/template/types"
import type { Assignee } from "@/common/components/ReceiverSelector/composables/useAssignees"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import LabelSelector from "@@/components/LabelSelector/index.vue"
import MatcherInput from "@@/components/MatcherInput/index.vue"
import { useMatcher } from "@@/composables/useMatcher"

const props = defineProps<{
  form: SaveAggregateGroupRuleReq
}>()

const formRef = ref<FormInstance>()
const { createEmptyMatcher } = useMatcher()

const localForm = reactive<SaveAggregateGroupRuleReq>({
  name: "",
  type: AggregateType.Rule,
  parent_id: 0,
  enabled: true,
  is_default: false,
  priority: 0,
  levels: [],
  labels: [],
  workspace_id: 0,
  is_diff_data_source: false,
  receivers: [],
  template_id: 0,
  matchers: [],
  group_wait: 0,
  group_interval: 0,
  repeat_interval: 0
})

watch(
  () => props.form,
  (newVal) => {
    if (!newVal) return
    const cloned = cloneDeep(newVal)
    if (cloned.id === undefined) {
      delete localForm.id
    }
    // NOTE: 使用 cloneDeep 彻底隔离 props.form 引用，避免 vue/no-mutating-props 警告
    Object.assign(localForm, cloned)
  },
  { deep: true, immediate: true }
)

const levelOptions = [
  { label: "P0-紧急", value: 1 },
  { label: "P1-严重", value: 2 },
  { label: "P2-错误", value: 3 },
  { label: "P3-警告", value: 4 },
  { label: "P4-提示", value: 5 }
]

const suggestedLabels = ["alert_name", "alertname", "cluster", "service", "instance", "job", "severity", "env", "team"]

const isRootRoute = computed(() => localForm.parent_id === 0)
const timeMin = computed(() => (isRootRoute.value ? 1 : 0))
const hasReceivers = computed(() => !!localForm.receivers?.length)
const receiverInheritText = computed(() =>
  localForm.parent_id > 0 ? "未配置时继承父路由接收人" : "未配置时使用工作空间默认团队"
)
const receiverSummaryText = computed(() => (hasReceivers.value ? "使用本路由接收人" : "沿用继承接收人"))
const templateInheritText = computed(() =>
  localForm.parent_id > 0 ? "未选择时继承父路由模板" : "未选择时使用工作空间默认模板"
)
const showNotifyDetails = ref(false)
const templates = ref<ChannelTemplate[]>([])
const templateLoading = ref(false)
const receiverSelectorVisible = ref(false)
const receiverInitialTab = ref("")
const receiverAssignees = ref<Assignee[]>([])
const receiverDisplayNames = reactive<Record<string, string>>({})
const receiverRuleOptions = [
  { label: "指定用户", value: "appoint" },
  { label: "团队", value: "team" },
  { label: "排班", value: "on_call" }
]
const templateStatusText = computed(() => {
  if (!localForm.template_id) return "继承"
  const template = templates.value.find((item) => item.id === localForm.template_id)
  return template ? template.name : `模板 #${localForm.template_id}`
})

function toggleNotifyDetails() {
  showNotifyDetails.value = !showNotifyDetails.value
}

const formRules = computed<FormRules>(() => ({
  name: [{ required: true, message: "请输入路由名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择聚合类型", trigger: "change" }],
  labels: [
    {
      validator: (_rule, value: string[], callback) => {
        if (isRootRoute.value && (!value || value.length === 0)) {
          callback(new Error("根路由必须配置分组标签"))
          return
        }
        callback()
      },
      trigger: "change"
    }
  ],
  group_interval: [
    {
      validator: (_rule, value: number, callback) => {
        if (isRootRoute.value && value <= 0) {
          callback(new Error("根路由组间隔必须大于 0"))
          return
        }
        callback()
      },
      trigger: "change"
    }
  ],
  repeat_interval: [
    {
      validator: (_rule, value: number, callback) => {
        if (isRootRoute.value && value <= 0) {
          callback(new Error("根路由重复间隔必须大于 0"))
          return
        }
        callback()
      },
      trigger: "change"
    }
  ]
}))

function addMatcher() {
  localForm.matchers.push(createEmptyMatcher())
}

function removeMatcher(index: number) {
  localForm.matchers.splice(index, 1)
}

function getReceiverTypeLabel(type: string) {
  const labels: Record<string, string> = {
    user: "用户",
    team: "团队",
    oncall: "排班"
  }
  return labels[type] || type
}

function receiverTypeToRule(type: AggregateReceiverType) {
  const map: Record<AggregateReceiverType, string> = {
    user: "appoint",
    team: "team",
    oncall: "on_call"
  }
  return map[type]
}

function ruleToReceiverType(rule: string): AggregateReceiverType | undefined {
  const map: Record<string, AggregateReceiverType> = {
    appoint: "user",
    team: "team",
    on_call: "oncall"
  }
  return map[rule]
}

function receiversToAssignees(receivers: ReceiverRef[] = []): Assignee[] {
  const grouped = new Map<string, string[]>()
  receivers.forEach((receiver) => {
    const rule = receiverTypeToRule(receiver.type)
    const value = String(receiver.id)
    grouped.set(rule, [...(grouped.get(rule) || []), value])
    if (receiver.display_name) {
      receiverDisplayNames[value] = receiver.display_name
    }
  })
  return Array.from(grouped.entries()).map(([rule, values]) => ({ rule, values }))
}

function assigneesToReceivers(assignees: Assignee[]): ReceiverRef[] {
  return assignees.flatMap((assignee) => {
    const type = ruleToReceiverType(assignee.rule)
    if (!type) return []
    return (assignee.values || []).map((value) => ({
      id: Number(value),
      type,
      display_name: receiverDisplayNames[value] || value,
      metadata: {}
    }))
  })
}

function openReceiverSelector(rule?: string) {
  receiverInitialTab.value = rule || ""
  receiverAssignees.value = receiversToAssignees(localForm.receivers || [])
  receiverSelectorVisible.value = true
}

function handleReceiverConfirm(assignees: Assignee[]) {
  localForm.receivers = assigneesToReceivers(assignees)
}

function updateReceiverDisplayNames(map: Record<string, string>) {
  Object.assign(receiverDisplayNames, map)
}

function removeReceiver(receiver: ReceiverRef) {
  localForm.receivers = (localForm.receivers || []).filter(
    (item) => item.id !== receiver.id || item.type !== receiver.type
  )
}

function clearReceivers() {
  localForm.receivers = []
}

async function loadTemplates() {
  if (templates.value.length > 0 || templateLoading.value) return
  templateLoading.value = true
  try {
    const { data } = await listTemplatesApi({ offset: 0, limit: 100 })
    templates.value = data.templates || []
  } finally {
    templateLoading.value = false
  }
}

function handleTemplateVisibleChange(visible: boolean) {
  if (visible) {
    loadTemplates()
  }
}

// 暴露 el-form 组件以支持主页面调用校验
const validate = () => {
  return formRef.value?.validate().catch(() => false)
}

// 暴露编辑后的数据接口
const getFormData = () => {
  const data = { ...localForm }
  if (data.id === undefined) {
    delete data.id
  }
  return data
}

defineExpose({
  validate,
  getFormData
})
</script>

<style lang="scss" scoped>
.route-form {
  padding: 16px;
}

.form-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  position: relative;
  padding-left: 10px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 14px;
    background: #3b82f6;
    border-radius: 2px;
  }

  .el-icon {
    color: #3b82f6;
    font-size: 14px;
  }
}

.matcher-list {
  width: 100%;
}

.empty-matchers-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 10px;

  .el-icon {
    color: #3b82f6;
    font-size: 14px;
  }
}

.matchers-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.dashed-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 36px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #3b82f6;
    color: #2563eb;
    background: #f0f7ff;
  }
}

.form-tip {
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}

.notify-policy-card {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover,
  &.is-open {
    border-color: #cbd5e1;
  }
}

.notify-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 12px 14px;
}

.notify-summary-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.35;
  }

  span {
    color: #64748b;
    font-size: 11px;
    line-height: 1.4;
  }
}

.summary-label {
  color: #334155 !important;
  font-weight: 700;
}

.notify-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  :deep(.el-button) {
    height: 28px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }
}

.notify-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: default;
}

.details-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.details-label {
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
  }

  small {
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.4;
  }
}

.details-content {
  min-width: 0;

  :deep(.el-select) {
    width: min(520px, 100%);
  }
}

.empty-policy-text {
  color: #64748b;
  font-size: 12px;
  line-height: 28px;
}

.receiver-shelf {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.receiver-token {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 240px;
  height: 28px;
  padding: 0 6px 0 4px;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  color: #334155;
  font-size: 12px;
}

.receiver-type {
  display: inline-flex;
  align-items: center;
  height: 20px;
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 700;
}

.receiver-name {
  min-width: 0;
  margin-left: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.receiver-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 5px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
}

@media (max-width: 1200px) {
  .notify-overview {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .notify-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .details-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.time-cards-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.time-card {
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;

  .time-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }

    .inherit-tip {
      font-size: 9px;
      color: #94a3b8;
    }
  }

  .time-card-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
}

.input-unit-group {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }

  &:focus-within {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
  }

  .time-input-field {
    flex: 1;
    width: 100%;
    :deep(.el-input__wrapper) {
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      padding-left: 10px;
    }
  }

  .unit-append {
    display: inline-flex;
    align-items: center;
    padding: 0 10px;
    background: #f8fafc;
    border-left: 1px solid #dcdfe6;
    color: #64748b;
    font-size: 11px;
    height: 30px;
    font-weight: 500;
    user-select: none;
  }
}

.preset-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid #e2e8f0;

  &:hover {
    background: #eff6ff;
    color: #2563eb;
    border-color: #bfdbfe;
  }

  &:active {
    background: #cbd5e1;
  }
}

@media (max-width: 1024px) {
  .time-cards-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.switch-group-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.switch-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }

  .switch-cell-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .cell-title {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .cell-desc {
      font-size: 10px;
      color: #64748b;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  :deep(.el-switch) {
    height: auto;
  }
}

@media (max-width: 768px) {
  .switch-group-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
