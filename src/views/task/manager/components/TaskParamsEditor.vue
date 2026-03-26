<template>
  <div class="config-inspector">
    <TaskParamItem
      v-for="p in metadata"
      :key="p.key"
      :parameter="p"
      :model-value="modelValue[p.key] || ''"
      v-model:active-mode="paramModes[p.key]"
      :is-full-screen="!!fullScreenStates[p.key]"
      @update:model-value="(val) => onParamUpdate(p.key, val)"
      @toggle-full-screen="toggleFullScreen(p.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted, onUnmounted } from "vue"
import type { Parameter } from "@/api/etask/executor/type"
import TaskParamItem from "./TaskParamItem.vue"

/**
 * NOTE: 任务参数编辑器 (Inspector 模式)
 * 该组件负责整体参数列表的管理、默认值初始化以及全局快捷键（全屏退出）的管理。
 */
interface Props {
  metadata: Parameter[]
}

const props = defineProps<Props>()

// 使用 defineModel 实现双向绑定
const modelValue = defineModel<Record<string, string>>({ required: true })
// NOTE: 该组件为辅助编辑组件，通过 taskMetadata 双向同步参数的绑定状态与 UI 模式
const taskMetadata = defineModel<Record<string, string>>("taskMetadata", { default: () => ({}) })

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
  let paramsChanged = false

  props.metadata.forEach((p) => {
    // 1. 初始化切换模式 (取 Bindings 的第一个 Key)
    const keys = Object.keys(p.bindings || {})
    if (keys.length > 0) {
      // 优先从已有的 taskMetadata (业务数据) 中恢复模式到 UI 状态
      // 校验保存的模式是否还在当前的 bindings 中，若不在则取第一个 Key (数据安全性标准)
      const savedMode = taskMetadata.value[p.key]
      const targetMode = savedMode && p.bindings[savedMode] ? savedMode : keys[0]

      if (paramModes[p.key] !== targetMode) {
        paramModes[p.key] = targetMode
      }
    }

    // 2. 补全缺失的参数默认值 (modelValue)
    if (currentParams[p.key] === undefined) {
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

/**
 * 核心监听：将 UI 层的模式选择 (paramModes) 同步回业务层的 scheduleParams
 * 使用深拷贝对象比较，防止属性修改导致的不必要的响应式风暴或循环触发
 */
watch(
  () => ({ ...paramModes }),
  (newModes) => {
    const current = JSON.stringify(taskMetadata.value)
    const next = JSON.stringify(newModes)
    if (current !== next) {
      // 只有在真正发生变化时才更新业务模型，确保单向驱动或受控更新
      taskMetadata.value = newModes
    }
  },
  { deep: true }
)

/**
 * 全页元数据驱动点：当 Handler 方法切换导致 Metadata 变化时，触发初始化
 * NOTE: 不再直接监听整个 scheduleParams 响应式对象，防止循环触发
 */
watch(() => props.metadata, initModes, { immediate: true, deep: true })

/**
 * 编辑场景适配：当外部传入的 scheduleParams (初次打开抽屉) 发生根本性变化时，强制同步一次
 * 仅在 ID 或 关键业务场景切换时通过父组件重置
 */
watch(
  () => taskMetadata.value,
  (val, oldVal) => {
    // 仅在从空变成有，或者明显是重置行为时进行初始化 (例如切换了任务)
    if (Object.keys(val).length > 0 && Object.keys(oldVal || {}).length === 0) {
      initModes()
    }
  },
  { deep: true }
)

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

onMounted(() => window.addEventListener("keydown", handleKeyDown, true))
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown, true))
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
