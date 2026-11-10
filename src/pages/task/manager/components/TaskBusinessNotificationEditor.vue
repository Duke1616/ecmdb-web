<template>
  <div class="business-notification-rule">
    <!-- 头部模式分段切换 -->
    <header class="rule-header">
      <div class="rule-title">
        <span class="mode-label">接收模式</span>
        <div class="status-options" role="group" aria-label="接收人判定模式">
          <button
            v-for="m in modeOptions"
            :key="m.value"
            type="button"
            class="status-option"
            :class="{ active: model.mode === m.value }"
            @click="handleModeChange(m.value)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
    </header>

    <div class="rule-content">
      <!-- 1. 消息模板集 -->
      <div class="config-field">
        <div class="field-label">
          <label><i>*</i> 消息模板</label>
        </div>
        <TemplateSetPicker
          :model-value="model.template_set_id"
          placeholder="请选择业务消息模板集"
          variant="element"
          size="large"
          border-radius="8px"
          @update:model-value="handleTemplateSetChange"
        />
      </div>

      <!-- 2. 通知渠道 -->
      <div class="config-field">
        <label><i>*</i> 通知渠道</label>
        <div class="channel-options">
          <button
            v-for="option in channelOptions"
            :key="option.value"
            type="button"
            class="channel-option"
            :class="{ active: model.channels.includes(option.value) }"
            @click="toggleChannel(option.value)"
          >
            <img :src="option.icon" :alt="option.label" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- 3A. 动态识别模式：接收人标识维度 -->
      <div v-if="model.mode === BusinessRecipientMode.DYNAMIC" class="config-field">
        <div class="field-label">
          <label><i>*</i> 接收人标识</label>
        </div>
        <div class="dimension-options">
          <button
            v-for="dim in dimensionOptions"
            :key="dim.value"
            type="button"
            class="dimension-option"
            :class="{ active: model.identifier_type === dim.value }"
            @click="handleIdentifierTypeChange(dim.value)"
          >
            <el-icon class="option-icon">
              <component :is="dim.icon" />
            </el-icon>
            <span>{{ dim.label }}</span>
          </button>
        </div>
        <div class="field-hint">
          {{ activeDimensionHint }}
        </div>

        <!-- 产物契约与测试演练卡片 -->
        <div class="contract-card">
          <div class="contract-header">
            <div class="contract-title">
              <el-icon class="header-icon"><Operation /></el-icon>
              <span>产物契约与演练</span>
              <el-tooltip
                content="配置脚本产物的提取规则，或开启演练重定向测试"
                placement="top"
              >
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="contract-badge">
              <span v-if="model.drill_enabled" class="badge-drill">演练模式已激活</span>
              <span v-else class="badge-live">生产分发</span>
            </div>
          </div>

          <div class="contract-body">
            <!-- 契约路径配置（双列） -->
            <div class="contract-grid">
              <div class="contract-item">
                <div class="item-label">
                  <span>提取字段路径</span>
                  <el-tooltip
                    content="脚本产物中通知列表的键名，默认 notifications"
                    placement="top"
                  >
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-input
                  v-model="model.result_path"
                  placeholder="默认: notifications"
                  clearable
                />
              </div>

              <div class="contract-item">
                <div class="item-label">
                  <span>接收人属性名</span>
                  <el-tooltip
                    :content="targetFieldTooltip"
                    placement="top"
                  >
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-input
                  v-model="model.target_field"
                  :placeholder="targetFieldPlaceholder"
                  clearable
                />
              </div>
            </div>

            <!-- 安全演练开关区 -->
            <div class="drill-section" :class="{ 'is-active': model.drill_enabled }">
              <div class="drill-toggle-bar">
                <div class="drill-label">
                  <el-icon class="drill-icon"><Aim /></el-icon>
                  <span>安全演练测试</span>
                  <el-tooltip
                    content="开启后所有通知强制重定向至该用户，防止误发真实人员"
                    placement="top"
                  >
                    <el-icon class="help-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <el-switch
                  v-model="model.drill_enabled"
                  inline-prompt
                  active-text="开"
                  inactive-text="关"
                  @change="handleDrillToggle"
                />
              </div>

              <div v-if="model.drill_enabled" class="drill-input-wrapper">
                <el-input
                  v-model="model.test_redirect_target"
                  placeholder="请输入测试接收人用户名（如当前登录人账号）"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="input-user-icon"><User /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3B. 固定指定模式：接收者策略 -->
      <div v-else class="config-field">
        <label><i>*</i> 接收者</label>
        <ReceiverStrategyEditor
          :items="recipientPreviews"
          :summary="model.recipients.length ? `已配置 ${model.recipients.length} 条策略` : ''"
          placeholder="尚未配置接收者策略"
          @edit="(rule) => openReceiverSelector(rule ? ruleToRecipientType[rule] : undefined)"
          @remove="(type) => removeRecipient(type as NotificationRecipientType)"
        />
      </div>
    </div>

    <!-- 接收者配置弹窗 -->
    <ReceiverSelector
      v-model:visible="receiverDialogVisible"
      title="配置业务通知接收者"
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
import { computed } from "vue"
import { User, Key, Aim, Operation, QuestionFilled } from "@element-plus/icons-vue"
import {
  NotificationChannel,
  NotificationRecipientType,
  RecipientIdentifierType,
  BusinessRecipientMode
} from "@/api/task/manager/type"
import { type BusinessNotificationFormState } from "../composables/useTaskData"
import { useReceiverStrategy } from "../composables/useReceiverStrategy"
import { getChannelIcon, getChannelOptions } from "@/pages/alert/template/config/channels"
import TemplateSetPicker from "@@/components/Pickers/TemplateSetPicker/index.vue"
import ReceiverSelector from "@@/components/ReceiverSelector/index.vue"
import ReceiverStrategyEditor from "@@/components/ReceiverStrategyEditor/index.vue"

// NOTE: 该组件为纯业务通知控制组件，状态由父表单整体持有与管理
const model = defineModel<BusinessNotificationFormState>({ required: true })

const modeOptions = [
  { label: "根据返回自动判定", value: BusinessRecipientMode.DYNAMIC },
  { label: "固定指定业务人员", value: BusinessRecipientMode.STATIC }
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

const dimensionOptions = [
  {
    label: "域账号 / 用户名",
    value: RecipientIdentifierType.USERNAME,
    icon: User
  },
  {
    label: "系统用户 ID",
    value: RecipientIdentifierType.USER_ID,
    icon: Key
  }
] as const

const activeDimensionHint = computed(() => {
  if (model.value.identifier_type === RecipientIdentifierType.USERNAME) {
    return "按域账号反查员工并定向推送"
  }
  return "按用户数值 ID 直接路由推送"
})

const targetFieldTooltip = computed(() => {
  if (model.value.identifier_type === RecipientIdentifierType.USER_ID) {
    return "留空时默认按顺序匹配: target → recipient → user_id"
  }
  return "留空时默认按顺序匹配: target → recipient → username"
})

const targetFieldPlaceholder = computed(() => {
  if (model.value.identifier_type === RecipientIdentifierType.USER_ID) {
    return "默认匹配: target / recipient / user_id"
  }
  return "默认匹配: target / recipient / username"
})

const handleModeChange = (mode: BusinessRecipientMode) => {
  model.value.mode = mode
}

const handleIdentifierTypeChange = (type: RecipientIdentifierType) => {
  model.value.identifier_type = type
}

const toggleChannel = (channel: NotificationChannel) => {
  const current = [...model.value.channels]
  const idx = current.indexOf(channel)
  if (idx > -1) {
    if (current.length <= 1) return
    current.splice(idx, 1)
  } else {
    current.push(channel)
  }
  model.value.channels = current
}

const handleTemplateSetChange = (val: number | number[] | undefined) => {
  const templateSetID = Array.isArray(val) ? Number(val[0]) || 0 : Number(val) || 0
  model.value.template_set_id = templateSetID
}

const handleDrillToggle = (val: boolean | string | number) => {
  if (!val) {
    model.value.test_redirect_target = ""
  }
}

// 统一复用 ReceiverStrategy Composable
const {
  receiverDialogVisible,
  selectedReceiverTab,
  receiverDisplayNames,
  receiverModes,
  recipientRuleOptions,
  ruleToRecipientType,
  currentAssignees,
  recipientPreviews,
  openReceiverSelector,
  confirmReceivers,
  removeRecipient,
  updateReceiverNames
} = useReceiverStrategy({
  recipients: () => model.value.recipients,
  onUpdate: (nextRecipients) => {
    model.value.recipients = nextRecipients
  }
})
</script>

<style scoped lang="scss">
.business-notification-rule {
  margin-top: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
}

.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  .rule-title {
    display: flex;
    align-items: center;
    gap: 10px;

    .mode-label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
  }
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

  &:hover {
    color: #2563eb;
    background: rgba(255, 255, 255, 0.65);
  }

  &.active {
    color: #1d4ed8;
    font-weight: 600;
    background: #fff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
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
      margin-right: 2px;
    }
  }

  .field-hint {
    color: #94a3b8;
    font-size: 12px;
    line-height: 18px;
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
}

.dimension-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dimension-option {
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

  .option-icon {
    font-size: 16px;
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
}

.contract-card {
  margin-top: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.16s ease;

  &:hover {
    border-color: #cbd5e1;
  }
}

.contract-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;

  .contract-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;

    .header-icon {
      font-size: 14px;
      color: #3b82f6;
    }

    .help-icon {
      font-size: 13px;
      color: #94a3b8;
      cursor: help;
      transition: color 0.15s ease;

      &:hover {
        color: #3b82f6;
      }
    }
  }

  .contract-badge {
    display: inline-flex;
    align-items: center;

    .badge-drill {
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 4px;
    }

    .badge-live {
      padding: 2px 8px;
      font-size: 11px;
      color: #64748b;
      background: #e2e8f0;
      border-radius: 4px;
    }
  }
}

.contract-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contract-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.contract-item {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .item-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #475569;

    .help-icon {
      font-size: 12px;
      color: #94a3b8;
      cursor: help;

      &:hover {
        color: #3b82f6;
      }
    }
  }
}

.drill-section {
  padding: 8px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.16s ease;

  &.is-active {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .drill-toggle-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .drill-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;

      .drill-icon {
        font-size: 13px;
        color: #3b82f6;
      }

      .help-icon {
        font-size: 12px;
        color: #94a3b8;
        cursor: help;

        &:hover {
          color: #3b82f6;
        }
      }
    }
  }

  .drill-input-wrapper {
    margin-top: 8px;

    .input-user-icon {
      font-size: 14px;
      color: #64748b;
    }
  }
}
</style>
