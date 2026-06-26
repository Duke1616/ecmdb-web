<template>
  <div class="action-policy-card" :class="{ 'is-open': isEscalationEnabled }">
    <!-- 头部区域，展示策略和操作选项 -->
    <div class="card-header-bar">
      <div class="notify-summary-item">
        <span class="summary-label">动作策略</span>
        <strong>{{ escalationPolicySummaryText }}</strong>
        <span class="summary-desc">{{ escalationPolicyDescText }}</span>
      </div>

      <div class="card-header-actions" @click.stop>
        <el-radio-group v-model="escalationPolicyState" size="small" class="policy-state-tabs">
          <el-radio-button label="inherit">继承</el-radio-button>
          <el-radio-button label="disabled">禁用</el-radio-button>
          <el-radio-button label="enabled">启用升级</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 折叠展开的配置主体 -->
    <el-collapse-transition>
      <div v-show="isEscalationEnabled" class="card-body-content escalation-body">
        <div class="escalation-config-grid">
          <el-form-item label="升级配置" class="ticket-form-item">
            <EscalationConfigPicker v-model="escalationConfigID" placeholder="请选择升级配置" variant="simple" />
          </el-form-item>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { EscalationPolicy } from "@/api/alert/aggregate/types"
import { getConfigApi } from "@/api/alert/escalation"
import EscalationConfigPicker from "@@/components/Pickers/EscalationConfigPicker/index.vue"

interface Props {
  policy: EscalationPolicy | null
  parentId: number
}

const props = withDefaults(defineProps<Props>(), {
  policy: null,
  parentId: 0
})

const emit = defineEmits<{
  (e: "change", value: EscalationPolicy | null): void
}>()

const escalationConfigName = ref("")

// 深度监听 config_id 变化，从接口获取名称以支持回显状态
watch(
  () => props.policy?.config_id,
  async (id) => {
    if (!id) {
      escalationConfigName.value = ""
      return
    }
    try {
      const { data } = await getConfigApi(id)
      escalationConfigName.value = data?.config?.name || `配置 #${id}`
    } catch {
      escalationConfigName.value = `配置 #${id}`
    }
  },
  { immediate: true }
)

const isEscalationEnabled = computed(() => props.policy?.enabled === true)

type EscalationPolicyState = "inherit" | "disabled" | "enabled"

const escalationPolicyState = computed<EscalationPolicyState>({
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
        config_id: 0
      })
      return
    }
    // 启用
    emit("change", {
      enabled: true,
      config_id: props.policy?.config_id || 0
    })
  }
})

const escalationConfigID = computed({
  get: () => props.policy?.config_id || 0,
  set: (val: number) => {
    emit("change", {
      enabled: true,
      config_id: val
    })
  }
})

const escalationPolicySummaryText = computed(() => {
  if (!props.policy) return "继承上级升级动作"
  if (!props.policy.enabled) return "本路由禁用升级"
  return escalationConfigName.value || `升级配置 #${props.policy.config_id || "-"}`
})

const escalationPolicyDescText = computed(() => {
  if (!props.policy) {
    return props.parentId > 0 ? "未声明时继承父路由升级策略" : "未声明时不触发升级"
  }
  if (!props.policy.enabled) return "命中本路由后不触发升级"
  return props.policy.config_id ? "命中本路由后按所选配置执行升级" : "请选择一个升级配置"
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

  &.escalation-body {
    border-left: 3px solid #f59e0b;
  }
}

.escalation-config-grid {
  display: grid;
  grid-template-columns: minmax(240px, 520px);
  gap: 16px;
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
  .escalation-config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
