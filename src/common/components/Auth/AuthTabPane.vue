<script setup lang="ts">
import { computed } from "vue"
import { usePermission, PermissionMode } from "@/common/composables/usePermission"

const props = withDefaults(
  defineProps<{
    /** 权限代码或数组 */
    capability?: string | string[]
    /** 外部传入的权限计算结果 (优先级最高) */
    allowed?: boolean
    /** 权限匹配模式 */
    mode?: PermissionMode
    /** 无权限时的行为： true=置灰且不可点击(类似 disabled), false=直接隐藏标签页 */
    disableMode?: boolean
  }>(),
  {
    mode: PermissionMode.ANY,
    disableMode: false,
    allowed: undefined
  }
)

const { hasPermission } = usePermission()

const isAllowed = computed(() => {
  if (props.allowed !== undefined) return props.allowed
  if (!props.capability) return true
  return hasPermission(props.capability, props.mode)
})

const isRendered = computed(() => {
  return props.disableMode ? true : isAllowed.value
})

const isDisabled = computed(() => {
  return props.disableMode && !isAllowed.value
})
</script>

<template>
  <!-- 注意：el-tab-pane 的渲染逻辑比较特殊，隐藏时使用 v-if 才能彻底从导航栏去除 -->
  <el-tab-pane v-if="isRendered" :disabled="isDisabled" v-bind="$attrs">
    <slot v-if="isAllowed" />
    <!-- 可选：如果被 disableMode 显示了标签，但内部内容无权访问，可在这里放置一个无权限提示空状态 -->
    <div v-else class="auth-empty-state">
      <el-empty description="您没有权限查看此页签内容" :image-size="80" />
    </div>
  </el-tab-pane>
</template>

<style scoped lang="scss">
.auth-empty-state {
  padding: 40px 0;
}
</style>
