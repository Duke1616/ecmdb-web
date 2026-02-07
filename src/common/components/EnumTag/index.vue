<script setup lang="ts">
import { computed } from "vue"

export interface TagInfo {
  type: "info" | "primary" | "success" | "warning" | "danger"
  text: string
}

type Effect = "dark" | "light" | "plain"

const props = defineProps<{
  value?: string | number | boolean
  map: Record<string | number, TagInfo>
  effect?: Effect
  defaultText?: string
  defaultType?: string
}>()

const current = computed<TagInfo>(() => {
  // NOTE: 处理 undefined 或 null 值，避免类型检查警告
  if (props.value === undefined || props.value === null) {
    return {
      type: (props.defaultType as TagInfo["type"]) ?? "info",
      text: props.defaultText ?? "未知"
    }
  }

  return (
    props.map[props.value as string | number] ?? {
      type: (props.defaultType as TagInfo["type"]) ?? "info",
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
