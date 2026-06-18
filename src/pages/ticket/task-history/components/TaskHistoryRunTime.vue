<template>
  <div v-if="isTiming" class="time-info">
    <div v-if="scheduledTime" class="time-item plan"><span class="label">计:</span> {{ scheduledTime }}</div>
    <div v-if="startTime" class="time-item start"><span class="label">始:</span> {{ startTime }}</div>
  </div>
  <span v-else class="time-text">{{ startTime || "--" }}</span>
</template>

<script setup lang="ts">
defineProps<{
  isTiming: boolean
  scheduledTime: string
  startTime: string
}>()
</script>

<style scoped lang="scss">
.time-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  &.plan {
    color: #334155;
  }

  &.start {
    color: #334155;
  }
}

.label {
  opacity: 0.6;
  font-weight: 700;
}

.time-text {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: #4b5563;
}
</style>
