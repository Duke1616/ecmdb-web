<template>
  <ExecutorTab ref="executorRef" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import ExecutorTab from "@/pages/task/executor/tabs/executor.vue"

const executorRef = ref<InstanceType<typeof ExecutorTab>>()
const loadedCount = computed(() => executorRef.value?.loadedCount ?? 0)
const hasMore = computed(() => executorRef.value?.hasMore ?? false)

defineExpose({
  listExecutorsData: () => executorRef.value?.listExecutorsData(),
  loadedCount,
  hasMore
})
</script>
