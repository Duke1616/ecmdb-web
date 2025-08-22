<!-- vite-plugin-svg-icons 插件使用方式，在当前项目中已经弃用 -->

<script lang="ts" setup>
import { computed } from "vue"

interface Props {
  prefix?: string
  size?: string
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  prefix: "icon"
})

const symbolId = computed(() => `#${props.prefix}-${props.name}`)
</script>

<template>
  <svg class="svg-icon" aria-hidden="true" :style="{ height: props.size, width: props.size }">
    <use :href="symbolId" />
  </svg>
</template>

<style lang="scss" scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  overflow: hidden;
}
</style>
