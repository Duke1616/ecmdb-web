<template>
  <div v-loading="loading" class="run-parameters" :class="{ 'has-rules': rows.length }">
    <div v-if="rows.length" class="override-list">
      <div
        v-for="{ rule, draft, parameter } in rows"
        :key="rule.param_key"
        class="override-item"
        :class="{ 'is-enabled': draft.enabled }"
      >
        <div class="override-header">
          <div class="parameter-identity">
            <el-checkbox v-model="draft.enabled">
              {{ parameter.desc || rule.param_key }}
            </el-checkbox>
            <code>{{ rule.param_key }}</code>
          </div>
          <div v-if="draft.enabled && availableModes(rule).length > 1" class="input-mode-switcher" role="radiogroup">
            <button
              v-for="item in inputModeOptions.filter((item) => availableModes(rule).includes(item.value))"
              :key="item.value"
              type="button"
              role="radio"
              :aria-checked="draft.mode === item.value"
              class="input-mode-option"
              :class="{ active: draft.mode === item.value }"
              @click="draft.mode = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div v-if="draft.enabled" class="override-control">
          <TaskParamItem
            v-if="draft.mode === 'MANUAL'"
            :parameter="parameter"
            :model-value="draft.value"
            :active-mode="bindingMode(parameter)"
            :is-full-screen="false"
            control-only
            @update:model-value="(value) => (draft.value = value)"
          />
          <template v-else>
            <el-checkbox
              v-if="rule.select_config?.multiple"
              :model-value="isAllSelected(rule)"
              :indeterminate="isPartiallySelected(rule)"
              @change="(value) => toggleAll(rule, !!value)"
              >全选</el-checkbox
            >
            <el-select
              v-model="draft.selected"
              :multiple="rule.select_config?.multiple"
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择本次覆盖值"
              class="override-select"
            >
              <el-option
                v-for="option in rule.select_config?.options ?? []"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="no-overrides">该任务未配置可覆盖的启动参数</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import type { RunParamOverride, TaskParamInputMode, TaskParamOverrideRule } from "@/api/task/manager/type"
import TaskParamItem from "./TaskParamItem.vue"
import { useTaskRunParameters } from "../composables/useTaskRunParameters"

interface OverrideDraft {
  enabled: boolean
  mode: TaskParamInputMode
  value: string
  selected: string | string[]
}

const props = defineProps<{ taskId: number }>()
const drafts = ref<Record<string, OverrideDraft>>({})
const { loading, task, parameters, defaultValues, load, clear } = useTaskRunParameters()
const parameterMap = computed(() => new Map(parameters.value.map((parameter) => [parameter.key, parameter])))
const rules = computed(() => {
  const byKey = new Map((task.value?.param_override_rules ?? []).map((rule) => [rule.param_key, rule]))
  return parameters.value.flatMap((parameter) => {
    const rule = byKey.get(parameter.key)
    return rule ? [rule] : []
  })
})
const rows = computed(() =>
  rules.value.flatMap((rule) => {
    const draft = drafts.value[rule.param_key]
    const parameter = parameterMap.value.get(rule.param_key)
    return draft && parameter ? [{ rule, draft, parameter }] : []
  })
)
const inputModeOptions: Array<{ label: string; value: TaskParamInputMode }> = [
  { label: "手动填写", value: "MANUAL" },
  { label: "预设选择", value: "SELECT" }
]

const availableModes = (rule: TaskParamOverrideRule): TaskParamInputMode[] =>
  rule.allowed_modes.filter((mode) => mode !== "SELECT" || Boolean(rule.select_config?.options?.length))

watch(
  () => props.taskId,
  async (taskId) => {
    drafts.value = {}
    if (!taskId) return
    try {
      await load(taskId)
      if (taskId !== props.taskId) return
      const nextDrafts: Record<string, OverrideDraft> = {}
      for (const rule of rules.value) {
        const hasSelectableOptions = Boolean(rule.select_config?.options?.length)
        const canSelect = rule.allowed_modes.includes("SELECT") && hasSelectableOptions
        nextDrafts[rule.param_key] = {
          enabled: false,
          mode: canSelect ? "SELECT" : "MANUAL",
          value: defaultValues.value[rule.param_key] ?? "",
          selected: rule.select_config?.multiple ? [] : ""
        }
      }
      drafts.value = nextDrafts
    } catch (error) {
      console.error("加载任务运行参数失败:", error)
      ElMessage.error("加载任务运行参数失败")
    }
  },
  { immediate: true }
)

const selectedArray = (rule: TaskParamOverrideRule) => {
  const selected = drafts.value[rule.param_key]?.selected
  return Array.isArray(selected) ? selected : selected ? [selected] : []
}

const isAllSelected = (rule: TaskParamOverrideRule) => {
  const options = rule.select_config?.options ?? []
  return options.length > 0 && selectedArray(rule).length === options.length
}

const isPartiallySelected = (rule: TaskParamOverrideRule) => {
  const count = selectedArray(rule).length
  return count > 0 && !isAllSelected(rule)
}

const toggleAll = (rule: TaskParamOverrideRule, selected: boolean) => {
  drafts.value[rule.param_key].selected = selected
    ? (rule.select_config?.options ?? []).map((option) => option.value)
    : []
}

const bindingMode = (parameter: (typeof parameters.value)[number]) => Object.keys(parameter.bindings ?? {})[0] ?? ""

const collect = (): Record<string, RunParamOverride> | undefined => {
  if (loading.value) {
    ElMessage.warning("任务参数仍在加载")
    return undefined
  }
  const entries: [string, RunParamOverride][] = []
  for (const { rule, draft } of rows.value) {
    if (!draft.enabled) continue
    const mode = draft.mode === "SELECT" && !rule.select_config?.options?.length ? "MANUAL" : draft.mode
    if (mode === "MANUAL") {
      entries.push([rule.param_key, { mode, value: draft.value }])
      continue
    }
    const values = selectedArray(rule)
    if (!values.length) {
      ElMessage.error(`请选择${parameterMap.value.get(rule.param_key)?.desc || rule.param_key}`)
      return undefined
    }
    entries.push([rule.param_key, { mode: draft.mode, values }])
  }
  return Object.fromEntries(entries)
}

defineExpose({ collect, clear })
</script>

<style scoped lang="scss">
.run-parameters {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  overflow: hidden;
}

.override-list {
  display: flex;
  min-height: 0;
  flex: 0 1 auto;
  flex-direction: column;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.override-item {
  flex: 0 0 auto;
  padding: 9px 12px;
  background: #ffffff;

  & + & {
    border-top: 1px solid #edf1f5;
  }

  &.is-enabled {
    background: #fbfdff;
  }
}

.override-header,
.override-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.override-header {
  justify-content: space-between;

  .is-enabled & {
    margin-bottom: 8px;
  }
}

.input-mode-switcher {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.input-mode-option {
  height: 26px;
  padding: 0 9px;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #dce3ec;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition:
    color 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    color: #2563eb;
    border-color: #93c5fd;
  }

  &.active {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #3b82f6;
  }
}

.parameter-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;

  code {
    overflow: hidden;
    color: #94a3b8;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.el-checkbox__label) {
    color: #334155;
    font-size: 12px;
    font-weight: 600;
  }
}

.override-select {
  flex: 1;
  min-width: 0;
}

.no-overrides {
  display: flex;
  min-height: 96px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 14px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #dbe4ef;
  border-radius: 8px;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 680px) {
  .override-header {
    align-items: stretch;
    flex-direction: column;
  }

  .override-control {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
