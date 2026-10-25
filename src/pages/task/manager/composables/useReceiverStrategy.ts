import { ref, computed } from "vue"
import { NotificationRecipientType, type NotificationRecipient } from "@/api/task/manager/type"
import type { Assignee } from "@@/components/ReceiverSelector/composables/useAssignees"

export const RECEIVER_MODES = ["user", "team", "department", "on_call"]

export const RECIPIENT_RULE_OPTIONS = [
  { label: "用户", value: "appoint" },
  { label: "团队", value: "team" },
  { label: "部门", value: "department" },
  { label: "值班", value: "on_call" }
]

export const RULE_TO_RECIPIENT_TYPE: Record<string, NotificationRecipientType> = {
  appoint: NotificationRecipientType.USER,
  team: NotificationRecipientType.TEAM,
  department: NotificationRecipientType.DEPARTMENT,
  on_call: NotificationRecipientType.ONCALL
}

export const RECIPIENT_TYPE_TO_RULE = Object.fromEntries(
  Object.entries(RULE_TO_RECIPIENT_TYPE).map(([rule, type]) => [type, rule])
) as Record<NotificationRecipientType, string>

export interface UseReceiverStrategyOptions {
  recipients: () => NotificationRecipient[]
  onUpdate: (recipients: NotificationRecipient[]) => void
}

/**
 * 封装通知接收者策略转换与 ReceiverSelector 弹窗交互的通用 Composable
 * @param options 获取与更新接收者列表的回调
 */
export function useReceiverStrategy(options: UseReceiverStrategyOptions) {
  const { recipients, onUpdate } = options

  const receiverDialogVisible = ref(false)
  const selectedReceiverTab = ref("user")
  const receiverDisplayNames = ref<Record<string, string>>({})

  const recipientLabel = (type: NotificationRecipientType) => {
    const rule = RECIPIENT_TYPE_TO_RULE[type]
    return RECIPIENT_RULE_OPTIONS.find((option) => option.value === rule)?.label || type
  }

  const currentAssignees = computed<Assignee[]>(() =>
    recipients().map((recipient) => ({
      rule: RECIPIENT_TYPE_TO_RULE[recipient.type],
      values: recipient.target_ids.map(String)
    }))
  )

  const recipientPreviews = computed(() =>
    recipients().map((recipient) => ({
      key: recipient.type,
      rule: RECIPIENT_TYPE_TO_RULE[recipient.type] || recipient.type,
      label: recipientLabel(recipient.type),
      text: recipient.target_ids.map((id) => receiverDisplayNames.value[String(id)] || String(id)).join("、")
    }))
  )

  const openReceiverSelector = (type?: NotificationRecipientType) => {
    const rule = type ? RECIPIENT_TYPE_TO_RULE[type] : "appoint"
    selectedReceiverTab.value = rule === "appoint" ? "user" : rule
    receiverDialogVisible.value = true
  }

  const confirmReceivers = (assignees: Assignee[]) => {
    const nextRecipients: NotificationRecipient[] = []
    for (const assignee of assignees) {
      const type = RULE_TO_RECIPIENT_TYPE[assignee.rule]
      if (!type) continue
      const targetIDs = assignee.values.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
      if (targetIDs.length === 0) continue
      nextRecipients.push({
        type,
        target_ids: targetIDs
      })
    }
    onUpdate(nextRecipients)
    receiverDialogVisible.value = false
  }

  const removeRecipient = (type: NotificationRecipientType) => {
    onUpdate(recipients().filter((item) => item.type !== type))
  }

  const updateReceiverNames = (names: Record<string, string>) => {
    receiverDisplayNames.value = { ...receiverDisplayNames.value, ...names }
  }

  return {
    receiverDialogVisible,
    selectedReceiverTab,
    receiverDisplayNames,
    receiverModes: RECEIVER_MODES,
    recipientRuleOptions: RECIPIENT_RULE_OPTIONS,
    ruleToRecipientType: RULE_TO_RECIPIENT_TYPE,
    currentAssignees,
    recipientPreviews,
    openReceiverSelector,
    confirmReceivers,
    removeRecipient,
    updateReceiverNames
  }
}
