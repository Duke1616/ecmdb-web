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
// NOTE: 业务场景为表单编辑，需与父组件同步参数状态
const modelValue = defineModel<Record<string, string>>({ required: true })
// NOTE: 业务规则要求，参数选择的模式（如绑定脚本还是手动输入）需记录在 schedule_params 中
const scheduleParams = defineModel<Record<string, string>>("scheduleParams", { default: () => ({}) })

// UI 状态管理
const paramModes = reactive<Record<string, string>>({})
const fullScreenStates = reactive<Record<string, boolean>>({})

/**
 * 初始化各参数的默认模式与默认值
 */
const initModes = () => {
  if (!props.metadata) return
  const currentParams = { ...modelValue.value }
  let changed = false

  props.metadata.forEach((p) => {
    // 1. 初始化切换模式 (取 Bindings 的第一个 Key)
    const keys = Object.keys(p.bindings || {})
    if (!paramModes[p.key] && keys.length > 0) {
      // 优先从已有的 scheduleParams 中恢复模式，否则取第一个
      paramModes[p.key] = scheduleParams.value[p.key] || keys[0]
    }
    // 2. 补全缺失的默认值
    if (currentParams[p.key] === undefined) {
      currentParams[p.key] = p.default || ""
      changed = true
    }
  })

  // 同步初始化后的模式到 scheduleParams
  const modes: Record<string, string> = { ...scheduleParams.value }
  let modeChanged = false
  Object.keys(paramModes).forEach((k) => {
    if (modes[k] !== paramModes[k]) {
      modes[k] = paramModes[k]
      modeChanged = true
    }
  })

  if (modeChanged) {
    scheduleParams.value = modes
  }

  if (changed) {
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
 * 监听 UI 层的模式变化，并同步到 business 层的 scheduleParams
 */
watch(
  paramModes,
  (newModes) => {
    scheduleParams.value = { ...newModes }
  },
  { deep: true }
)

/**
 * 全屏切换逻辑
 */
const toggleFullScreen = (key: string) => {
  fullScreenStates[key] = !fullScreenStates[key]
  // 切换全屏时锁定/解锁 Body 滚动
  document.body.style.overflow = fullScreenStates[key] ? "hidden" : ""
}

/**
 * 全局键盘监听 (处理 ESC 退出全屏)
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    const activeKey = Object.keys(fullScreenStates).find((k) => fullScreenStates[k])
    if (activeKey) {
      toggleFullScreen(activeKey)
      e.preventDefault()
      e.stopPropagation() // 拦截冒泡，防止触发 Drawer 的关闭
    }
  }
}

onMounted(() => window.addEventListener("keydown", handleKeyDown, true))
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown, true))

// 监听元数据变化以重新初始化
watch(() => props.metadata, initModes, { immediate: true, deep: true })
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
