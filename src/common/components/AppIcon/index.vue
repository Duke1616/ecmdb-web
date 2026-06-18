<template>
  <img
    v-if="iconSource === 'image'"
    :src="resolvedName"
    class="app-icon-renderer app-icon-image"
    alt=""
    @error="handleImageError"
  />
  <i v-else-if="iconSource === 'font-awesome'" :class="fontAwesomeClass" class="app-icon-renderer" />
  <i v-else-if="iconSource === 'iconfont'" :class="iconfontClass" class="app-icon-renderer" />
  <component v-else-if="iconSource === 'element'" :is="elementIcon" class="app-icon-renderer" />
  <e-icon v-else-if="iconSource === 'e-icon'" :icon-name="resolvedName" class="app-icon-renderer" />
  <component v-else :is="fallbackIcon" class="app-icon-renderer" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Document } from "@element-plus/icons-vue"
import { elementIconMap, getIconfontClass, normalizeFontAwesomeClass, resolveAppIconSource } from "./utils"

const props = withDefaults(
  defineProps<{
    name?: string
    fallback?: string
  }>(),
  {
    name: "",
    fallback: "Document"
  }
)

const imageFailed = ref(false)

const resolvedName = computed(() => (imageFailed.value || !props.name ? props.fallback : props.name))
const iconSource = computed(() => resolveAppIconSource(resolvedName.value))

const elementIcon = computed(() => elementIconMap[resolvedName.value])
const fallbackIcon = computed(() => elementIconMap[props.fallback] || Document)
const iconfontClass = computed(() => getIconfontClass(resolvedName.value))
const fontAwesomeClass = computed(() => normalizeFontAwesomeClass(resolvedName.value))

const handleImageError = () => {
  imageFailed.value = true
}
</script>

<style scoped lang="scss">
.app-icon-renderer {
  display: inline-flex;
  width: 1em;
  height: 1em;
  align-items: center;
  justify-content: center;
  color: currentColor;
  font-size: inherit;
  line-height: 1;
}

:deep(svg.app-icon-renderer),
.app-icon-renderer :deep(svg) {
  width: 1em;
  height: 1em;
}

.app-icon-image {
  object-fit: contain;
}
</style>
