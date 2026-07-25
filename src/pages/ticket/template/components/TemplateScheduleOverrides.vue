<template>
  <div class="override-page">
    <div class="override-content" v-loading="loading">
      <main class="strategy-panel">
        <header class="page-heading">
          <div class="page-heading__icon">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="page-heading__content">
            <h3>模板执行策略</h3>
            <p>模板配置优先，未配置的节点自动使用流程中的默认延迟</p>
          </div>
          <div v-if="requirements.length" class="page-heading__count">
            <strong>{{ requirements.length }}</strong>
            <span>个定时节点</span>
          </div>
        </header>

        <div v-if="loadError" class="panel-message">
          <el-alert :title="loadError" type="error" :closable="false" show-icon />
        </div>

        <el-empty
          v-else-if="!loading && requirements.length === 0"
          class="panel-empty"
          description="当前流程没有启用模板优先调度"
          :image-size="120"
        />

        <div v-else class="override-list">
          <section v-for="requirement in requirements" :key="requirement.nodeId" class="override-section">
            <div class="override-section__header">
              <div class="node-identity">
                <div class="node-identity__icon">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="node-identity__content">
                  <strong>{{ requirement.nodeName }}</strong>
                  <span>选择当前模板下该节点的执行时间来源</span>
                </div>
              </div>
              <div class="fallback-value">
                <span>流程默认</span>
                <strong>{{ requirement.fallbackValue }} {{ unitLabel(requirement.fallbackUnit) }}后</strong>
              </div>
            </div>

            <div class="strategy-field">
              <div class="field-label">执行方式</div>
              <el-radio-group
                :model-value="overrideMode(requirement.nodeId)"
                class="strategy-tabs"
                @change="setOverrideMode(requirement, $event as OverrideMode)"
              >
                <el-radio-button value="fallback">默认延迟</el-radio-button>
                <el-radio-button value="delay">表单延迟</el-radio-button>
                <el-radio-button value="at">指定时间</el-radio-button>
              </el-radio-group>
            </div>

            <div class="strategy-detail">
              <div v-if="overrideMode(requirement.nodeId) === 'fallback'" class="fallback-note">
                <el-icon><Clock /></el-icon>
                <span>
                  不读取表单字段，节点到达 {{ requirement.fallbackValue }}
                  {{ unitLabel(requirement.fallbackUnit) }}后执行
                </span>
              </div>

              <div v-else-if="overrideMode(requirement.nodeId) === 'delay'" class="field-row delay-row">
                <div class="control-field">
                  <label>延迟字段</label>
                  <el-select
                    v-model="overrides[requirement.nodeId].field"
                    filterable
                    placeholder="选择表单中的数字字段"
                    @change="clearError(requirement.nodeId)"
                  >
                    <el-option
                      v-for="field in numberFields"
                      :key="field.field"
                      :label="field.title"
                      :value="field.field"
                    >
                      <div class="field-option">
                        <span>{{ field.title }}</span>
                        <small>{{ field.field }}</small>
                      </div>
                    </el-option>
                  </el-select>
                </div>
                <div class="control-field">
                  <label>时间单位</label>
                  <el-select v-model="overrides[requirement.nodeId].unit" @change="clearError(requirement.nodeId)">
                    <el-option v-for="unit in unitOptions" :key="unit.value" :label="unit.label" :value="unit.value" />
                  </el-select>
                </div>
              </div>

              <div v-else class="field-row single">
                <div class="control-field">
                  <label>计划执行时间</label>
                  <el-select
                    :model-value="selectedScheduleGroup(requirement.nodeId)"
                    filterable
                    placeholder="选择计划执行时间组件"
                    @change="bindScheduleGroup(requirement.nodeId, $event)"
                  >
                    <el-option
                      v-for="group in scheduleDateTimeGroups"
                      :key="group.id"
                      :label="group.label"
                      :value="group.id"
                    >
                      <div class="field-option">
                        <span>{{ group.label }}</span>
                        <small>{{ group.description }}</small>
                      </div>
                    </el-option>
                    <template #empty>
                      <div class="select-empty">请返回上一步，拖入“计划执行时间”组件</div>
                    </template>
                  </el-select>
                </div>
              </div>
            </div>

            <div v-if="errors[requirement.nodeId]" class="override-error">
              {{ errors[requirement.nodeId] }}
            </div>
          </section>
        </div>
      </main>
    </div>

    <FormActions
      @previous="emit('previous')"
      @save="handleSave"
      @cancel="emit('close')"
      :show-next="false"
      :show-save="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { Clock, Timer } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { getWorkflowDetailApi } from "@/api/ticket/workflow/workflow"
import FormActions from "@/common/components/FormActions/index.vue"
import type { TemplateFormData } from "../types"
import {
  extractTemplateFields,
  extractScheduleDateTimeGroups,
  extractScheduleRequirements,
  type ScheduleUnit,
  type TemplateFieldKind,
  type TemplateScheduleType,
  type ScheduleRequirement
} from "../utils/scheduleOverrides"

type OverrideMode = "fallback" | TemplateScheduleType
type ScheduleOverrideDraft = Partial<{
  type: TemplateScheduleType
  field: string
  time_field: string
  unit: ScheduleUnit
}>
type ScheduleOverrideDrafts = Record<string, ScheduleOverrideDraft>

const props = defineProps<{ formData: TemplateFormData }>()
const emit = defineEmits<{
  previous: []
  save: []
  close: []
  "update:formData": [data: TemplateFormData]
}>()

const loading = ref(false)
const loadError = ref("")
const requirements = ref<ScheduleRequirement[]>([])
const overrides = reactive<ScheduleOverrideDrafts>(cloneDeep(props.formData.schedule_overrides || {}))
const errors = reactive<Record<string, string>>({})

const unitOptions: Array<{ value: ScheduleUnit; label: string }> = [
  { value: "minute", label: "分钟" },
  { value: "hour", label: "小时" },
  { value: "day", label: "天" }
]

const fields = computed(() => extractTemplateFields(props.formData.rules))
const numberFields = computed(() => fields.value.filter((field) => field.kind === "number"))
const scheduleDateTimeGroups = computed(() => extractScheduleDateTimeGroups(fields.value))

const selectedKind = (nodeId: string): TemplateFieldKind | undefined =>
  fields.value.find((field) => field.field === overrides[nodeId]?.field)?.kind

const matchingScheduleGroup = (nodeId: string) => {
  const override = overrides[nodeId]
  return scheduleDateTimeGroups.value.find(
    (group) => group.dateField === override?.field && group.timeField === override?.time_field
  )
}

const overrideMode = (nodeId: string): OverrideMode => {
  const override = overrides[nodeId]
  if (override?.type === "delay" || override?.type === "at") return override.type
  return "fallback"
}

const ensureOverrides = () => {
  requirements.value.forEach((requirement) => {
    if (!overrides[requirement.nodeId]) overrides[requirement.nodeId] = {}
  })
}

const loadWorkflow = async () => {
  if (!props.formData.workflow_id) return
  loading.value = true
  loadError.value = ""
  try {
    const { data } = await getWorkflowDetailApi(props.formData.workflow_id)
    requirements.value = extractScheduleRequirements(data.flow_data)
    ensureOverrides()
  } catch {
    loadError.value = "流程配置加载失败，请返回上一步确认关联流程"
  } finally {
    loading.value = false
  }
}

const setOverrideMode = (requirement: ScheduleRequirement, mode: OverrideMode) => {
  const current = overrides[requirement.nodeId] || {}
  if (mode === "fallback") {
    overrides[requirement.nodeId] = {}
  } else if (mode === "delay") {
    const field = selectedKind(requirement.nodeId) === "number" ? current.field : undefined
    overrides[requirement.nodeId] = {
      type: "delay",
      field: field || (numberFields.value.length === 1 ? numberFields.value[0].field : undefined),
      unit: current.unit || requirement.fallbackUnit
    }
  } else {
    const currentGroup = matchingScheduleGroup(requirement.nodeId)
    const group =
      currentGroup || (scheduleDateTimeGroups.value.length === 1 ? scheduleDateTimeGroups.value[0] : undefined)
    overrides[requirement.nodeId] = {
      type: "at",
      field: group?.dateField,
      time_field: group?.timeField
    }
  }
  clearError(requirement.nodeId)
}

const selectedScheduleGroup = (nodeId: string) => matchingScheduleGroup(nodeId)?.id || ""

const bindScheduleGroup = (nodeId: string, groupId: string) => {
  const group = scheduleDateTimeGroups.value.find((item) => item.id === groupId)
  if (!group) return
  overrides[nodeId] = { type: "at", field: group.dateField, time_field: group.timeField }
  clearError(nodeId)
}

const clearError = (nodeId: string) => {
  errors[nodeId] = ""
}

const unitLabel = (unit?: string) => unitOptions.find((item) => item.value === unit)?.label || "小时"

const validateOverride = (nodeId: string, override: ScheduleOverrideDraft): string => {
  const mode = overrideMode(nodeId)
  if (mode === "fallback") return ""
  if (!override.field) return mode === "delay" ? "请选择数字字段" : "请选择计划执行时间组件"
  if (mode === "delay") {
    if (selectedKind(nodeId) !== "number") return "已映射的数字字段不存在，请重新选择"
    if (!override.unit) return "请选择延迟时间单位"
    return ""
  }
  if (!matchingScheduleGroup(nodeId)) return "已映射的计划执行时间组件不存在，请重新选择"
  return ""
}

const validate = () => {
  let valid = !loadError.value
  requirements.value.forEach((requirement) => {
    const message = validateOverride(requirement.nodeId, overrides[requirement.nodeId] || {})
    errors[requirement.nodeId] = message
    if (message) valid = false
  })
  return valid
}

const handleSave = () => {
  if (!validate()) return
  const activeOverrides: NonNullable<TemplateFormData["schedule_overrides"]> = {}
  requirements.value.forEach((requirement) => {
    const override = cloneDeep(overrides[requirement.nodeId] || {})
    const mode = overrideMode(requirement.nodeId)
    if (mode === "fallback") return
    activeOverrides[requirement.nodeId] =
      mode === "delay"
        ? { type: "delay", field: override.field!, unit: override.unit! }
        : { type: "at", field: override.field!, time_field: override.time_field }
  })
  emit("update:formData", { ...props.formData, schedule_overrides: activeOverrides })
  emit("save")
}

onMounted(loadWorkflow)
</script>

<style scoped lang="scss">
.override-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  background: #f5f7fa;
}

.override-content {
  flex: 1;
  min-height: 0;
  padding: 0 32px 24px;
  overflow-y: auto;
}

.strategy-panel {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.05),
    0 1px 3px rgba(15, 23, 42, 0.04);
}

.page-heading {
  display: flex;
  min-height: 70px;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid #eef2f7;

  &__icon {
    display: flex;
    flex: 0 0 34px;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    color: #fff;
    font-size: 17px;
    background: #4f46e5;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.18);
  }

  &__content {
    min-width: 0;
    flex: 1;
  }

  h3 {
    margin: 0 0 3px;
    color: #1e293b;
    font-size: 16px;
    font-weight: 650;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  &__count {
    display: flex;
    flex-shrink: 0;
    align-items: baseline;
    gap: 5px;
    color: #64748b;
    font-size: 12px;

    strong {
      color: #4f46e5;
      font-size: 16px;
      font-weight: 700;
    }
  }
}

.panel-message {
  padding: 16px 20px;
}

.panel-empty {
  padding: 32px 20px 40px;
}

.override-section {
  padding: 16px 20px 18px;
  border-bottom: 1px solid #eef2f7;

  &:last-child {
    border-bottom: 0;
  }
}

.override-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 13px;
}

.node-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;

  &__icon {
    display: flex;
    flex: 0 0 28px;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #c2410c;
    font-size: 14px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 7px;
  }

  &__content {
    min-width: 0;
  }

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 2px;
    color: #334155;
    font-size: 14px;
    font-weight: 600;
  }

  span {
    overflow: hidden;
    color: #7c8ba1;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.fallback-value {
  flex-shrink: 0;
  padding-left: 14px;
  text-align: right;
  border-left: 1px solid #e5e7eb;

  span,
  strong {
    display: block;
  }

  span {
    margin-bottom: 2px;
    color: #94a3b8;
    font-size: 11px;
  }

  strong {
    color: #b45309;
    font-size: 12px;
    font-weight: 600;
  }
}

.field-label,
.control-field label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.strategy-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  padding: 3px;
  background: #f1f3f7;
  border: 1px solid #edf0f4;
  border-radius: 6px;

  :deep(.el-radio-button) {
    width: 100%;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    min-height: 32px;
    padding: 7px 8px;
    color: #64748b;
    font-size: 13px;
    background: transparent;
    border: 0;
    border-radius: 4px;
    box-shadow: none;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    color: #4338ca;
    font-weight: 600;
    background: #fff;
    box-shadow:
      0 1px 3px rgba(15, 23, 42, 0.08),
      0 0 0 1px rgba(79, 70, 229, 0.08);
  }
}

.strategy-detail {
  margin-top: 10px;
}

.fallback-note {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 11px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  .el-icon {
    flex-shrink: 0;
    color: #718096;
    font-size: 14px;
  }
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  &.single {
    grid-template-columns: minmax(0, 1fr);
  }

  &.delay-row {
    grid-template-columns: minmax(0, 1fr) 160px;
  }
}

.control-field {
  min-width: 0;

  .el-select {
    width: 100%;
  }

  :deep(.el-select__wrapper) {
    min-height: 36px;
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dce2ea inset;
  }

  :deep(.el-select__wrapper.is-focused) {
    box-shadow: 0 0 0 1px #6366f1 inset;
  }
}

.field-option {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    flex-shrink: 0;
    color: #94a3b8;
  }
}

.select-empty {
  padding: 12px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.override-error {
  margin-top: 9px;
  color: #dc2626;
  font-size: 12px;
}

@media (max-width: 768px) {
  .override-content {
    padding: 0 16px 16px;
  }

  .page-heading {
    align-items: flex-start;
    padding: 15px 16px;

    &__icon {
      flex-basis: 32px;
      width: 32px;
      height: 32px;
      font-size: 16px;
    }

    &__count {
      display: none;
    }
  }

  .override-section {
    padding: 16px;
  }

  .override-section__header {
    align-items: flex-start;
  }

  .fallback-value {
    padding-left: 12px;
  }

  .field-row.delay-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
}

@media (max-width: 520px) {
  .override-content {
    padding: 0 12px 12px;
  }

  .page-heading,
  .override-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .override-section__header {
    flex-direction: column;
    gap: 12px;
  }

  .fallback-value {
    display: flex;
    width: 100%;
    align-items: baseline;
    justify-content: space-between;
    padding: 10px 0 0;
    text-align: left;
    border-top: 1px solid #eef2f7;
    border-left: 0;
  }

  .strategy-tabs :deep(.el-radio-button__inner) {
    padding-right: 4px;
    padding-left: 4px;
    font-size: 12px;
  }
}
</style>
