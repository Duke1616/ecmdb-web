<template>
  <div class="config-form-container">
    <el-form
      ref="formRef"
      :model="modelValue"
      :rules="formRules"
      class="config-form"
      label-position="top"
      label-width="120px"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Setting /></el-icon>
            <span>基本信息</span>
          </div>
        </div>
        <div class="form-grid">
          <el-form-item label="配置名称" prop="name" class="form-item">
            <el-input v-model="modelValue.name" placeholder="请输入配置名称" size="large" />
          </el-form-item>
          <el-form-item label="配置描述" prop="description" class="form-item form-item-wide">
            <el-input v-model="modelValue.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
          </el-form-item>
        </div>
      </div>

      <!-- 升级时机 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Clock /></el-icon>
            <span>升级时机</span>
          </div>
        </div>

        <div v-if="modelValue.triggers.length > 0" class="section-toolbar">
          <div class="toolbar-count">
            已配置 <strong>{{ modelValue.triggers.length }}</strong> 个时机
          </div>
          <el-button type="primary" :icon="Plus" @click="addTrigger">添加时机</el-button>
        </div>

        <div v-if="modelValue.triggers.length === 0" class="empty-state">
          <div class="empty-state__text">
            <el-icon><Clock /></el-icon>
            <span>暂无升级时机</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="addTrigger">添加第一个时机</el-button>
        </div>
        <div v-else class="trigger-list">
          <div
            v-for="(trigger, index) in modelValue.triggers"
            :key="index"
            class="trigger-item"
            :class="{ 'is-ready': trigger.type }"
          >
            <div class="trigger-card-header">
              <div class="trigger-card-title">
                <span class="trigger-seq">时机 {{ index + 1 }}</span>
                <strong>{{ getTriggerTypeLabel(trigger.type) }}</strong>
              </div>
              <div class="trigger-card-actions">
                <el-button
                  v-if="trigger.type && !isEditingTriggerType(index)"
                  type="primary"
                  link
                  @click="startEditTriggerType(index)"
                >
                  更换类型
                </el-button>
                <el-button type="danger" :icon="Delete" circle text @click="removeTrigger(index)" />
              </div>
            </div>

            <div class="trigger-card-body">
              <el-form-item
                v-if="!trigger.type || isEditingTriggerType(index)"
                label="时机类型"
                :prop="`triggers.${index}.type`"
                class="form-item"
              >
                <div class="trigger-type-edit-row">
                  <div class="trigger-type-select-wrap">
                    <el-select
                      v-model="trigger.type"
                      placeholder="选择时机类型"
                      size="large"
                      class="trigger-type-select"
                      @change="handleTriggerTypeChange(index, $event)"
                    >
                      <el-option label="持续时间达到" :value="ESCALATION_TRIGGER_TYPES.TIME" />
                      <el-option label="告警级别达到" :value="ESCALATION_TRIGGER_TYPES.LEVEL" />
                      <el-option label="连续评估次数达到" :value="ESCALATION_TRIGGER_TYPES.EVAL_COUNT" />
                      <el-option label="聚合告警数量达到" :value="ESCALATION_TRIGGER_TYPES.ALERT_COUNT" />
                    </el-select>
                  </div>
                  <el-button v-if="trigger.type" class="trigger-type-cancel" @click="cancelEditTriggerType(index)">
                    取消
                  </el-button>
                </div>
              </el-form-item>
              <div v-else class="trigger-config-field">
                <div class="trigger-config-label">时机参数</div>
                <div class="trigger-param-panel">
                  <div class="trigger-param-summary">
                    <span>{{ getTriggerConfigSummary(trigger) }}</span>
                  </div>
                  <el-button :icon="Setting" class="trigger-param-action" @click="editTriggerConfig(index)">
                    配置参数
                  </el-button>
                </div>
              </div>
              <el-form-item label="时机描述" :prop="`triggers.${index}.description`" class="form-item">
                <el-input v-model="trigger.description" placeholder="描述这个升级时机" size="large" />
              </el-form-item>
            </div>
          </div>
        </div>
      </div>

      <!-- 组合方式 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Connection /></el-icon>
            <span>组合方式</span>
          </div>
        </div>

        <el-form-item prop="trigger_logic.type" class="form-item logic-form-item">
          <div class="logic-grid">
            <button
              v-for="option in logicOptions"
              :key="option.value"
              type="button"
              class="logic-card"
              :class="{ 'is-active': modelValue.trigger_logic.type === option.value }"
              @click="setTriggerLogicType(option.value)"
            >
              <span class="logic-card__main">
                <span class="logic-card__title">{{ option.title }}</span>
                <span class="logic-card__desc">{{ option.description }}</span>
              </span>
              <el-icon class="logic-card__check"><CircleCheckFilled /></el-icon>
            </button>
          </div>
        </el-form-item>

        <div class="logic-extra-grid">
          <el-form-item
            v-if="modelValue.trigger_logic.type === ESCALATION_LOGIC_TYPES.CUSTOM"
            label="表达式"
            prop="trigger_logic.expression"
            class="form-item"
          >
            <el-input v-model="modelValue.trigger_logic.expression" placeholder="逻辑表达式" size="large" />
          </el-form-item>
          <el-form-item label="组合描述" prop="trigger_logic.description" class="form-item">
            <el-input
              v-model="modelValue.trigger_logic.description"
              type="textarea"
              :rows="3"
              placeholder="描述这些升级时机的组合方式"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>

    <!-- 升级时机配置对话框 -->
    <FormDialog
      v-model="triggerConfigDialogVisible"
      title="升级时机配置"
      width="600px"
      :loading="triggerConfigSaving"
      @confirm="saveTriggerConfig"
      @cancel="cancelTriggerConfig"
    >
      <TriggerConfigForm
        v-if="currentTriggerIndex >= 0"
        v-model="modelValue.triggers[currentTriggerIndex].config"
        :trigger-type="modelValue.triggers[currentTriggerIndex].type"
      />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { CircleCheckFilled, Clock, Connection, Delete, Plus, Setting } from "@element-plus/icons-vue"
import type { FormInstance } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import TriggerConfigForm from "./TriggerConfigForm.vue"
import {
  type CreateConfigReq,
  ESCALATION_TRIGGER_TYPES,
  ESCALATION_LOGIC_TYPES,
  type EscalationTrigger,
  type EscalationTriggerType,
  type EscalationLogicType,
  DEFAULT_TRIGGER_TYPE,
  TimeUnit,
  Level,
  LevelMatchMode
} from "@/api/alert/escalation/types"
import { escalationConfigFormRules } from "../config/validation"

// 双向绑定
const modelValue = defineModel<CreateConfigReq>({ required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 表单验证规则
const formRules = computed(() => escalationConfigFormRules)

const logicOptions: Array<{ value: Exclude<EscalationLogicType, "">; title: string; description: string }> = [
  {
    value: ESCALATION_LOGIC_TYPES.ANY,
    title: "任一时机满足",
    description: "只要一个条件达成就触发升级"
  },
  {
    value: ESCALATION_LOGIC_TYPES.ALL,
    title: "所有时机满足",
    description: "全部条件达成后才触发升级"
  },
  {
    value: ESCALATION_LOGIC_TYPES.FIRST,
    title: "第一个时机满足",
    description: "按配置顺序命中第一个条件"
  },
  {
    value: ESCALATION_LOGIC_TYPES.CUSTOM,
    title: "自定义逻辑",
    description: "使用表达式控制组合判断"
  }
]

const triggerTypeLabelMap: Record<EscalationTriggerType, string> = {
  [ESCALATION_TRIGGER_TYPES.TIME]: "持续时间达到",
  [ESCALATION_TRIGGER_TYPES.LEVEL]: "告警级别达到",
  [ESCALATION_TRIGGER_TYPES.NO_RESPONSE]: "未响应达到",
  [ESCALATION_TRIGGER_TYPES.EVAL_COUNT]: "连续评估次数达到",
  [ESCALATION_TRIGGER_TYPES.ALERT_COUNT]: "聚合告警数量达到",
  "": "未选择时机类型"
}

const getTriggerTypeLabel = (type: EscalationTriggerType) => triggerTypeLabelMap[type] || "未选择时机类型"

const timeUnitLabelMap = {
  [TimeUnit.MINUTES]: "分钟",
  [TimeUnit.HOURS]: "小时"
}

const levelLabelMap = {
  [Level.EMERGENCY]: "紧急",
  [Level.CRITICAL]: "严重",
  [Level.ERROR]: "错误",
  [Level.WARNING]: "警告",
  [Level.INFO]: "提示"
}

const getTriggerConfigSummary = (trigger: EscalationTrigger) => {
  if (!trigger.type) return "选择时机类型后配置参数"

  if (trigger.type === ESCALATION_TRIGGER_TYPES.TIME) {
    const config = trigger.config.time_config
    if (!config) return "尚未配置持续时间"
    return `持续 ${config.delay} ${timeUnitLabelMap[config.unit] || config.unit} 后升级`
  }

  if (trigger.type === ESCALATION_TRIGGER_TYPES.LEVEL) {
    const config = trigger.config.level_config
    if (!config) return "尚未配置告警级别"
    if (config.target_alert_levels?.length) {
      return `命中 ${config.target_alert_levels.map((level) => levelLabelMap[level] || level).join("、")} 级别`
    }
    return `最低 ${levelLabelMap[config.min_alert_level] || config.min_alert_level} 级别`
  }

  if (trigger.type === ESCALATION_TRIGGER_TYPES.EVAL_COUNT) {
    const config = trigger.config.eval_count_config
    return config ? `连续命中 ${config.count} 次后升级` : "尚未配置评估次数"
  }

  if (trigger.type === ESCALATION_TRIGGER_TYPES.ALERT_COUNT) {
    const config = trigger.config.alert_count_config
    return config ? `聚合告警达到 ${config.count} 条后升级` : "尚未配置告警数量"
  }

  if (trigger.type === ESCALATION_TRIGGER_TYPES.NO_RESPONSE) {
    const config = trigger.config.no_response_config
    return config ? `检查 ${config.max_attempts} 次，需确认 ${config.required_acks} 个` : "尚未配置未响应参数"
  }

  return "尚未配置参数"
}

// 触发条件配置对话框
const triggerConfigDialogVisible = ref(false)
const triggerConfigSaving = ref(false)
const currentTriggerIndex = ref(-1)
const editingTriggerTypeIndexes = ref<Set<number>>(new Set())

// 添加触发条件
const addTrigger = () => {
  const newTrigger: EscalationTrigger = {
    type: DEFAULT_TRIGGER_TYPE,
    config: {},
    description: ""
  }
  modelValue.value.triggers.push(newTrigger)
}

// 删除触发条件
const removeTrigger = (index: number) => {
  modelValue.value.triggers.splice(index, 1)
  editingTriggerTypeIndexes.value = new Set()
}

const setTriggerLogicType = (type: EscalationLogicType) => {
  modelValue.value.trigger_logic.type = type
}

const isEditingTriggerType = (index: number) => editingTriggerTypeIndexes.value.has(index)

const startEditTriggerType = (index: number) => {
  editingTriggerTypeIndexes.value = new Set(editingTriggerTypeIndexes.value).add(index)
}

const cancelEditTriggerType = (index: number) => {
  const next = new Set(editingTriggerTypeIndexes.value)
  next.delete(index)
  editingTriggerTypeIndexes.value = next
}

// 编辑触发条件配置
const editTriggerConfig = (index: number) => {
  if (!modelValue.value.triggers[index]?.type) return
  currentTriggerIndex.value = index
  triggerConfigDialogVisible.value = true
}

// 保存触发条件配置
const saveTriggerConfig = async () => {
  triggerConfigSaving.value = true
  try {
    // 这里可以添加验证逻辑
    // 由于使用了 defineModel，配置会自动同步
    triggerConfigDialogVisible.value = false
    currentTriggerIndex.value = -1
  } finally {
    triggerConfigSaving.value = false
  }
}

// 取消触发条件配置
const cancelTriggerConfig = () => {
  triggerConfigDialogVisible.value = false
  currentTriggerIndex.value = -1
}

// 处理触发类型变化
const handleTriggerTypeChange = (index: number, newType: EscalationTriggerType) => {
  const trigger = modelValue.value.triggers[index]
  trigger.type = newType

  // 根据新的触发类型初始化配置
  switch (newType) {
    case ESCALATION_TRIGGER_TYPES.TIME:
      trigger.config = {
        time_config: {
          delay: 5,
          unit: TimeUnit.MINUTES
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.LEVEL:
      trigger.config = {
        level_config: {
          target_alert_levels: [],
          min_alert_level: Level.ERROR,
          match_mode: LevelMatchMode.EXACT
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.NO_RESPONSE:
      trigger.config = {
        no_response_config: {
          check_interval: 30000,
          max_attempts: 3,
          required_acks: 1
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.EVAL_COUNT:
      trigger.config = {
        eval_count_config: {
          count: 3
        }
      }
      break
    case ESCALATION_TRIGGER_TYPES.ALERT_COUNT:
      trigger.config = {
        alert_count_config: {
          count: 5
        }
      }
      break
  }

  cancelEditTriggerType(index)
}

// 暴露验证方法
const validateForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

const resetFields = () => {
  formRef.value?.resetFields()
}

defineExpose({
  validateForm,
  resetFields
})
</script>

<style scoped lang="scss">
.config-form-container {
  padding: 12px 16px;
  background: #fdfdfe;
  height: 100%;
  overflow-y: auto;
}

.config-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .title-left {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
      flex-shrink: 0;
    }

    span {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }

  .form-item-wide {
    grid-column: 1 / -1;
  }

  .section-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .toolbar-count {
    color: #64748b;
    font-size: 13px;

    strong {
      color: #2563eb;
      font-weight: 700;
    }
  }

  .trigger-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .trigger-item {
    padding: 0;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #bfdbfe;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    &.is-ready {
      border-color: #bfdbfe;

      .trigger-seq {
        background: #eff6ff;
        color: #2563eb;
      }
    }
  }

  .trigger-card-header {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #eef2f7;
  }

  .trigger-card-title {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;

    strong {
      min-width: 0;
      color: #334155;
      font-size: 13px;
      font-weight: 650;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .trigger-card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .trigger-seq {
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
  }

  .trigger-card-body {
    padding: 14px 14px 12px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .trigger-type-edit-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .trigger-type-select-wrap {
    flex: 1;
    min-width: 0;
  }

  .trigger-type-select {
    width: 100%;
  }

  .trigger-type-cancel {
    height: 40px;
    flex-shrink: 0;
  }

  .trigger-config-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .trigger-config-label {
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
  }

  .trigger-param-panel {
    display: flex;
    align-items: center;
    min-height: 40px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #93c5fd;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.08);
    }
  }

  .trigger-param-summary {
    flex: 1;
    min-width: 0;
    padding: 0 14px;
    color: #475569;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trigger-param-action {
    height: 40px;
    min-width: 118px;
    border-top: none;
    border-right: none;
    border-bottom: none;
    border-radius: 0 8px 8px 0;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 700;

    &:hover:not(:disabled) {
      background: #eff6ff;
      color: #2563eb;
    }
  }

  .empty-state {
    min-height: 56px;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .empty-state__text {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
    font-weight: 650;

    .el-icon {
      flex-shrink: 0;
      color: #93a4ba;
      font-size: 16px;
    }
  }

  .logic-form-item {
    display: block;

    :deep(.el-form-item__content) {
      display: block;
    }
  }

  .logic-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .logic-card {
    min-height: 64px;
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    background: #f8fafc;
    color: inherit;
    padding: 10px 12px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #93c5fd;
      background: #f0f7ff;
    }

    &.is-active {
      border-color: #2563eb;
      background: #eff6ff;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);

      .logic-card__title,
      .logic-card__check {
        color: #1d4ed8;
      }

      .logic-card__check {
        opacity: 1;
      }
    }
  }

  .logic-card__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .logic-card__title {
    color: #0f172a;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.35;
  }

  .logic-card__desc {
    color: #64748b;
    font-size: 11px;
    line-height: 1.4;
  }

  .logic-card__check {
    flex-shrink: 0;
    color: #2563eb;
    font-size: 16px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .logic-extra-grid {
    display: grid;
    gap: 18px;
    margin-top: 18px;
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      margin-bottom: 8px;
      color: #374151;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
    }

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-select__wrapper) {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition:
        border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }
    }

    :deep(.el-input__wrapper.is-focus),
    :deep(.el-select__wrapper.is-focused),
    :deep(.el-select__wrapper.is-focus),
    :deep(.el-textarea__inner:focus) {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      color: #374151;
      font-size: 14px;
    }

    :deep(.el-input__inner::placeholder),
    :deep(.el-textarea__inner::placeholder),
    :deep(.el-select__placeholder) {
      color: #9ca3af;
    }

    :deep(.el-textarea__inner) {
      min-height: 88px !important;
      padding: 12px 14px;
    }
  }
}

@media (max-width: 768px) {
  .config-form-container {
    padding: 12px 14px;
  }

  .config-form {
    .form-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .section-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .logic-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
