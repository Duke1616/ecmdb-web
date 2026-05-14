<script setup lang="ts">
import { computed } from "vue"
import { usePermission, PermissionMode } from "@/common/composables/usePermission"

const props = withDefaults(
  defineProps<{
    /** 权限代码或数组 */
    capability?: string | string[]
    /** 权限匹配模式: ANY 或 ALL */
    mode?: PermissionMode
    /** 无权限时的行为： true=禁用并置灰, false=直接销毁/不渲染 */
    disableMode?: boolean
  }>(),
  {
    mode: PermissionMode.ANY,
    disableMode: false
  }
)

const { hasPermission } = usePermission()

const isAllowed = computed(() => {
  if (!props.capability) return true
  return hasPermission(props.capability, props.mode)
})

// 控制元素是否需要被挂载
const isRendered = computed(() => {
  // 如果开启了禁用模式，即使没权限也要渲染（只是加上 disabled）
  return props.disableMode ? true : isAllowed.value
})

// 控制禁用状态
const isDisabled = computed(() => {
  // 仅在禁用模式且无权限时被禁用
  return props.disableMode && !isAllowed.value
})
</script>

<template>
  <el-button v-if="isRendered" :disabled="isDisabled" v-bind="$attrs">
    <slot />
  </el-button>
</template>
