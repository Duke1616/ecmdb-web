<template>
  <GatewayProperty ref="gatewayPropertyRef" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { ref } from "vue"
import GatewayProperty from "../gateway/GatewayProperty.vue"

const gatewayPropertyRef = ref()

const confirmFunc = () => {
  return gatewayPropertyRef.value?.confirmFunc?.()
}

defineExpose({
  confirmFunc
})
</script>
