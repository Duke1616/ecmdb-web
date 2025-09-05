<template>
  <FileManager
    v-bind="$attrs"
    @update:files="$emit('update:files', $event)"
    @file-change="$emit('file-change', $event)"
    @project-save="$emit('project-save', $event)"
  />
</template>

<script setup lang="ts">
import FileManager from './FileManager.vue'

defineOptions({
  inheritAttrs: false
})

defineEmits<{
  (e: 'update:files', files: any[]): void
  (e: 'file-change', file: any): void
  (e: 'project-save', files: any[]): void
}>()
</script>
