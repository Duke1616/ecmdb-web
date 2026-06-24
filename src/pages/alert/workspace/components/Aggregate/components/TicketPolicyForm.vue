<template>
  <div class="action-policy-card" :class="{ 'is-open': isTicketEnabled }">
    <!-- 头部区域，展示策略和操作选项 -->
    <div class="card-header-bar">
      <div class="notify-summary-item">
        <span class="summary-label">工单策略</span>
        <strong>{{ ticketPolicySummaryText }}</strong>
        <span class="summary-desc">{{ ticketPolicyDescText }}</span>
      </div>

      <div class="card-header-actions" @click.stop>
        <el-radio-group v-model="ticketPolicyState" size="small" class="policy-state-tabs">
          <el-radio-button label="inherit">继承</el-radio-button>
          <el-radio-button label="disabled">禁用</el-radio-button>
          <el-radio-button label="enabled">创建工单</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 折叠展开的配置主体 -->
    <el-collapse-transition>
      <div v-show="isTicketEnabled" class="card-body-content ticket-body">
        <div class="ticket-config-grid">
          <el-form-item label="工单模板" class="ticket-form-item">
            <TicketTemplatePicker v-model="ticketTemplateID" placeholder="请选择工单模板" variant="simple" />
          </el-form-item>

          <el-form-item label="发送模式" class="ticket-form-item">
            <el-radio-group v-model="ticketMode" size="small" class="ticket-mode-group">
              <el-radio-button label="ticket_only">仅创建工单</el-radio-button>
              <el-radio-button label="ticket_and_notify">工单并通知</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="持续时间" class="ticket-form-item">
            <div class="input-unit-group">
              <el-input-number
                v-model="ticketDuration"
                :min="0"
                :max="2592000"
                controls-position="right"
                class="time-input-field"
              />
              <span class="unit-append">秒</span>
            </div>
          </el-form-item>

          <el-form-item label="触发次数" class="ticket-form-item">
            <el-input-number
              v-model="ticketEvalCount"
              :min="0"
              :max="100000"
              controls-position="right"
              class="ticket-count-input"
            />
          </el-form-item>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { TicketPolicy, TicketMode } from "@/api/alert/aggregate/types"
import TicketTemplatePicker from "@/common/components/TicketTemplatePicker/index.vue"

interface Props {
  policy: TicketPolicy | null
  parentId: number
}

const props = withDefaults(defineProps<Props>(), {
  policy: null,
  parentId: 0
})

const emit = defineEmits<{
  (e: "change", value: TicketPolicy | null): void
}>()

// 本地副本以防修改 Prop
const localPolicy = ref<TicketPolicy>({
  enabled: false,
  template_id: 0,
  duration: 0,
  eval_count: 0,
  mode: "ticket_only"
})

watch(
  () => props.policy,
  (newVal) => {
    if (newVal) {
      localPolicy.value = { ...newVal }
    } else {
      localPolicy.value = {
        enabled: false,
        template_id: 0,
        duration: 0,
        eval_count: 0,
        mode: "ticket_only"
      }
    }
  },
  { deep: true, immediate: true }
)

const isTicketEnabled = computed(() => props.policy?.enabled === true)

type TicketPolicyState = "inherit" | "disabled" | "enabled"

const ticketPolicyState = computed<TicketPolicyState>({
  get() {
    if (!props.policy) return "inherit"
    return props.policy.enabled ? "enabled" : "disabled"
  },
  set(value) {
    if (value === "inherit") {
      emit("change", null)
      return
    }
    if (value === "disabled") {
      emit("change", {
        enabled: false,
        template_id: 0,
        duration: 0,
        eval_count: 0,
        mode: "ticket_only"
      })
      return
    }
    // 启用
    const nextPolicy: TicketPolicy = {
      enabled: true,
      template_id: localPolicy.value.template_id || 0,
      duration: localPolicy.value.duration || 0,
      eval_count: localPolicy.value.eval_count || 0,
      mode: localPolicy.value.mode || "ticket_only"
    }
    emit("change", nextPolicy)
  }
})

const ticketTemplateID = computed({
  get: () => localPolicy.value.template_id || 0,
  set: (val: number) => {
    updateField("template_id", val)
  }
})

const ticketDuration = computed({
  get: () => localPolicy.value.duration || 0,
  set: (val: number) => {
    updateField("duration", val)
  }
})

const ticketEvalCount = computed({
  get: () => localPolicy.value.eval_count || 0,
  set: (val: number) => {
    updateField("eval_count", val)
  }
})

const ticketMode = computed<TicketMode>({
  get: () => localPolicy.value.mode || "ticket_only",
  set: (val) => {
    updateField("mode", val)
  }
})

function updateField(key: keyof TicketPolicy, val: any) {
  const nextPolicy = {
    ...localPolicy.value,
    enabled: true,
    [key]: val
  }
  emit("change", nextPolicy)
}

const ticketPolicySummaryText = computed(() => {
  if (!props.policy) return "继承上级工单动作"
  if (!props.policy.enabled) return "本路由禁用工单"
  return props.policy.mode === "ticket_and_notify" ? "创建工单并继续通知" : "仅创建工单"
})

const ticketPolicyDescText = computed(() => {
  if (!props.policy) {
    return props.parentId > 0 ? "未声明时继承父路由工单策略" : "未声明时不额外创建工单"
  }
  if (!props.policy.enabled) return "命中本路由后不创建工单"
  const templateText = props.policy.template_id ? `模板 #${props.policy.template_id}` : "未选择模板"
  return `${templateText}，持续 ${props.policy.duration || 0}s，次数 ${props.policy.eval_count || 0}`
})
</script>

<style lang="scss" scoped>
.action-policy-card {
  overflow: hidden;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  background: #ffffff;
  transition: border-color 0.2s ease;

  &:hover,
  &.is-open {
    border-color: #cbd5e1;
  }
}

.card-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  background: #ffffff;
  user-select: none;

  &.is-clickable {
    cursor: pointer;
  }
}

.notify-summary-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 3px;

  .summary-label {
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-desc {
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  .policy-state-tabs {
    :deep(.el-radio-button__inner) {
      min-width: 68px;
      font-size: 12px;
      font-weight: 700;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background-color: #6366f1;
      border-color: #6366f1;
      box-shadow: -1px 0 0 0 #6366f1;
    }
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    padding: 0 6px;

    &:hover {
      color: #6366f1;
    }

    .arrow-icon {
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 13px;

      &.is-reverse {
        transform: rotate(180deg);
      }
    }
  }

  :deep(.el-button) {
    height: 28px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
  }
}

.card-body-content {
  padding: 14px;
  border-top: 1px dashed #f1f5f9;
  background: #f8fafc;
  cursor: default;

  &.ticket-body {
    border-left: 3px solid #10b981;
  }
}

.ticket-config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;

  :deep(.el-input-number) {
    width: 100%;
  }
}

.ticket-form-item {
  margin-bottom: 0;

  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
  }
}

.ticket-mode-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: 50%;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    font-size: 12px;
    font-weight: 700;
  }
}

.input-unit-group {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;

  &:hover {
    border-color: #c0c4cc;
  }

  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
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
    border-left: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 11px;
    height: 32px;
    font-weight: 600;
    user-select: none;
  }
}

@media (max-width: 1200px) {
  .card-header-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .card-header-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .ticket-config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
