<template>
  <div class="action-policy-card" :class="{ 'is-open': isCustomMode }">
    <!-- 头部区域，展示策略和配置接收人操作 -->
    <div class="card-header-bar">
      <div class="notify-summary-item">
        <span class="summary-label">通知接收人</span>
        <strong>{{ receiverSummaryText }}</strong>
        <span class="summary-desc">{{ receiverInheritText }}</span>
      </div>

      <div class="notify-summary-item">
        <span class="summary-label">通知模板</span>
        <strong>{{ templateStatusText }}</strong>
        <span class="summary-desc">{{ templateInheritText }}</span>
      </div>

      <div class="card-header-actions" @click.stop>
        <el-radio-group v-model="activeTab" size="small" class="policy-state-tabs">
          <el-radio-button label="inherit">继承</el-radio-button>
          <el-radio-button label="custom">独立配置</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 独立的配置主体 -->
    <el-collapse-transition>
      <div v-show="isCustomMode" class="card-body-content notify-body" @click.stop>
        <div class="details-row">
          <div class="details-label">
            <span>接收人明细</span>
            <small>{{ hasReceivers ? `${props.receivers.length} 个接收人` : "当前为继承策略" }}</small>
          </div>

          <div class="details-content">
            <div v-if="hasReceivers" class="receiver-shelf">
              <div v-for="receiver in props.receivers" :key="`${receiver.type}-${receiver.id}`" class="receiver-token">
                <span class="receiver-type">{{ getReceiverTypeLabel(receiver.type) }}</span>
                <span class="receiver-name">{{ receiver.display_name || receiver.id }}</span>
                <button type="button" class="receiver-remove" @click="handleRemoveReceiver(receiver)">
                  <el-icon><Close /></el-icon>
                </button>
              </div>
              <el-button size="small" text type="danger" :icon="Delete" @click="handleClearReceivers">清空</el-button>
              <el-button size="small" plain :icon="Setting" @click="emit('openSelector')">配置接收人</el-button>
            </div>
            <div v-else class="receiver-empty-shelf">
              <span class="empty-policy-text">未配置独立接收人，保存后使用继承策略。</span>
              <el-button size="small" plain :icon="Setting" @click="emit('openSelector')" style="margin-left: 12px"
                >配置接收人</el-button
              >
            </div>
          </div>
        </div>

        <div class="details-row">
          <div class="details-label">
            <span>通知模板</span>
            <small>不选择则继承上级模板</small>
          </div>

          <div class="details-content">
            <AlertTemplatePicker v-model="templateID" placeholder="继承父路由 / 工作空间默认模板" variant="simple" />
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Close, Delete, Setting } from "@element-plus/icons-vue"
import type { ReceiverRef } from "@/api/alert/aggregate/types"
import { getTemplateDetailApi } from "@/api/alert/template"
import AlertTemplatePicker from "@@/components/Pickers/AlertTemplatePicker/index.vue"

interface Props {
  receivers: ReceiverRef[]
  templateId: number
  parentId: number
  routeId?: number
}

const props = withDefaults(defineProps<Props>(), {
  receivers: () => [],
  templateId: 0,
  parentId: 0,
  routeId: undefined
})

const emit = defineEmits<{
  (e: "update:receivers", value: ReceiverRef[]): void
  (e: "update:templateId", value: number): void
  (e: "openSelector"): void
}>()

const templateID = computed({
  get: () => props.templateId || 0,
  set: (val: number) => {
    emit("update:templateId", val)
  }
})

const templateName = ref("")
const isCustomMode = ref(false)

// 仅当切换路由节点时，才根据当前节点是否有策略数据初始化 custom 状态
watch(
  () => props.routeId,
  () => {
    isCustomMode.value = props.receivers?.length > 0 || props.templateId > 0
  },
  { immediate: true }
)

const activeTab = computed({
  get() {
    return isCustomMode.value ? "custom" : "inherit"
  },
  set(val) {
    if (val === "inherit") {
      isCustomMode.value = false
      emit("update:receivers", [])
      emit("update:templateId", 0)
    } else {
      isCustomMode.value = true
    }
  }
})

// 异步拉取模板详情
watch(
  () => props.templateId,
  async (id) => {
    if (!id) {
      templateName.value = ""
      return
    }
    try {
      const { data } = await getTemplateDetailApi(id)
      templateName.value = data?.name || `模板 #${id}`
    } catch {
      templateName.value = `模板 #${id}`
    }
  },
  { immediate: true }
)

// 计算展示文案
const hasReceivers = computed(() => !!props.receivers.length)
const receiverInheritText = computed(() =>
  props.parentId > 0 ? "未配置时继承父路由接收人" : "未配置时使用工作空间默认团队"
)
const receiverSummaryText = computed(() => (hasReceivers.value ? "使用本路由接收人" : "沿用继承接收人"))

const templateInheritText = computed(() =>
  props.parentId > 0 ? "未选择时继承父路由模板" : "未选择时使用工作空间默认模板"
)
const templateStatusText = computed(() => {
  if (!props.templateId) return "继承"
  return templateName.value || `模板 #${props.templateId}`
})

// 移除单个接收人
function handleRemoveReceiver(receiver: ReceiverRef) {
  const nextList = props.receivers.filter((item) => item.id !== receiver.id || item.type !== receiver.type)
  emit("update:receivers", nextList)
}

// 清空接收人
function handleClearReceivers() {
  emit("update:receivers", [])
}

function getReceiverTypeLabel(type: string) {
  const labels: Record<string, string> = {
    user: "用户",
    team: "团队",
    oncall: "排班"
  }
  return labels[type] || type
}
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

  &.notify-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-left: 3px solid #6366f1;
  }
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
    color: #1e293b;
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

.empty-policy-text {
  color: #64748b;
  font-size: 12px;
  line-height: 28px;
}

.receiver-empty-shelf {
  display: flex;
  align-items: center;
  min-height: 28px;
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
  .details-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
