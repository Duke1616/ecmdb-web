<template>
  <div class="config-inspector">
    <TaskParamItem
      v-for="p in metadata"
      :key="p.key"
      :parameter="p"
      :model-value="modelValue[p.key] ?? ''"
      :structured-variables="p.role === ParameterRole.Variables ? structuredVariables : undefined"
      :active-mode="paramModes[p.key]"
      :is-full-screen="!!fullScreenStates[p.key]"
      :project-entry-codebook-id="projectEntryCodebookId"
      :selectable="selectable && !!p.runtime_overridable"
      :selected="isSelected(p.key)"
      :selection-label="selectionLabel"
      @update:model-value="(val) => onParamUpdate(p.key, val)"
      @update:structured-variables="(val) => (structuredVariables = val)"
      @update:active-mode="(mode) => onModeUpdate(p, mode)"
      @update:selected="(value) => setSelected(p.key, value)"
      @configure="openRuleDialog(p)"
      @toggle-full-screen="toggleFullScreen(p.key)"
    />
  </div>
  <TaskParamOverrideRuleDialog
    v-model="ruleDialogVisible"
    :parameter="editingParameter"
    :rule="editingRule"
    @save="saveRule"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onUnmounted } from "vue"
import { ParameterRole, type Parameter } from "@/api/task/resource/type"
import type { TaskParamOverrideRule, VariableItem } from "@/api/task/manager/type"
import TaskParamItem from "./TaskParamItem.vue"
import TaskParamOverrideRuleDialog from "./TaskParamOverrideRuleDialog.vue"

/**
 * NOTE: 任务参数编辑器 (Inspector 模式)
 * 该组件负责整体参数列表的管理、默认值初始化以及全局快捷键（全屏退出）的管理。
 */
interface Props {
  metadata: Parameter[]
  projectEntryCodebookId?: number
  initializeDefaults?: boolean
  selectable?: boolean
  selectionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  initializeDefaults: true,
  selectionLabel: "允许启动时覆盖"
})

// 使用 defineModel 实现双向绑定
const modelValue = defineModel<Record<string, string>>({ required: true })
// 结构化变量独立于普通参数维护，避免依赖 JSON 字符串和异步 Handler 初始化时序。
const structuredVariables = defineModel<VariableItem[]>("structuredVariables", { default: () => [] })
// NOTE: 该组件为辅助编辑组件，通过 taskMetadata 双向同步参数的绑定状态与 UI 模式
const taskMetadata = defineModel<Record<string, string>>("taskMetadata", { default: () => ({}) })
const overrideRules = defineModel<TaskParamOverrideRule[]>("overrideRules", { default: () => [] })

// UI 状态管理
const paramModes = reactive<Record<string, string>>({})
const fullScreenStates = reactive<Record<string, boolean>>({})

/**
 * 初始化各参数的默认模式与默认值
 * NOTE: 仅在元数据改变或初次加载时执行，避免与用户操作冲突
 */
const initModes = () => {
  if (!props.metadata) return

  const currentParams = { ...modelValue.value }
  const overridableKeys = new Set(
    props.metadata.filter((parameter) => parameter.runtime_overridable).map((parameter) => parameter.key)
  )
  overrideRules.value = overrideRules.value.filter((rule) => overridableKeys.has(rule.param_key))
  let paramsChanged = false

  props.metadata.forEach((p) => {
    // 1. 初始化切换模式（保持后端返回的绑定顺序）
    const keys = Object.keys(p.bindings || {})
    if (keys.length > 0) {
      // 优先从已有的 taskMetadata (业务数据) 中恢复模式到 UI 状态
      // 校验保存的模式是否还在当前的 bindings 中，若不在则取第一个绑定。
      const savedMode = taskMetadata.value[p.key]
      const targetMode = savedMode && p.bindings[savedMode] ? savedMode : keys[0]

      if (paramModes[p.key] !== targetMode) {
        paramModes[p.key] = targetMode
      }
    }

    // 2. 补全缺失的参数默认值 (modelValue)
    if (props.initializeDefaults && currentParams[p.key] === undefined) {
      currentParams[p.key] = p.default || ""
      paramsChanged = true
    }
  })

  if (paramsChanged) {
    modelValue.value = currentParams
  }
}

/**
 * 处理单个参数的值变更
 */
const onParamUpdate = (key: string, val: string) => {
  modelValue.value = { ...modelValue.value, [key]: val }
}

const isSelected = (key: string) => overrideRules.value.some((rule) => rule.param_key === key)

const setSelected = (key: string, selected: boolean) => {
  if (selected && !isSelected(key)) {
    overrideRules.value = [
      ...overrideRules.value,
      {
        param_key: key,
        allowed_modes: ["MANUAL"],
        default_mode: "MANUAL"
      }
    ]
  } else if (!selected) {
    overrideRules.value = overrideRules.value.filter((rule) => rule.param_key !== key)
  }
}

const ruleDialogVisible = ref(false)
const editingParameter = ref<Parameter>()
const editingRule = computed(() => overrideRules.value.find((rule) => rule.param_key === editingParameter.value?.key))

const openRuleDialog = (parameter: Parameter) => {
  editingParameter.value = parameter
  ruleDialogVisible.value = true
}

const saveRule = (rule: TaskParamOverrideRule) => {
  overrideRules.value = overrideRules.value.map((item) => (item.param_key === rule.param_key ? rule : item))
}

/** 切换绑定时清除旧模式值，避免 Runner ID 被当作静态 JSON 等不兼容数据继续提交。 */
const onModeUpdate = (parameter: Parameter, mode: string) => {
  if (paramModes[parameter.key] === mode) return
  paramModes[parameter.key] = mode
  modelValue.value = { ...modelValue.value, [parameter.key]: parameter.default || "" }
}

/**
 * 核心监听：将 UI 层的模式选择 (paramModes) 同步回业务层数据
 * 当 UI 模式发生变化时，更新 taskMetadata (即 form.metadata)
 */
watch(paramModes, (newModes) => {
  taskMetadata.value = { ...newModes }
})

/**
 * 全页元数据驱动点：当 Handler 方法切换导致 Metadata 变化时，触发初始化
 * NOTE: 不再直接监听整个 scheduleParams 响应式对象，防止循环触发
 */
watch(() => props.metadata, initModes, { immediate: true })

/**
 * 全屏切换逻辑与键盘管理
 */
const toggleFullScreen = (key: string) => {
  fullScreenStates[key] = !fullScreenStates[key]
  document.body.style.overflow = fullScreenStates[key] ? "hidden" : ""
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    const activeKey = Object.keys(fullScreenStates).find((k) => fullScreenStates[k])
    if (activeKey) {
      toggleFullScreen(activeKey)
      e.preventDefault()
      e.stopPropagation()
    }
  }
}

// 挂载时进行初始数据映射，并绑定全局键盘快捷键
onMounted(() => {
  initModes()
  window.addEventListener("keydown", handleKeyDown, true)
})

// 销毁时强制释放全局 Body 样式滚动锁，杜绝由于组件卸载导致的整页滚动死锁瘫痪
onUnmounted(() => {
  document.body.style.overflow = ""
  window.removeEventListener("keydown", handleKeyDown, true)
})
</script>

<style lang="scss" scoped>
.config-inspector {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  overflow: hidden;
}
</style>
