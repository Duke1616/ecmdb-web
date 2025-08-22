<script setup lang="ts">
import { computed } from "vue"

export interface TagInfo {
  type: "info" | "primary" | "success" | "warning" | "danger"
  text: string
}

type Effect = "dark" | "light" | "plain"

const props = defineProps<{
  value: string | number | boolean
  map: Record<string | number, TagInfo>
  effect?: Effect
  defaultText?: string
  defaultType?: string
}>()

const current = computed<TagInfo>(() => {
  return (
    props.map[props.value as string | number] ?? {
      type: props.defaultType ?? "info",
      text: props.defaultText ?? "未知"
    }
  )
})
</script>

<template>
  <el-tag :type="current.type" :effect="effect || 'plain'">
    {{ current.text }}
  </el-tag>
</template>
