<template>
  <div class="notification-editor">
    <div v-if="model.length === 0" class="notification-empty">
      <el-icon><Bell /></el-icon>
      <div class="empty-copy">
        <strong>尚未配置执行通知</strong>
        <span>任务进入成功、失败或取消状态时，通过 EAlert 通知相关人员。</span>
      </div>
      <el-button type="primary" plain :icon="Plus" @click="addRule">添加通知规则</el-button>
    </div>

    <div v-else class="rule-list">
      <section v-for="(group, index) in model" :key="index" class="notification-rule">
        <header class="rule-header">
          <div class="rule-title">
            <span class="rule-index">{{ index + 1 }}</span>
            <div class="status-options" role="group" aria-label="通知触发终态">
              <button
                v-for="option in triggerOptions"
                :key="option.value"
                type="button"
                class="status-option"
                :class="{ active: group.trigger_statuses.includes(option.value) }"
                :disabled="isStatusUsed(option.value, index)"
                :aria-pressed="group.trigger_statuses.includes(option.value)"
                @click="toggleStatus(index, option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="rule-actions">
            <el-button link type="danger" :icon="Delete" @click="removeRule(index)">删除</el-button>
          </div>
        </header>

        <div class="rule-content">
          <div class="config-field">
            <div class="field-label">
              <label>消息模板</label>
              <el-button
                v-if="group.template_set_id !== ETASK_DEFAULT_TEMPLATE_SET_ID"
                link
                type="primary"
                size="small"
                @click="restoreBuiltinTemplate(index)"
              >
                使用系统默认
              </el-button>
            </div>
            <TemplateSetPicker
              v-model="group.template_set_id"
              placeholder="请选择模板集"
              zero-label="系统默认模板（ETask 内置）"
              variant="element"
              size="large"
              border-radius="8px"
            />
          </div>

          <div class="config-field">
            <label><i>*</i> 通知渠道</label>
            <div class="channel-options">
              <button
                v-for="option in channelOptions"
                :key="option.value"
                type="button"
                class="channel-option"
                :class="{ active: group.channels.includes(option.value) }"
                :disabled="
                  group.template_set_id === ETASK_DEFAULT_TEMPLATE_SET_ID &&
                  option.value !== NotificationChannel.LARK_CARD
                "
                :title="
                  group.template_set_id === ETASK_DEFAULT_TEMPLATE_SET_ID &&
                  option.value !== NotificationChannel.LARK_CARD
                    ? '系统默认模板目前仅支持飞书卡片'
                    : undefined
                "
                @click="toggleChannel(index, option.value)"
              >
                <img :src="option.icon" :alt="option.label" />
                <span>{{ option.label }}</span>
              </button>
            </div>
            <div v-if="group.template_set_id === ETASK_DEFAULT_TEMPLATE_SET_ID" class="channel-hint">
              系统默认模板仅支持飞书卡片，其他渠道请先选择自定义模板集
            </div>
          </div>

          <div class="config-field">
            <label><i>*</i> 接收者</label>
            <ReceiverStrategyEditor
              :items="recipientPreviews(group)"
              :summary="group.recipients.length ? `已配置 ${group.recipients.length} 条策略` : ''"
              placeholder="尚未配置接收者策略"
              @edit="(rule) => openReceiverSelector(index, rule ? ruleToRecipientType[rule] : undefined)"
              @remove="(type) => removeRecipient(index, type as NotificationRecipientType)"
            />
          </div>
        </div>
      </section>
    </div>

    <el-button v-if="model.length" class="add-rule" :icon="Plus" :disabled="allStatusesUsed" @click="addRule">
      {{ allStatusesUsed ? "所有终态均已配置" : "添加通知规则" }}
    </el-button>

    <ReceiverSelector
      v-model:visible="receiverDialogVisible"
      title="配置任务通知接收者"
      result-panel-title="已选接收者"
      empty-text="暂无接收者"
      :initial-assignees="currentAssignees"
      :initial-tab="selectedReceiverTab"
      :modes="receiverModes"
      :rule-options="recipientRuleOptions"
      :username-to-display-name="receiverDisplayNames"
      user-value-key="id"
      expand-assignees
      @confirm="confirmReceivers"
      @update-user-names="updateReceiverNames"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Bell, Delete, Plus } from "@element-plus/icons-vue"
import { NotificationChannel, NotificationRecipientType, NotificationTriggerStatus } from "@/api/task/manager/type"
import {
  createDefaultExecutionNotificationGroup,
  ETASK_DEFAULT_TEMPLATE_SET_ID,
  type ExecutionNotificationGroup
} from "@/pages/task/manager/composables/useTaskData"
import { getChannelIcon, getChannelOptions } from "@/pages/alert/template/config/channels"
import TemplateSetPicker from "@@/components/Pickers/TemplateSetPicker/index.vue"
import ReceiverSelector from "@@/components/ReceiverSelector/index.vue"
import ReceiverStrategyEditor from "@@/components/ReceiverStrategyEditor/index.vue"
import type { Assignee } from "@@/components/ReceiverSelector/composables/useAssignees"

const model = defineModel<ExecutionNotificationGroup[]>({ required: true })

const triggerOptions = [
  { label: "失败", value: NotificationTriggerStatus.FAILED },
  { label: "成功", value: NotificationTriggerStatus.SUCCESS },
  { label: "取消", value: NotificationTriggerStatus.CANCELLED }
] as const

const taskChannelByCode: Record<string, NotificationChannel> = {
  EMAIL: NotificationChannel.EMAIL,
  WECHAT: NotificationChannel.WECHAT,
  LARK_CARD: NotificationChannel.LARK_CARD
}

const channelOptions = getChannelOptions().map((option) => ({
  ...option,
  value: taskChannelByCode[option.value],
  icon: getChannelIcon(option.value)
}))

const receiverModes = ["user", "team", "department", "on_call"]

const recipientRuleOptions = [
  { label: "用户", value: "appoint" },
  { label: "团队", value: "team" },
  { label: "部门", value: "department" },
  { label: "值班", value: "on_call" }
]

const ruleToRecipientType: Record<string, NotificationRecipientType> = {
  appoint: NotificationRecipientType.USER,
  team: NotificationRecipientType.TEAM,
  department: NotificationRecipientType.DEPARTMENT,
  on_call: NotificationRecipientType.ONCALL
}

const recipientTypeToRule = Object.fromEntries(
  Object.entries(ruleToRecipientType).map(([rule, type]) => [type, rule])
) as Record<NotificationRecipientType, string>

const receiverDialogVisible = ref(false)
const editingRuleIndex = ref<number>()
const selectedReceiverTab = ref("user")
const receiverDisplayNames = ref<Record<string, string>>({})

const allStatusesUsed = computed(() =>
  triggerOptions.every((option) => model.value.some((group) => group.trigger_statuses.includes(option.value)))
)

const currentAssignees = computed<Assignee[]>(() => {
  if (editingRuleIndex.value === undefined) return []
  return model.value[editingRuleIndex.value].recipients.map((recipient) => ({
    rule: recipientTypeToRule[recipient.type],
    values: recipient.target_ids.map(String)
  }))
})

/** 触发数组级更新，确保父表单接收到嵌套字段变化。 */
const emitRules = () => {
  model.value = [...model.value]
}

/** 判断某个终态是否已被其他通知规则使用。 */
const isStatusUsed = (status: NotificationTriggerStatus, currentIndex: number) =>
  model.value.some((group, index) => index !== currentIndex && group.trigger_statuses.includes(status))

/** 切换一组通知配置关联的任务终态。 */
const toggleStatus = (index: number, status: NotificationTriggerStatus) => {
  if (isStatusUsed(status, index)) return
  const group = model.value[index]
  group.trigger_statuses = group.trigger_statuses.includes(status)
    ? group.trigger_statuses.filter((item) => item !== status)
    : triggerOptions.map((option) => option.value).filter((item) => [...group.trigger_statuses, status].includes(item))
  emitRules()
}

/** 为首个尚未配置的任务终态添加一条通知规则。 */
const addRule = () => {
  const status = triggerOptions.find(
    (option) => !model.value.some((group) => group.trigger_statuses.includes(option.value))
  )?.value
  if (!status) return
  model.value = [...model.value, createDefaultExecutionNotificationGroup(status)]
}

/** 删除指定位置的通知规则。 */
const removeRule = (index: number) => {
  model.value = model.value.filter((_, currentIndex) => currentIndex !== index)
}

/** 切换一条规则的通知渠道。 */
const toggleChannel = (index: number, channel: NotificationChannel) => {
  const group = model.value[index]
  if (group.template_set_id === ETASK_DEFAULT_TEMPLATE_SET_ID && channel !== NotificationChannel.LARK_CARD) return
  group.channels = group.channels.includes(channel)
    ? group.channels.filter((item) => item !== channel)
    : [...group.channels, channel]
  emitRules()
}

/** 将指定通知规则恢复为 ETask 内置模板。 */
const restoreBuiltinTemplate = (index: number) => {
  model.value[index].template_set_id = ETASK_DEFAULT_TEMPLATE_SET_ID
  if (!model.value[index].channels.length) {
    model.value[index].channels = [NotificationChannel.LARK_CARD]
  }
  emitRules()
}

/** 获取接收者类型的用户可读名称。 */
const recipientLabel = (type: NotificationRecipientType) => {
  const rule = recipientTypeToRule[type]
  return recipientRuleOptions.find((option) => option.value === rule)?.label || type
}

/** 将任务通知接收者转换为通用策略展示项。 */
const recipientPreviews = (group: ExecutionNotificationGroup) =>
  group.recipients.map((recipient) => ({
    key: recipient.type,
    rule: recipientTypeToRule[recipient.type] || recipient.type,
    label: recipientLabel(recipient.type),
    text: recipient.target_ids.map((id) => receiverDisplayNames.value[String(id)] || String(id)).join("、")
  }))

/** 打开指定通知规则的接收者策略弹窗。 */
const openReceiverSelector = (index: number, type?: NotificationRecipientType) => {
  editingRuleIndex.value = index
  const rule = type ? recipientTypeToRule[type] : "appoint"
  selectedReceiverTab.value = rule === "appoint" ? "user" : rule
  receiverDialogVisible.value = true
}

/** 删除一条通知规则中的指定接收者策略。 */
const removeRecipient = (index: number, type: NotificationRecipientType) => {
  model.value[index].recipients = model.value[index].recipients.filter((recipient) => recipient.type !== type)
  emitRules()
}

/** 合并选择器异步解析出的接收对象名称。 */
const updateReceiverNames = (names: Record<string, string>) => {
  receiverDisplayNames.value = { ...receiverDisplayNames.value, ...names }
}

/** 将通用选择器结果转换为 ETask 接受的分组数值 ID。 */
const confirmReceivers = (assignees: Assignee[]) => {
  if (editingRuleIndex.value === undefined) return
  model.value[editingRuleIndex.value].recipients = assignees.flatMap((assignee) => {
    const type = ruleToRecipientType[assignee.rule]
    if (!type) return []
    const targetIDs = assignee.values.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
    return targetIDs.length ? [{ type, target_ids: targetIDs }] : []
  })
  emitRules()
}
</script>

<style scoped lang="scss">
.notification-editor,
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;

  > .el-icon {
    flex-shrink: 0;
    color: #3b82f6;
    font-size: 26px;
  }
}

.empty-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;

  strong {
    color: #334155;
    font-size: 13px;
  }
}

.notification-rule {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
}

.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.rule-title,
.rule-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-index {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  background: #3b82f6;
  border-radius: 6px;
}

.status-options {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  background: #e9eef5;
  border-radius: 7px;
}

.status-option {
  min-width: 52px;
  padding: 5px 12px;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.16s ease;

  &:hover:not(:disabled) {
    color: #2563eb;
    background: rgba(255, 255, 255, 0.65);
  }

  &.active {
    color: #1d4ed8;
    font-weight: 600;
    background: #fff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }

  &:disabled:not(.active) {
    color: #b8c1ce;
    cursor: not-allowed;
  }
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 12px 12px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  > label,
  .field-label > label {
    color: #334155;
    font-size: 13px;
    font-weight: 600;

    i {
      color: #f56c6c;
      font-style: normal;
    }
  }
}

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.channel-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.channel-option {
  display: flex;
  height: var(--el-component-size-large);
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  color: #475569;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.16s ease;

  img {
    width: 18px;
    height: 18px;
  }

  span {
    font-size: 13px;
    font-weight: 600;
  }

  &:hover,
  &.active {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #3b82f6;
  }

  &.active {
    box-shadow: 0 0 0 2px rgb(59 130 246 / 10%);
  }

  &:disabled {
    color: #a8abb2;
    background: #f5f7fa;
    border-color: #e4e7ed;
    cursor: not-allowed;
    opacity: 0.85;
  }
}

.channel-hint {
  color: #909399;
  font-size: 11px;
  line-height: 1.4;
}

.add-rule {
  width: 100%;
  border-style: dashed;
}
</style>
