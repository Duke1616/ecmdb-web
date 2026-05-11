<script setup lang="ts">
import { usePermission, PermissionMode } from "@/common/composables/usePermission"

interface Props {
  /** 权限代码或数组 */
  value: string | string[]
  /** 校验模式: PermissionMode.ANY (满足其一) | PermissionMode.ALL (满足全部) */
  mode?: PermissionMode
}

const props = withDefaults(defineProps<Props>(), {
  mode: PermissionMode.ANY
})

const { hasPermission } = usePermission()
</script>

<template>
  <slot v-if="hasPermission(props.value, props.mode)" />
  <slot v-else name="no-permission" />
</template>
